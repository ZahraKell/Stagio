import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';

final _adminAppsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.applicationsAdminAll);
  final data = res.data;
  final list = data is List
      ? data
      : (data is Map && data['data'] is List ? data['data'] as List : []);
  return list.map((e) => e as Map<String, dynamic>).toList();
});

class AdminApplicationsPage extends ConsumerStatefulWidget {
  const AdminApplicationsPage({super.key});

  @override
  ConsumerState<AdminApplicationsPage> createState() => _AdminApplicationsPageState();
}

class _AdminApplicationsPageState extends ConsumerState<AdminApplicationsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final apps = ref.watch(_adminAppsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Toutes les candidatures'),
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textLight,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En attente'),
            Tab(text: 'En révision'),
            Tab(text: 'Acceptées'),
            Tab(text: 'Refusées'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Rechercher par étudiant ou offre...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textLight),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, color: AppColors.textLight),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _search = '');
                        },
                      )
                    : null,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(
            child: apps.when(
              loading: () => const LoadingState(),
              error: (e, _) => ErrorRetry(
                message: 'Impossible de charger les candidatures',
                onRetry: () => ref.refresh(_adminAppsProvider),
              ),
              data: (list) {
                var filtered = list;
                if (_search.isNotEmpty) {
                  final q = _search.toLowerCase();
                  filtered = filtered
                      .where((a) =>
                          (a['student_name'] ?? '').toString().toLowerCase().contains(q) ||
                          (a['offer_title'] ?? '').toString().toLowerCase().contains(q))
                      .toList();
                }
                return TabBarView(
                  controller: _tab,
                  children: [
                    _AppList(apps: filtered, onRefresh: () => ref.refresh(_adminAppsProvider.future)),
                    _AppList(apps: filtered.where((a) => a['status'] == 'pending').toList(), onRefresh: () => ref.refresh(_adminAppsProvider.future)),
                    _AppList(apps: filtered.where((a) => a['status'] == 'reviewed').toList(), onRefresh: () => ref.refresh(_adminAppsProvider.future)),
                    _AppList(apps: filtered.where((a) => a['status'] == 'accepted').toList(), onRefresh: () => ref.refresh(_adminAppsProvider.future)),
                    _AppList(apps: filtered.where((a) => a['status'] == 'refused').toList(), onRefresh: () => ref.refresh(_adminAppsProvider.future)),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _AppList extends StatelessWidget {
  final List<Map<String, dynamic>> apps;
  final Future<void> Function() onRefresh;
  const _AppList({required this.apps, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (apps.isEmpty) {
      return EmptyState(icon: Icons.assignment_outlined, title: 'Aucune candidature');
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: apps.length,
        itemBuilder: (_, i) => _AppCard(app: apps[i]),
      ),
    );
  }
}

class _AppCard extends StatelessWidget {
  final Map<String, dynamic> app;
  const _AppCard({required this.app});

  @override
  Widget build(BuildContext context) {
    final name = app['student_name'] ?? 'Étudiant';
    final offerTitle = app['offer_title'] ?? app['offer_company_name'] ?? '';
    final status = app['status'] ?? 'pending';
    final date = app['application_date'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Icon(Icons.person_outline, color: AppColors.primary, size: 22),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.toString(), style: AppTextStyles.h3.copyWith(fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(offerTitle.toString(), style: AppTextStyles.small, maxLines: 1, overflow: TextOverflow.ellipsis),
                if (date.isNotEmpty) Text(date.toString(), style: AppTextStyles.small.copyWith(fontSize: 10)),
              ],
            ),
          ),
          StatusBadge(status: status),
        ],
      ),
    );
  }
}
