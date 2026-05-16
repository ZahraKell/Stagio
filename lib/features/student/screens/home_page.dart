import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../models/application.dart';
import '../../../models/offer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/offer_card.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/status_badge.dart';

final _studentDashProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ApiClient();
  Response? profileRes;
  Response? appsRes;
  Response? offersRes;
  try {
    profileRes = await api.get(ApiPaths.authMe);
  } catch (_) {}
  try {
    appsRes = await api.get(ApiPaths.applicationsMine);
  } catch (_) {}
  try {
    offersRes = await api.get(ApiPaths.offers);
  } catch (_) {}

  final profile = ApiClient.extractMap(profileRes?.data) ?? <String, dynamic>{};
  final apps = ApiClient.unwrapList(appsRes?.data, Application.fromJson);
  final offers = ApiClient.unwrapList(offersRes?.data, Offer.fromJson).take(6).toList();

  return {'profile': profile, 'apps': apps, 'offers': offers};
});

class StudentHomePage extends ConsumerWidget {
  const StudentHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(_studentDashProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: data.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(message: e.toString(), onRetry: () => ref.refresh(_studentDashProvider)),
        data: (d) => _buildContent(context, ref, d),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Map<String, dynamic> d) {
    final profile = d['profile'] as Map<String, dynamic>;
    final apps = d['apps'] as List<Application>;
    final offers = d['offers'] as List<Offer>;
    final name = profile['full_name'] ?? profile['name'] ?? 'Étudiant';
    final pending = apps.where((a) => a.status == 'pending').length;
    final accepted = apps.where((a) => a.status == 'accepted').length;
    final rejected = apps.where((a) => a.status == 'rejected').length;

    return RefreshIndicator(
      onRefresh: () => ref.refresh(_studentDashProvider.future),
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.navyGradient),
                padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      _greeting(),
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Salut, ${name.toString().split(' ').first} 👋',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => context.go('/student/offers'),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white30),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: const Row(
                          children: [
                            Icon(Icons.search, color: Colors.white70, size: 20),
                            SizedBox(width: 10),
                            Text(
                              'Rechercher une offre...',
                              style: TextStyle(color: Colors.white60, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildWelcomeBanner(context),
                const SizedBox(height: 24),
                SectionHeader(title: 'Mes statistiques'),
                const SizedBox(height: 12),
                _buildStatsRow(apps.length, pending, accepted, rejected),
                const SizedBox(height: 24),
                if (apps.isNotEmpty) ...[
                  SectionHeader(
                    title: 'Candidatures récentes',
                    actionLabel: 'Voir tout',
                    onAction: () => context.go('/student/applications'),
                  ),
                  const SizedBox(height: 12),
                  _buildRecentApps(context, apps.take(3).toList()),
                  const SizedBox(height: 24),
                ],
                SectionHeader(
                  title: 'Offres recommandées',
                  actionLabel: 'Voir tout',
                  onAction: () => context.go('/student/offers'),
                ),
                const SizedBox(height: 12),
                if (offers.isEmpty)
                  EmptyState(icon: Icons.work_off_outlined, title: 'Aucune offre disponible')
                else
                  ...offers.map((o) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: OfferCard(
                      offer: o,
                      onTap: () => context.push('/student/offers/${o.id}'),
                    ),
                  )),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.gradientMid.withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Bienvenue !',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Trouvez votre stage idéal\nparmi des centaines d\'offres',
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: () => context.go('/student/offers'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    minimumSize: const Size(120, 38),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    elevation: 0,
                  ),
                  child: const Text('Explorer', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          const Icon(Icons.laptop_mac, color: Colors.white54, size: 80),
        ],
      ),
    );
  }

  Widget _buildStatsRow(int total, int pending, int accepted, int rejected) {
    return Row(
      children: [
        Expanded(
          child: _StatMini(
            value: total.toString(),
            label: 'Total',
            color: AppColors.accent,
            icon: Icons.send_outlined,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatMini(
            value: pending.toString(),
            label: 'En attente',
            color: AppColors.warning,
            icon: Icons.hourglass_empty_outlined,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatMini(
            value: accepted.toString(),
            label: 'Acceptées',
            color: AppColors.success,
            icon: Icons.check_circle_outline,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentApps(BuildContext context, List<Application> apps) {
    return Column(
      children: apps.map((app) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 3)),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: AppColors.navyGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    app.companyInitials,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(app.offerTitle, style: AppTextStyles.h3.copyWith(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(app.company, style: AppTextStyles.small),
                  ],
                ),
              ),
              StatusBadge(status: app.status),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
}

class _StatMini extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final IconData icon;

  const _StatMini({required this.value, required this.label, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.small, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
