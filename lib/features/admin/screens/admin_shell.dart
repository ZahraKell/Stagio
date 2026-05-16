import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class AdminShell extends StatelessWidget {
  final Widget child;
  final bool isAdministration;
  const AdminShell({super.key, required this.child, this.isAdministration = false});

  List<_Tab> get _tabs => isAdministration
      ? [
          _Tab('/administration/dashboard', Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
          _Tab('/administration/students', Icons.school_outlined, Icons.school, 'Students'),
          _Tab('/administration/conventions', Icons.assignment_outlined, Icons.assignment, 'Conventions'),
          _Tab('/administration/profile', Icons.person_outline, Icons.person, 'Profile'),
        ]
      : [
          _Tab('/admin/dashboard', Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
          _Tab('/admin/users', Icons.people_outline, Icons.people, 'Users'),
          _Tab('/admin/offers', Icons.work_outline, Icons.work, 'Offers'),
          _Tab('/admin/applications', Icons.assignment_outlined, Icons.assignment, 'Applications'),
          _Tab('/admin/companies', Icons.business_outlined, Icons.business, 'Companies'),
          _Tab('/admin/profile', Icons.person_outline, Icons.person, 'Profile'),
        ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final tabs = _tabs;
    for (int i = 0; i < tabs.length; i++) {
      if (location.startsWith(tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final tabs = _tabs;
    final idx = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: List.generate(tabs.length, (i) {
                final tab = tabs[i];
                final selected = i == idx;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => context.go(tab.path),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(selected ? tab.activeIcon : tab.icon, color: selected ? AppColors.primary : AppColors.textLight, size: 22),
                        const SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(fontSize: 8, fontWeight: selected ? FontWeight.w700 : FontWeight.w400, color: selected ? AppColors.primary : AppColors.textLight),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _Tab {
  final String path;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _Tab(this.path, this.icon, this.activeIcon, this.label);
}
