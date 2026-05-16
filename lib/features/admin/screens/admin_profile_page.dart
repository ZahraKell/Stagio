import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../features/auth/auth_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';

final _adminProfileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ApiClient().get(ApiPaths.authProfile);
  return ApiClient.extractMap(res.data) ?? <String, dynamic>{};
});

class AdminProfilePage extends ConsumerStatefulWidget {
  const AdminProfilePage({super.key});

  @override
  ConsumerState<AdminProfilePage> createState() => _AdminProfilePageState();
}

class _AdminProfilePageState extends ConsumerState<AdminProfilePage> {
  bool _editing = false;
  bool _saving = false;
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _town = TextEditingController();
  final _phone = TextEditingController();

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _town.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient().patch(ApiPaths.authProfile, data: {
        'full_name': _fullName.text.trim(),
        'email': _email.text.trim(),
        'town': _town.text.trim(),
        'pnum': _phone.text.trim(),
      });
      ref.invalidate(_adminProfileProvider);
      setState(() {
        _editing = false;
        _saving = false;
      });
    } catch (_) {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(_adminProfileProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Profile'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: profile.when(
        loading: () => const LoadingState(),
        error: (_, __) => ErrorRetry(message: 'Error', onRetry: () => ref.refresh(_adminProfileProvider)),
        data: (d) {
          _fullName.text = d['full_name']?.toString() ?? _fullName.text;
          _email.text = d['email']?.toString() ?? _email.text;
          _town.text = d['town']?.toString() ?? _town.text;
          _phone.text = d['pnum']?.toString() ?? _phone.text;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.primary,
                  child: const Icon(Icons.shield_outlined, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 12),
                Text(d['full_name']?.toString() ?? 'Admin', style: AppTextStyles.h2),
                Text(d['role']?.toString() ?? '', style: AppTextStyles.small),
                const SizedBox(height: 24),
                if (_editing) ...[
                  TextField(controller: _fullName, decoration: const InputDecoration(labelText: 'Full name')),
                  const SizedBox(height: 12),
                  TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
                  const SizedBox(height: 12),
                  TextField(controller: _town, decoration: const InputDecoration(labelText: 'City')),
                  const SizedBox(height: 12),
                  TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: OutlinedButton(onPressed: () => setState(() => _editing = false), child: const Text('Cancel'))),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _saving ? null : _save,
                          child: const Text('Save'),
                        ),
                      ),
                    ],
                  ),
                ] else
                  ElevatedButton.icon(
                    onPressed: () => setState(() => _editing = true),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit profile'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
