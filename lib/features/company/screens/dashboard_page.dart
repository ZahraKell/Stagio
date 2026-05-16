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
import '../../../shared/widgets/status_badge.dart';

final _companyDashProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ApiClient();
  Response? appsRes;
  Response? offersRes;
  Response? internsRes;
  Response? profileRes;
  try {
    appsRes = await api.get(ApiPaths.applicationsCompany);
  } catch (_) {}
  try {
    offersRes = await api.get(ApiPaths.offersMine);
  } catch (_) {}
  try {
    internsRes = await api.get(ApiPaths.applicationsMyInterns);
  } catch (_) {}
  try {
    profileRes = await api.get(ApiPaths.authMe);
  } catch (_) {}

  final apps = ApiClient.extractList(appsRes?.data);
  final offers = ApiClient.extractList(offersRes?.data);
  final convs = ApiClient.extractList(internsRes?.data);
  final profile = ApiClient.extractMap(profileRes?.data) ?? <String, dynamic>{};

  final now = DateTime.now();
  final weekAgo = now.subtract(const Duration(days: 7));
  final newThisWeek = apps.where((a) {
    try {
      final d = DateTime.parse((a as Map)['application_date']?.toString() ?? '');
      return d.isAfter(weekAgo);
    } catch (_) {
      return false;
    }
  }).length;

  return {
    'profile': profile,
    'apps': apps,
    'offers': offers,
    'convs': convs,
    'new_this_week': newThisWeek,
    'pending_apps': apps.where((a) => (a as Map)['status'] == 'pending').length,
    'open_offers': offers.where((o) => (o as Map)['status'] == 'open').length,
    'active_interns': convs.length,
  };
});

class CompanyDashboardPage extends ConsumerWidget {
  const CompanyDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(_companyDashProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: dash.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger le tableau de bord',
          onRetry: () => ref.refresh(_companyDashProvider),
        ),
        data: (data) {
          final profile = data['profile'] as Map<String, dynamic>;
          final apps = data['apps'] as List;
          final offers = data['offers'] as List;
          return RefreshIndicator(
            onRefresh: () => ref.refresh(_companyDashProvider.future),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour, ${profile['full_name'] ?? 'Entreprise'} 👋',
                    style: AppTextStyles.h2,
                  ),
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
                        label: 'Candidatures',
                        value: '${apps.length}',
                        icon: Icons.people_outline,
                        gradientColors: const [AppColors.primary, AppColors.navyLight],
                      ),
                      StatCard(
                        label: 'Nouvelles (7j)',
                        value: '${data['new_this_week']}',
                        icon: Icons.fiber_new_outlined,
                        gradientColors: const [AppColors.accent, AppColors.gradientEnd],
                      ),
                      StatCard(
                        label: 'Offres ouvertes',
                        value: '${data['open_offers']}',
                        icon: Icons.work_outline,
                        gradientColors: const [AppColors.success, Color(0xFF16A34A)],
                      ),
                      StatCard(
                        label: 'Stagiaires',
                        value: '${data['active_interns']}',
                        icon: Icons.badge_outlined,
                        gradientColors: const [AppColors.warning, AppColors.gradientStart],
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  const SectionHeader(title: 'Actions rapides'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.add_circle_outline,
                          label: 'Publier une offre',
                          onTap: () => context.go('/company/offers/create'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.inbox_outlined,
                          label: 'Candidatures',
                          onTap: () => context.go('/company/applications'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  SectionHeader(
                    title: 'Mes offres (${offers.length})',
                    actionLabel: 'Voir tout',
                    onAction: () => context.go('/company/offers'),
                  ),
                  const SizedBox(height: 12),
                  if (offers.isEmpty)
                    const EmptyState(
                      icon: Icons.work_off_outlined,
                      title: 'Aucune offre publiée',
                    )
                  else
                    ...offers.take(3).map((o) {
                      final offer = o as Map<String, dynamic>;
                      return _OfferRow(offer: offer);
                    }),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.onTap});

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
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 8),
            Text(label, style: AppTextStyles.small, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _OfferRow extends StatelessWidget {
  final Map<String, dynamic> offer;
  const _OfferRow({required this.offer});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(offer['title']?.toString() ?? '', style: AppTextStyles.h3.copyWith(fontSize: 14)),
                Text(offer['town']?.toString() ?? '', style: AppTextStyles.small),
              ],
            ),
          ),
          StatusBadge(status: offer['status']?.toString() ?? 'open'),
        ],
      ),
    );
  }
}
