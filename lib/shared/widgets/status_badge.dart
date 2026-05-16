import 'package:flutter/material.dart';
import '../../core/theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final String? label;
  final double fontSize;

  const StatusBadge({super.key, required this.status, this.label, this.fontSize = 11});

  static const _labels = {
    'pending': 'En attente',
    'review': 'En révision',
    'reviewed': 'En révision',
    'accepted': 'Accepté',
    'refused': 'Refusé',
    'rejected': 'Refusé',
    'validated': 'Validé',
    'open': 'Ouverte',
    'closed': 'Fermée',
    'filled': 'Pourvue',
    'approved': 'Approuvée',
    'pending_approval': 'En attente',
  };

  @override
  Widget build(BuildContext context) {
    final color = AppColors.statusColor(status);
    final bg = AppColors.statusBg(status);
    final text = label ?? _labels[status] ?? status;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: fontSize * 0.36),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
