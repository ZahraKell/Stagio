import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/user_profile_sheet.dart';

final _adminUsersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.adminUsers);
  final data = res.data;
  final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] as List : []);
  return list.map((e) => e as Map<String, dynamic>).toList();
});

class AdminUsersPage extends ConsumerStatefulWidget {
  const AdminUsersPage({super.key});

  @override
  ConsumerState<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends ConsumerState<AdminUsersPage> {
  String _search = '';
  String? _roleFilter;
  final _searchCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final users = ref.watch(_adminUsersProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Users'),
        actions: shellAppBarActions(context, ref, showLogout: true),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Rechercher un utilisateur...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textLight),
                suffixIcon: _search.isNotEmpty ? IconButton(icon: const Icon(Icons.close, color: AppColors.textLight), onPressed: () { _searchCtrl.clear(); setState(() => _search = ''); }) : null,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          _buildRoleFilter(),
          Expanded(
            child: users.when(
              loading: () => const LoadingState(),
              error: (e, _) => ErrorRetry(message: 'Erreur', onRetry: () => ref.refresh(_adminUsersProvider)),
              data: (list) {
                var filtered = list;
                if (_search.isNotEmpty) {
                  final q = _search.toLowerCase();
                  filtered = filtered.where((u) =>
                    (u['full_name'] ?? u['name'] ?? '').toString().toLowerCase().contains(q) ||
                    (u['email'] ?? '').toString().toLowerCase().contains(q)
                  ).toList();
                }
                if (_roleFilter != null) {
                  filtered = filtered.where((u) => u['role'] == _roleFilter).toList();
                }
                if (filtered.isEmpty) return EmptyState(icon: Icons.people_outline, title: 'Aucun utilisateur trouvé');
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(_adminUsersProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) => _UserCard(
                      user: filtered[i],
                      onTap: () => showUserProfileSheet(
                        context,
                        userId: filtered[i]['id'] as int,
                        role: filtered[i]['role']?.toString(),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleFilter() {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: [
          _RoleChip(label: 'Tous', selected: _roleFilter == null, onTap: () => setState(() => _roleFilter = null)),
          _RoleChip(label: 'Étudiants', selected: _roleFilter == 'student', onTap: () => setState(() => _roleFilter = 'student')),
          _RoleChip(label: 'Entreprises', selected: _roleFilter == 'company', onTap: () => setState(() => _roleFilter = 'company')),
          _RoleChip(label: 'Admin', selected: _roleFilter == 'admin', onTap: () => setState(() => _roleFilter = 'admin')),
        ],
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _RoleChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.textMid)),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final VoidCallback onTap;
  const _UserCard({required this.user, required this.onTap});

  static const _roleIcons = {
    'student': Icons.school_outlined,
    'company': Icons.business_outlined,
    'admin': Icons.admin_panel_settings_outlined,
    'administration': Icons.manage_accounts_outlined,
  };

  static const _roleColors = {
    'student': AppColors.accent,
    'company': AppColors.gradientStart,
    'admin': AppColors.primary,
    'administration': AppColors.gradientMid,
  };

  @override
  Widget build(BuildContext context) {
    final name = user['full_name'] ?? user['name'] ?? 'Utilisateur';
    final email = user['email'] ?? '';
    final role = user['role'] ?? 'student';
    final color = _roleColors[role] ?? AppColors.textMid;
    final icon = _roleIcons[role] ?? Icons.person_outline;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.cardBg, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.toString(), style: AppTextStyles.h3.copyWith(fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(email.toString(), style: AppTextStyles.small, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: Text(role, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textLight, size: 20),
        ],
      ),
      ),
    );
  }
}
