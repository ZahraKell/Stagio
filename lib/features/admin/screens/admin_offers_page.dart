import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../models/offer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/offer_detail_dialog.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/status_badge.dart';

final _adminOffersProvider = FutureProvider.autoDispose<List<Offer>>((ref) async {
  final res = await ApiClient().get(ApiPaths.adminOffers);
  return ApiClient.unwrapList(res.data, Offer.fromJson);
});

class AdminOffersPage extends ConsumerStatefulWidget {
  const AdminOffersPage({super.key});

  @override
  ConsumerState<AdminOffersPage> createState() => _AdminOffersPageState();
}

class _AdminOffersPageState extends ConsumerState<AdminOffersPage> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final offers = ref.watch(_adminOffersProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Offers'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Rechercher une offre...',
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
            child: offers.when(
              loading: () => const LoadingState(),
              error: (e, _) => ErrorRetry(
                message: 'Impossible de charger les offres',
                onRetry: () => ref.refresh(_adminOffersProvider),
              ),
              data: (list) {
                var filtered = list;
                if (_search.isNotEmpty) {
                  final q = _search.toLowerCase();
                  filtered = filtered
                      .where((o) =>
                  o.title.toLowerCase().contains(q) ||
                      o.companyName.toLowerCase().contains(q))
                      .toList();
                }
                if (filtered.isEmpty) {
                  return EmptyState(icon: Icons.work_off_outlined, title: 'Aucune offre trouvée');
                }
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(_adminOffersProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) => _AdminOfferCard(
                      offer: filtered[i],
                      onTap: () => showOfferDetailDialog(context, filtered[i].id),
                      onClose: () => _closeOffer(context, ref, filtered[i].id),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _closeOffer(BuildContext context, WidgetRef ref, int id) async {
    try {
      await ApiClient().patch(ApiPaths.adminOfferStatus(id), data: {'status': 'closed'});
      ref.refresh(_adminOffersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Offre fermée'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (context.mounted) {
        final msg = e.toString().contains('403')
            ? 'Permission refusée.'
            : 'Impossible de fermer l\'offre. Réessayez.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}

class _AdminOfferCard extends StatelessWidget {
  final Offer offer;
  final VoidCallback onTap;
  final VoidCallback onClose;
  const _AdminOfferCard({required this.offer, required this.onTap, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(offer.title, style: AppTextStyles.h3.copyWith(fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(offer.companyName, style: AppTextStyles.bodyMid),
                  ],
                ),
              ),
              StatusBadge(status: offer.status),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textLight),
              const SizedBox(width: 4),
              Text(offer.town, style: AppTextStyles.small),
              const SizedBox(width: 14),
              const Icon(Icons.work_outline, size: 14, color: AppColors.textLight),
              const SizedBox(width: 4),
              Text(offer.typeLabel, style: AppTextStyles.small),
            ],
          ),
          if (offer.status == 'open') ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: onClose,
                  icon: const Icon(Icons.close, size: 16, color: AppColors.danger),
                  label: const Text('Fermer', style: TextStyle(color: AppColors.danger, fontSize: 13)),
                ),
              ],
            ),
          ],
        ],
      ),
    ),
    );
  }
}
