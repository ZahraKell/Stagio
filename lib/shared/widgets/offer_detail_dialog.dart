import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../models/offer.dart';
import 'status_badge.dart';

Future<void> showOfferDetailDialog(BuildContext context, int offerId) async {
  await showDialog<void>(
    context: context,
    builder: (ctx) => _OfferDetailDialog(offerId: offerId),
  );
}

class _OfferDetailDialog extends ConsumerWidget {
  final int offerId;
  const _OfferDetailDialog({required this.offerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: ApiClient().get(ApiPaths.offer(offerId)),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const AlertDialog(
            content: SizedBox(height: 80, child: Center(child: CircularProgressIndicator())),
          );
        }
        if (snap.hasError) {
          return AlertDialog(
            title: const Text('Offer details'),
            content: const Text('Could not load offer.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
            ],
          );
        }
        final data = ApiClient.extractMap(snap.data?.data);
        if (data == null) {
          return AlertDialog(
            content: const Text('Offer not found.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
            ],
          );
        }
        final offer = Offer.fromJson(data);
        return AlertDialog(
          title: Row(
            children: [
              Expanded(child: Text(offer.title, style: AppTextStyles.h3.copyWith(fontSize: 16))),
              StatusBadge(status: offer.status),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _row(Icons.business_outlined, offer.companyName),
                _row(Icons.location_on_outlined, offer.town),
                _row(Icons.schedule, offer.duration),
                _row(Icons.category_outlined, offer.typeLabel),
                _row(Icons.payments_outlined, offer.isPaid ? 'Paid' : 'Unpaid'),
                if (offer.deadline != null) _row(Icons.event, 'Deadline: ${offer.deadline}'),
                const SizedBox(height: 12),
                Text('Description', style: AppTextStyles.label),
                const SizedBox(height: 6),
                Text(
                  offer.description?.isNotEmpty == true
                      ? offer.description!
                      : 'No description.',
                  style: AppTextStyles.bodyMid,
                ),
                if (offer.skillsList.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('Skills', style: AppTextStyles.label),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: offer.skillsList
                        .map((s) => Chip(label: Text(s, style: const TextStyle(fontSize: 11))))
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          ],
        );
      },
    );
  }

  Widget _row(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.accent),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: AppTextStyles.bodyMid)),
        ],
      ),
    );
  }
}
