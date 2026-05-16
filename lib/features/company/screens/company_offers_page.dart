import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../models/offer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/offer_card.dart';
import '../../../shared/widgets/status_badge.dart';

final _companyOffersProvider = FutureProvider.autoDispose<List<Offer>>((ref) async {
  final res = await ApiClient().get(ApiPaths.offersMine);
  return ApiClient.unwrapList(res.data, Offer.fromJson);
});

class CompanyOffersPage extends ConsumerWidget {
  const CompanyOffersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = ref.watch(_companyOffersProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(title: const Text('My offers')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/company/offers/create'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Publish offer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: offers.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger vos offres',
          onRetry: () => ref.refresh(_companyOffersProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.work_outline,
              title: 'Aucune offre publiée',
              subtitle: 'Créez votre première offre de stage',
              actionLabel: 'Créer une offre',
              onAction: () => context.push('/company/offers/create'),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(_companyOffersProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: list.length,
              itemBuilder: (_, i) {
                final offer = list[i];
                return _CompanyOfferCard(
                  offer: offer,
                  onEdit: () => context.push('/company/offers/${offer.id}/edit'),
                  onDelete: () => _confirmDelete(context, ref, offer.id),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, int id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer l\'offre'),
        content: const Text('Êtes-vous sûr de vouloir supprimer cette offre ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ApiClient().delete(ApiPaths.offerDelete(id));
                ref.refresh(_companyOffersProvider);
              } catch (_) {}
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}

class _CompanyOfferCard extends StatelessWidget {
  final Offer offer;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _CompanyOfferCard({required this.offer, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(offer.title, style: AppTextStyles.h3, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textLight),
                          const SizedBox(width: 4),
                          Text(offer.town, style: AppTextStyles.small),
                          const SizedBox(width: 12),
                          const Icon(Icons.access_time_outlined, size: 14, color: AppColors.textLight),
                          const SizedBox(width: 4),
                          Text(offer.duration, style: AppTextStyles.small),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(children: [StatusBadge(status: offer.status), const SizedBox(width: 8), _TypeChip(label: offer.typeLabel)]),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'edit') onEdit();
                    if (v == 'delete') onDelete();
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Modifier')])),
                    const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: AppColors.danger), SizedBox(width: 8), Text('Supprimer', style: TextStyle(color: AppColors.danger))])),
                  ],
                ),
              ],
            ),
          ),
          if (offer.deadline != null)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, size: 13, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text('Clôture : ${offer.deadline}', style: AppTextStyles.small),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  const _TypeChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
