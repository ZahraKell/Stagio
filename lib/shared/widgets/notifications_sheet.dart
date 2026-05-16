import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';
import '../providers/notifications_provider.dart';
import 'empty_state.dart';

Future<void> showNotificationsSheet(BuildContext context, WidgetRef ref) async {
  ref.invalidate(notificationsProvider);
  ref.invalidate(unreadCountProvider);
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      builder: (_, scroll) => Consumer(
        builder: (context, ref, _) {
          final notifs = ref.watch(notificationsProvider);
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_outlined, color: AppColors.primary),
                    const SizedBox(width: 10),
                    Text('Notifications', style: AppTextStyles.h3),
                    const Spacer(),
                    TextButton(
                      onPressed: () async {
                        await ApiClient().patch(ApiPaths.notificationsReadAll);
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(unreadCountProvider);
                      },
                      child: const Text('Mark all read'),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: notifs.when(
                  loading: () => const LoadingState(),
                  error: (_, __) => ErrorRetry(
                    message: 'Could not load notifications',
                    onRetry: () => ref.refresh(notificationsProvider),
                  ),
                  data: (list) {
                    if (list.isEmpty) {
                      return const EmptyState(
                        icon: Icons.notifications_none_outlined,
                        title: 'No notifications',
                      );
                    }
                    return ListView.builder(
                      controller: scroll,
                      itemCount: list.length,
                      itemBuilder: (_, i) {
                        final n = list[i];
                        final read = n['is_read'] == true;
                        return ListTile(
                          leading: Icon(
                            read ? Icons.mark_email_read_outlined : Icons.mark_email_unread_outlined,
                            color: read ? AppColors.textLight : AppColors.primary,
                          ),
                          title: Text(
                            n['message']?.toString() ?? '',
                            style: TextStyle(
                              fontWeight: read ? FontWeight.w400 : FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          subtitle: Text(
                            n['created_at']?.toString() ?? '',
                            style: AppTextStyles.small,
                          ),
                          onTap: () async {
                            final id = n['id'];
                            if (id != null) {
                              await ApiClient().patch(ApiPaths.notificationRead(id as int));
                              ref.invalidate(notificationsProvider);
                              ref.invalidate(unreadCountProvider);
                            }
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    ),
  );
}
