import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';

final notificationsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.notifications);
  final map = ApiClient.extractMap(res.data);
  if (map != null && map['notifications'] is List) {
    return (map['notifications'] as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }
  return ApiClient.extractList(res.data)
      .map((e) => Map<String, dynamic>.from(e as Map))
      .toList();
});

final unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final res = await ApiClient().get(ApiPaths.notificationsUnread);
    final data = ApiClient.extractMap(res.data);
    if (data != null) {
      final v = data['unread_count'] ?? data['unread'] ?? data['count'] ?? 0;
      return v is int ? v : int.tryParse(v.toString()) ?? 0;
    }
  } catch (_) {}
  return 0;
});
