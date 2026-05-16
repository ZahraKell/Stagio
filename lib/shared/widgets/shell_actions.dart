import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../features/auth/auth_provider.dart';
import '../providers/notifications_provider.dart';
import 'notifications_sheet.dart';

/// App bar actions: notifications bell + optional logout (Material icons — always available).
List<Widget> shellAppBarActions(
  BuildContext context,
  WidgetRef ref, {
  bool showLogout = false,
}) {
  final unread = ref.watch(unreadCountProvider);
  final badge = unread.maybeWhen(data: (c) => c, orElse: () => 0);

  return [
    Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          tooltip: 'Notifications',
          onPressed: () => showNotificationsSheet(context, ref),
        ),
        if (badge > 0)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.danger,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              child: Text(
                badge > 9 ? '9+' : '$badge',
                style: const TextStyle(color: Colors.white, fontSize: 9),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    ),
    if (showLogout)
      IconButton(
        icon: const Icon(Icons.logout),
        tooltip: 'Log out',
        onPressed: () async {
          await ref.read(authProvider.notifier).logout();
          if (context.mounted) context.go('/login');
        },
      ),
  ];
}
