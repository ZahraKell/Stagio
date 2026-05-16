import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/constants.dart';
import '../../../core/theme.dart';
import '../../../models/offer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';

final _offerDetailProvider = FutureProvider.family.autoDispose<Offer, int>((ref, id) async {
  final api = ApiClient();
  final res = await api.get(ApiPaths.offer(id));
  final data = ApiClient.extractMap(res.data);
  if (data == null) throw Exception('Offre introuvable');
  return Offer.fromJson(data);
});

class OfferDetailPage extends ConsumerStatefulWidget {
  final int offerId;
  const OfferDetailPage({super.key, required this.offerId});

  @override
  ConsumerState<OfferDetailPage> createState() => _OfferDetailPageState();
}

class _OfferDetailPageState extends ConsumerState<OfferDetailPage> {
  bool _applying = false;
  bool _applied = false;

  Future<void> _apply() async {
    setState(() => _applying = true);
    try {
      await ApiClient().post(ApiPaths.applications, data: {'offer': widget.offerId});
      setState(() { _applied = true; _applying = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Application submitted successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _applying = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = ref.watch(_offerDetailProvider(widget.offerId));
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: offer.when(
        loading: () => const Scaffold(body: LoadingState()),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: ErrorRetry(message: 'Impossible de charger cette offre', onRetry: () => ref.refresh(_offerDetailProvider(widget.offerId))),
        ),
        data: (o) => _buildBody(o),
      ),
    );
  }

  Widget _buildBody(Offer offer) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 220,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: AppConstants.offerImage(offer.id),
                  fit: BoxFit.cover,
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 20,
                  left: 20,
                  right: 20,
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: Center(
                          child: Text(
                            offer.companyInitials,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(offer.companyName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                          Text(offer.field ?? '', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Text(offer.title, style: AppTextStyles.h1),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _InfoChip(icon: Icons.location_on_outlined, label: offer.town),
                  _InfoChip(icon: Icons.access_time_outlined, label: offer.duration),
                  _InfoChip(
                    icon: offer.isPaid ? Icons.attach_money : Icons.money_off,
                    label: offer.isPaid ? (offer.salary ?? 'Rémunéré') : 'Non rémunéré',
                    color: offer.isPaid ? AppColors.success : AppColors.textMid,
                  ),
                  StatusBadge(status: offer.status),
                  _InfoChip(icon: Icons.work_outline, label: offer.typeLabel),
                ],
              ),
              if (offer.deadline != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.danger),
                    const SizedBox(width: 6),
                    Text(
                      'Date limite : ${_formatDate(offer.deadline!)}',
                      style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 24),
              _buildSection('Description', offer.description ?? 'Aucune description disponible.'),
              if (offer.skillsList.isNotEmpty) ...[
                const SizedBox(height: 20),
                _buildSkillsSection(offer.skillsList),
              ],
              const SizedBox(height: 32),
              _buildApplyButton(),
              const SizedBox(height: 40),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTextStyles.h3),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12)],
          ),
          child: Text(content, style: AppTextStyles.body.copyWith(height: 1.6)),
        ),
      ],
    );
  }

  Widget _buildSkillsSection(List<String> skills) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Compétences requises', style: AppTextStyles.h3),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: skills.map((s) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.accent.withOpacity(0.3)),
            ),
            child: Text(s, style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600, fontSize: 13)),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildApplyButton() {
    if (_applied) {
      return Container(
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.success.withOpacity(0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.success.withOpacity(0.4)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: AppColors.success),
            SizedBox(width: 10),
            Text('Application sent', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 15)),
          ],
        ),
      );
    }
    return Container(
      height: 52,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: AppColors.gradientMid.withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _applying ? null : _apply,
          borderRadius: BorderRadius.circular(14),
          child: Center(
            child: _applying
                ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                : const Text('Apply now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
          ),
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  const _InfoChip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.textMid;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: c),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, color: c, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
