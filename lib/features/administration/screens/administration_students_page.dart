import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/student_cv_sheet.dart';

final _scopedStudentsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.administrationStudents);
  return ApiClient.extractList(res.data)
      .map((e) => Map<String, dynamic>.from(e as Map))
      .toList();
});

/// Students from the administration officer's university only (not platform admin users list).
class AdministrationStudentsPage extends ConsumerStatefulWidget {
  const AdministrationStudentsPage({super.key});

  @override
  ConsumerState<AdministrationStudentsPage> createState() =>
      _AdministrationStudentsPageState();
}

class _AdministrationStudentsPageState extends ConsumerState<AdministrationStudentsPage> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final students = ref.watch(_scopedStudentsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('University students'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name, email, or student number...',
                prefixIcon: Icon(Icons.search, color: AppColors.textLight),
              ),
              onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
            ),
          ),
          Expanded(
            child: students.when(
              loading: () => const LoadingState(),
              error: (e, _) => ErrorRetry(
                message: 'Could not load students for your institution',
                onRetry: () => ref.refresh(_scopedStudentsProvider),
              ),
              data: (list) {
                var filtered = list;
                if (_search.isNotEmpty) {
                  filtered = list.where((s) {
                    final hay = '${s['full_name']} ${s['email']} ${s['student_number']}'
                        .toLowerCase();
                    return hay.contains(_search);
                  }).toList();
                }
                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.school_outlined,
                    title: 'No students found',
                    subtitle: 'Only students with your university email domain appear here.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(_scopedStudentsProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final s = filtered[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.accent.withValues(alpha: 0.15),
                            child: const Icon(Icons.school, color: AppColors.accent),
                          ),
                          title: Text(
                            s['full_name']?.toString() ?? '',
                            style: AppTextStyles.h3.copyWith(fontSize: 14),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s['email']?.toString() ?? '', style: AppTextStyles.small),
                              if (s['institution'] != null)
                                Text(s['institution'].toString(), style: AppTextStyles.small),
                              if (s['speciality'] != null)
                                Text(
                                  '${s['speciality']} · ${s['grade'] ?? ''}',
                                  style: AppTextStyles.small,
                                ),
                            ],
                          ),
                          isThreeLine: true,
                          trailing: IconButton(
                            icon: const Icon(Icons.description_outlined),
                            tooltip: 'View CV',
                            onPressed: () {
                              final sid = s['id'];
                              if (sid != null) {
                                showStudentCvSheet(
                                  context,
                                  studentId: sid is int ? sid : int.parse(sid.toString()),
                                  studentName: s['full_name']?.toString(),
                                );
                              }
                            },
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
