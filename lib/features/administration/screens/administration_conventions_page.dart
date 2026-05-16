import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/api_error.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';

final _pendingValidationsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.applicationsPendingValidation);
  final data = res.data;
  if (data is Map && data['pending_validations'] is List) {
    return (data['pending_validations'] as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }
  return [];
});

class AdministrationConventionsPage extends ConsumerWidget {
  const AdministrationConventionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pending = ref.watch(_pendingValidationsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Internship validations'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: pending.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Could not load pending validations',
          onRetry: () => ref.refresh(_pendingValidationsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.assignment_turned_in_outlined,
              title: 'No pending validations',
              subtitle: 'Accepted applications from your students will appear here.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(_pendingValidationsProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (_, i) {
                final item = list[i];
                final appId = item['application_id'];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.person_outline, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                item['student_name']?.toString() ?? 'Student',
                                style: AppTextStyles.h3.copyWith(fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item['offer_title']?.toString() ?? '',
                          style: AppTextStyles.bodyMid,
                        ),
                        Text(
                          'Company: ${item['company_name'] ?? ''}',
                          style: AppTextStyles.small,
                        ),
                        Text(
                          'Location: ${item['offer_town'] ?? ''}',
                          style: AppTextStyles.small,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: appId == null
                                ? null
                                : () => _validate(context, ref, appId as int),
                            icon: const Icon(Icons.check_circle_outline),
                            label: const Text('Validate internship'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.success,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _validate(BuildContext context, WidgetRef ref, int applicationId) async {
    try {
      await ApiClient().put(ApiPaths.applicationValidate(applicationId));
      ref.invalidate(_pendingValidationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Internship validated'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(parseApiError(e)), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}
