import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/stat_card.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/status_badge.dart';

final _adminDashProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ApiClient();
  Response? usersRes;
  Response? appsRes;
  Response? pendingRes;
  Response? offersRes;
  try {
    usersRes = await api.get(ApiPaths.adminUsers);
  } catch (_) {}
  try {
    appsRes = await api.get(ApiPaths.applicationsAdminAll);
  } catch (_) {}
  try {
    pendingRes = await api.get(ApiPaths.adminCompaniesPending);
  } catch (_) {}
  try {
    offersRes = await api.get(ApiPaths.adminOffers);
  } catch (_) {}

  final users = ApiClient.extractList(usersRes?.data);
  final apps = ApiClient.extractList(appsRes?.data);
  final pendingComps = ApiClient.extractList(pendingRes?.data);
  final offers = ApiClient.extractList(offersRes?.data);

  return {
    'total_users': users.length,
    'total_students': users.where((u) => (u as Map)['role'] == 'student').length,
    'total_companies': users.where((u) => (u as Map)['role'] == 'company').length,
    'total_apps': apps.length,
    'total_offers': offers.length,
    'active_offers': offers.where((o) => (o as Map)['status'] == 'open').length,
    'pending_companies': pendingComps.length,
    'pending_apps': apps.where((a) => (a as Map)['status'] == 'pending').length,
    'accepted_apps': apps.where((a) => (a as Map)['status'] == 'accepted').length,
    'recent_apps': apps.take(5).toList(),
    'pending_comps_list': pendingComps.take(3).toList(),
  };
});

class AdminDashboardPage extends ConsumerWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(_adminDashProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: dash.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger le tableau de bord',
          onRetry: () => ref.refresh(_adminDashProvider),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () => ref.refresh(_adminDashProvider.future),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Tableau de bord Admin', style: AppTextStyles.h2),
                const SizedBox(height: 20),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    StatCard(
                      label: 'Utilisateurs',
                      value: '${data['total_users']}',
                      icon: Icons.people_outline,
                      gradientColors: const [AppColors.primary, AppColors.navyLight],
                    ),
                    StatCard(
                      label: 'Étudiants',
                      value: '${data['total_students']}',
                      icon: Icons.school_outlined,
                      gradientColors: const [AppColors.accent, AppColors.gradientEnd],
                    ),
                    StatCard(
                      label: 'Entreprises',
                      value: '${data['total_companies']}',
                      icon: Icons.business_outlined,
                      gradientColors: const [AppColors.success, Color(0xFF16A34A)],
                    ),
                    StatCard(
                      label: 'Candidatures',
                      value: '${data['total_apps']}',
                      icon: Icons.assignment_outlined,
                      gradientColors: const [AppColors.warning, AppColors.gradientStart],
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                SectionHeader(
                  title: 'Entreprises en attente (${data['pending_companies']})',
                  actionLabel: 'Voir tout',
                  onAction: () => context.go('/admin/companies'),
                ),
                const SizedBox(height: 12),
                if ((data['pending_comps_list'] as List).isEmpty)
                  const EmptyState(
                    icon: Icons.business_outlined,
                    title: 'Aucune entreprise en attente',
                  )
                else
                  ...(data['pending_comps_list'] as List).map((c) {
                    final comp = c as Map<String, dynamic>;
                    return _PendingCompanyCard(
                      company: comp,
                      onApprove: () => _reviewCompany(ref, comp['id'], approve: true, context: context),
                      onReject: () => _reviewCompany(ref, comp['id'], approve: false, context: context),
                    );
                  }),
                const SizedBox(height: 28),
                const SectionHeader(title: 'Candidatures récentes'),
                const SizedBox(height: 12),
                if ((data['recent_apps'] as List).isEmpty)
                  const EmptyState(icon: Icons.inbox_outlined, title: 'Aucune candidature')
                else
                  ...(data['recent_apps'] as List).map((a) {
                    final app = a as Map<String, dynamic>;
                    return ListTile(
                      tileColor: AppColors.cardBg,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      title: Text(app['offer_title']?.toString() ?? ''),
                      subtitle: Text(app['student_name']?.toString() ?? ''),
                      trailing: StatusBadge(status: app['status']?.toString() ?? 'pending'),
                    );
                  }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _reviewCompany(
    WidgetRef ref,
    dynamic id, {
    required bool approve,
    required BuildContext context,
  }) async {
    if (id == null) return;
    final companyId = id is int ? id : int.tryParse(id.toString());
    if (companyId == null) return;
    try {
      if (approve) {
        await ApiClient().post(ApiPaths.adminCompanyApprove(companyId));
      } else {
        await ApiClient().post(
          ApiPaths.adminCompanyReject(companyId),
          data: {'reason': 'Profil incomplet ou non conforme'},
        );
      }
      ref.invalidate(_adminDashProvider);
    } catch (_) {}
  }
}

class _PendingCompanyCard extends StatelessWidget {
  final Map<String, dynamic> company;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _PendingCompanyCard({
    required this.company,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            company['company_name']?.toString() ?? company['email']?.toString() ?? '',
            style: AppTextStyles.h3.copyWith(fontSize: 14),
          ),
          Text(company['email']?.toString() ?? '', style: AppTextStyles.small),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onReject,
                  child: const Text('Refuser'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: onApprove,
                  child: const Text('Approuver'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
