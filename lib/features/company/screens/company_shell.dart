import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class CompanyShell extends StatelessWidget {
  final Widget child;
  const CompanyShell({super.key, required this.child});

  static const _tabs = [
    _Tab('/company/dashboard', Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
    _Tab('/company/offers', Icons.work_outline, Icons.work, 'Offers'),
    _Tab('/company/applications', Icons.inbox_outlined, Icons.inbox, 'Applications'),
    _Tab('/company/interns', Icons.badge_outlined, Icons.badge, 'Interns'),
    _Tab('/company/profile', Icons.business_outlined, Icons.business, 'Profile'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
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
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final selected = i == idx;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => context.go(tab.path),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(selected ? tab.activeIcon : tab.icon, color: selected ? AppColors.primary : AppColors.textLight, size: 24),
                        const SizedBox(height: 4),
                        Text(tab.label, style: TextStyle(fontSize: 9, fontWeight: selected ? FontWeight.w700 : FontWeight.w400, color: selected ? AppColors.primary : AppColors.textLight)),
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
