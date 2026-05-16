import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/stat_card.dart';

final _administrationDashProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final studentsRes = await ApiClient().get(ApiPaths.administrationStudents);
  final pendingRes = await ApiClient().get(ApiPaths.applicationsPendingValidation);

  final students = ApiClient.extractList(studentsRes.data);
  List<Map<String, dynamic>> pending = [];
  final raw = pendingRes.data;
  if (raw is Map && raw['pending_validations'] is List) {
    pending = (raw['pending_validations'] as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  return {
    'student_count': students.length,
    'pending_count': pending.length,
    'recent_pending': pending.take(5).toList(),
  };
});

class AdministrationDashboardPage extends ConsumerWidget {
  const AdministrationDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(_administrationDashProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Administration'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: dash.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Could not load dashboard',
          onRetry: () => ref.refresh(_administrationDashProvider),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () => ref.refresh(_administrationDashProvider.future),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'University administration',
                  style: AppTextStyles.h2,
                ),
                const SizedBox(height: 8),
                Text(
                  'Manage students and validate internships for your institution.',
                  style: AppTextStyles.bodyMid,
                ),
                const SizedBox(height: 24),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.35,
                  children: [
                    StatCard(
                      label: 'Students',
                      value: '${data['student_count']}',
                      icon: Icons.school_outlined,
                      gradientColors: const [AppColors.accent, AppColors.gradientEnd],
                    ),
                    StatCard(
                      label: 'To validate',
                      value: '${data['pending_count']}',
                      icon: Icons.fact_check_outlined,
                      gradientColors: const [AppColors.warning, AppColors.gradientStart],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _QuickTile(
                        icon: Icons.school,
                        label: 'Students',
                        onTap: () => context.go('/administration/students'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickTile(
                        icon: Icons.assignment_turned_in,
                        label: 'Validations',
                        onTap: () => context.go('/administration/conventions'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text('Pending validations', style: AppTextStyles.h3),
                const SizedBox(height: 12),
                if ((data['recent_pending'] as List).isEmpty)
                  const EmptyState(
                    icon: Icons.inbox_outlined,
                    title: 'All caught up',
                  )
                else
                  ...(data['recent_pending'] as List).map((p) {
                    final m = p as Map<String, dynamic>;
                    return ListTile(
                      tileColor: AppColors.cardBg,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: const Icon(Icons.pending_actions, color: AppColors.warning),
                      title: Text(m['student_name']?.toString() ?? ''),
                      subtitle: Text(m['offer_title']?.toString() ?? ''),
                    );
                  }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 32),
            const SizedBox(height: 8),
            Text(label, style: AppTextStyles.bodyMid),
          ],
        ),
      ),
    );
  }
}
