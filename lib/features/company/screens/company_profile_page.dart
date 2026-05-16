import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../features/auth/auth_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';

final _companyProfileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ApiClient().get(ApiPaths.authProfile);
  return ApiClient.extractMap(res.data) ?? <String, dynamic>{};
});

class CompanyProfilePage extends ConsumerStatefulWidget {
  const CompanyProfilePage({super.key});

  @override
  ConsumerState<CompanyProfilePage> createState() => _CompanyProfilePageState();
}

class _CompanyProfilePageState extends ConsumerState<CompanyProfilePage> {
  bool _editing = false;
  bool _saving = false;
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _companyName = TextEditingController();
  final _sector = TextEditingController();
  final _website = TextEditingController();
  final _town = TextEditingController();
  final _description = TextEditingController();

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    _companyName.dispose();
    _sector.dispose();
    _website.dispose();
    _town.dispose();
    _description.dispose();
    super.dispose();
  }

  void _load(Map<String, dynamic> d) {
    final c = d['company'] as Map<String, dynamic>?;
    _fullName.text = d['full_name']?.toString() ?? '';
    _email.text = d['email']?.toString() ?? '';
    _phone.text = d['pnum']?.toString() ?? '';
    _companyName.text = c?['company_name']?.toString() ?? '';
    _sector.text = c?['company_sector']?.toString() ?? '';
    _website.text = c?['company_website']?.toString() ?? '';
    _town.text = c?['town']?.toString() ?? d['town']?.toString() ?? '';
    _description.text = c?['description']?.toString() ?? '';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient().patch(ApiPaths.authProfile, data: {
        'full_name': _fullName.text.trim(),
        'email': _email.text.trim(),
        'pnum': _phone.text.trim(),
        'company_name': _companyName.text.trim(),
        'company_sector': _sector.text.trim(),
        'company_website': _website.text.trim(),
        'company_town': _town.text.trim(),
        'description': _description.text.trim(),
      });
      ref.invalidate(_companyProfileProvider);
      setState(() {
        _editing = false;
        _saving = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile saved'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      setState(() => _saving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(_companyProfileProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Company profile'),
        actions: [
          ...shellAppBarActions(context, ref),
          profile.maybeWhen(
            data: (d) => IconButton(
              icon: Icon(_editing ? Icons.close : Icons.edit_outlined),
              onPressed: () {
                if (!_editing) _load(d);
                setState(() => _editing = !_editing);
              },
            ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: profile.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(message: 'Error', onRetry: () => ref.refresh(_companyProfileProvider)),
        data: (d) {
          final c = d['company'] as Map<String, dynamic>?;
          final approved = c?['is_approved'] == true;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.business, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 12),
                Text(
                  c?['company_name']?.toString() ?? d['full_name']?.toString() ?? 'Company',
                  style: AppTextStyles.h2.copyWith(fontSize: 20),
                ),
                Chip(
                  label: Text(approved ? 'Approved' : 'Pending approval'),
                  backgroundColor: approved
                      ? AppColors.success.withValues(alpha: 0.15)
                      : AppColors.warning.withValues(alpha: 0.15),
                ),
                const SizedBox(height: 24),
                if (_editing) ...[
                  _tf('Company name', _companyName, Icons.business),
                  _tf('Sector', _sector, Icons.category_outlined),
                  _tf('Website', _website, Icons.language),
                  _tf('City', _town, Icons.location_on_outlined),
                  _tf('Contact name', _fullName, Icons.person_outline),
                  _tf('Email', _email, Icons.email_outlined),
                  _tf('Phone', _phone, Icons.phone_outlined),
                  _tf('Description', _description, Icons.notes, maxLines: 4),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _saving ? null : () => setState(() => _editing = false),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _saving ? null : _save,
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                          child: _saving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Save', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  if (c != null) ...[
                    _row(Icons.email_outlined, d['email']?.toString()),
                    _row(Icons.location_on_outlined, c['town']?.toString()),
                    _row(Icons.language, c['company_website']?.toString()),
                    if ((c['description']?.toString() ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(c['description'].toString(), style: AppTextStyles.bodyMid),
                      ),
                  ],
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () {
                      _load(d);
                      setState(() => _editing = true);
                    },
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit profile'),
                  ),
                ],
                const SizedBox(height: 16),
                TextButton.icon(
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                  icon: const Icon(Icons.logout, color: AppColors.danger),
                  label: const Text('Log out', style: TextStyle(color: AppColors.danger)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _tf(String label, TextEditingController c, IconData icon, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: c,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon, size: 20)),
      ),
    );
  }

  Widget _row(IconData icon, String? v) {
    if (v == null || v.isEmpty) return const SizedBox.shrink();
    return ListTile(
      leading: Icon(icon, color: AppColors.accent, size: 20),
      title: Text(v, style: AppTextStyles.bodyMid),
    );
  }
}
