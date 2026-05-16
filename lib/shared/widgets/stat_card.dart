import 'package:flutter/material.dart';
import '../../core/theme.dart';

class StatCard extends StatelessWidget {
  final String value;
  final String label;
  final String? sub;
  final IconData icon;
  final List<Color> gradientColors;

  const StatCard({
    super.key,
    required this.value,
    required this.label,
    this.sub,
    required this.icon,
    required this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradientColors),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 4),
          Text(label, style: AppTextStyles.small),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(sub!, style: AppTextStyles.small.copyWith(color: AppColors.accent)),
          ],
        ],
      ),
    );
  }
}
