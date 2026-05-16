import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../features/auth/auth_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';

final _profileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ApiClient().get(ApiPaths.authProfile);
  return ApiClient.extractMap(res.data) ?? <String, dynamic>{};
});

class StudentProfilePage extends ConsumerStatefulWidget {
  const StudentProfilePage({super.key});

  @override
  ConsumerState<StudentProfilePage> createState() => _StudentProfilePageState();
}

class _StudentProfilePageState extends ConsumerState<StudentProfilePage> {
  bool _editing = false;
  bool _saving = false;

  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _town = TextEditingController();
  final _phone = TextEditingController();
  final _institution = TextEditingController();
  final _speciality = TextEditingController();
  final _grade = TextEditingController();
  final _field = TextEditingController();

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _town.dispose();
    _phone.dispose();
    _institution.dispose();
    _speciality.dispose();
    _grade.dispose();
    _field.dispose();
    super.dispose();
  }

  void _loadFields(Map<String, dynamic> d) {
    final student = d['student'] as Map<String, dynamic>?;
    _fullName.text = d['full_name']?.toString() ?? '';
    _email.text = d['email']?.toString() ?? '';
    _town.text = d['town']?.toString() ?? '';
    _phone.text = d['pnum']?.toString() ?? '';
    _institution.text = student?['institution']?.toString() ?? '';
    _speciality.text = student?['speciality']?.toString() ?? '';
    _grade.text = student?['grade']?.toString() ?? '';
    _field.text = student?['field']?.toString() ?? '';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient().patch(ApiPaths.authProfile, data: {
        'full_name': _fullName.text.trim(),
        'email': _email.text.trim(),
        'town': _town.text.trim(),
        'pnum': _phone.text.trim(),
        'institution': _institution.text.trim(),
        'speciality': _speciality.text.trim(),
        'grade': _grade.text.trim(),
        'field': _field.text.trim(),
      });
      ref.invalidate(_profileProvider);
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
    final profile = ref.watch(_profileProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          ...shellAppBarActions(context, ref),
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit',
              onPressed: profile.maybeWhen(
                data: (d) => () {
                  _loadFields(d);
                  setState(() => _editing = true);
                },
                orElse: () => null,
              ),
            ),
        ],
      ),
      body: profile.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Could not load profile',
          onRetry: () => ref.refresh(_profileProvider),
        ),
        data: (d) {
          if (!_editing && _fullName.text.isEmpty) _loadFields(d);
          final name = d['full_name'] ?? 'Student';
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    _initials(name.toString()),
                    style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(height: 12),
                Text(name.toString(), style: AppTextStyles.h2.copyWith(fontSize: 20)),
                Text(d['email']?.toString() ?? '', style: AppTextStyles.bodyMid),
                const SizedBox(height: 24),
                if (_editing) ...[
                  _fieldBox('Full name', _fullName, Icons.person_outline),
                  _fieldBox('Email', _email, Icons.email_outlined),
                  _fieldBox('City', _town, Icons.location_on_outlined),
                  _fieldBox('Phone', _phone, Icons.phone_outlined),
                  _fieldBox('Institution', _institution, Icons.school_outlined),
                  _fieldBox('Speciality', _speciality, Icons.book_outlined),
                  _fieldBox('Level', _grade, Icons.grade_outlined),
                  _fieldBox('Field', _field, Icons.category_outlined),
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
                  _readRow(Icons.location_on_outlined, 'City', d['town']?.toString()),
                  _readRow(Icons.phone_outlined, 'Phone', d['pnum']?.toString()),
                  if (d['student'] is Map) ...[
                    _readRow(Icons.school_outlined, 'Institution', (d['student'] as Map)['institution']?.toString()),
                    _readRow(Icons.book_outlined, 'Speciality', (d['student'] as Map)['speciality']?.toString()),
                    _readRow(Icons.grade_outlined, 'Level', (d['student'] as Map)['grade']?.toString()),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        _loadFields(d);
                        setState(() => _editing = true);
                      },
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Edit profile'),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) context.go('/login');
                    },
                    icon: const Icon(Icons.logout, color: AppColors.danger),
                    label: const Text('Log out', style: TextStyle(color: AppColors.danger)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _fieldBox(String label, TextEditingController c, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: c,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
        ),
      ),
    );
  }

  Widget _readRow(IconData icon, String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return ListTile(
      leading: Icon(icon, color: AppColors.accent),
      title: Text(label, style: AppTextStyles.small),
      subtitle: Text(value, style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
