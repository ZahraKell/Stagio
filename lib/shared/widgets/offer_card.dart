import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../models/offer.dart';

class OfferCard extends StatelessWidget {
  final Offer offer;
  final VoidCallback? onTap;
  final VoidCallback? onApply;
  final bool showApplyButton;

  const OfferCard({
    super.key,
    required this.offer,
    this.onTap,
    this.onApply,
    this.showApplyButton = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.title,
                    style: AppTextStyles.h3,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  _buildMeta(),
                  if (offer.skillsList.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildSkills(),
                  ],
                  if (showApplyButton) ...[
                    const SizedBox(height: 12),
                    _buildApplyButton(),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Stack(
      children: [
        SizedBox(
          height: 120,
          width: double.infinity,
          child: CachedNetworkImage(
            imageUrl: AppConstants.offerImage(offer.id),
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: AppColors.border),
            errorWidget: (_, __, ___) => Container(
              color: AppColors.primary.withOpacity(0.1),
              child: const Icon(Icons.business, color: AppColors.textLight, size: 40),
            ),
          ),
        ),
        Container(
          height: 120,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
        Positioned(
          bottom: 12,
          left: 16,
          child: Row(
            children: [
              _CompanyAvatar(initials: offer.companyInitials),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.companyName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  if (offer.companySector != null)
                    Text(
                      offer.companySector!,
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                ],
              ),
            ],
          ),
        ),
        Positioned(
          top: 12,
          right: 12,
          child: _TypeBadge(label: offer.typeLabel),
        ),
      ],
    );
  }

  Widget _buildMeta() {
    return Wrap(
      spacing: 12,
      runSpacing: 6,
      children: [
        _MetaPill(icon: Icons.location_on_outlined, label: offer.town),
        _MetaPill(icon: Icons.access_time_outlined, label: offer.duration),
        if (offer.isPaid)
          _MetaPill(
            icon: Icons.attach_money,
            label: offer.salary != null ? offer.salary! : 'Rémunéré',
            color: AppColors.success,
          )
        else
          _MetaPill(icon: Icons.money_off, label: 'Non rémunéré', color: AppColors.textLight),
      ],
    );
  }

  Widget _buildSkills() {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: offer.skillsList
          .take(4)
          .map(
            (s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                s,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildApplyButton() {
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: ElevatedButton(
        onPressed: onApply,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: const Text('Postuler', style: TextStyle(fontSize: 14)),
      ),
    );
  }
}

class _CompanyAvatar extends StatelessWidget {
  final String initials;
  const _CompanyAvatar({required this.initials});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String label;
  const _TypeBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  const _MetaPill({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.textMid;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: c),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: c, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
