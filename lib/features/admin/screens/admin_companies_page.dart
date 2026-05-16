import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';

final _allCompaniesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.adminCompanies);
  return ApiClient.extractList(res.data)
      .map((e) => Map<String, dynamic>.from(e as Map))
      .toList();
});

class AdminCompaniesPage extends ConsumerStatefulWidget {
  const AdminCompaniesPage({super.key});

  @override
  ConsumerState<AdminCompaniesPage> createState() => _AdminCompaniesPageState();
}

class _AdminCompaniesPageState extends ConsumerState<AdminCompaniesPage>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final companies = ref.watch(_allCompaniesProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Entreprises'),
        bottom: TabBar(
          controller: _tab,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textLight,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En attente'),
            Tab(text: 'Approuvées'),
          ],
        ),
      ),
      body: companies.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger les entreprises',
          onRetry: () => ref.refresh(_allCompaniesProvider),
        ),
        data: (list) => TabBarView(
          controller: _tab,
          children: [
            _CompanyList(companies: list, ref: ref, onRefresh: () => ref.refresh(_allCompaniesProvider.future)),
            _CompanyList(companies: list.where((c) => c['status'] == 'pending_approval').toList(), ref: ref, onRefresh: () => ref.refresh(_allCompaniesProvider.future), showActions: true),
            _CompanyList(companies: list.where((c) => c['status'] == 'approved').toList(), ref: ref, onRefresh: () => ref.refresh(_allCompaniesProvider.future)),
          ],
        ),
      ),
    );
  }
}

class _CompanyList extends StatelessWidget {
  final List<Map<String, dynamic>> companies;
  final WidgetRef ref;
  final Future<void> Function() onRefresh;
  final bool showActions;
  const _CompanyList({required this.companies, required this.ref, required this.onRefresh, this.showActions = false});

  @override
  Widget build(BuildContext context) {
    if (companies.isEmpty) {
      return EmptyState(icon: Icons.business_outlined, title: 'Aucune entreprise');
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: companies.length,
        itemBuilder: (_, i) => _CompanyCard(
          company: companies[i],
          showActions: showActions,
          onAction: (id, status) => _changeStatus(context, id, status),
        ),
      ),
    );
  }

  Future<void> _changeStatus(BuildContext context, int id, String status) async {
    try {
      if (status == 'approved') {
        await ApiClient().post(ApiPaths.adminCompanyApprove(id));
      } else {
        await ApiClient().post(
          ApiPaths.adminCompanyReject(id),
          data: {'reason': 'Profil incomplet ou non conforme'},
        );
      }
      ref.refresh(_allCompaniesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(status == 'approved' ? 'Entreprise approuvée' : 'Entreprise refusée'),
            backgroundColor: status == 'approved' ? AppColors.success : AppColors.danger,
          ),
        );
      }
    } catch (_) {}
  }
}

class _CompanyCard extends StatelessWidget {
  final Map<String, dynamic> company;
  final bool showActions;
  final void Function(int id, String status) onAction;
  const _CompanyCard({required this.company, required this.showActions, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final name = company['company_name'] ?? company['full_name'] ?? 'Entreprise';
    final email = company['email'] ?? '';
    final sector = company['sector'] ?? '';
    final status = company['status'] ?? 'pending_approval';
    final id = company['id'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: AppColors.navyGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Icon(Icons.business, color: Colors.white, size: 22)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name.toString(), style: AppTextStyles.h3.copyWith(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (sector.isNotEmpty) Text(sector.toString(), style: AppTextStyles.small),
                    Text(email.toString(), style: AppTextStyles.small, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              StatusBadge(status: status),
            ],
          ),
          if (showActions && status == 'pending_approval') ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => onAction(id, 'rejected'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.danger),
                      foregroundColor: AppColors.danger,
                      minimumSize: const Size(0, 44),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Refuser'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => onAction(id, 'approved'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      minimumSize: const Size(0, 44),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Approuver'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
