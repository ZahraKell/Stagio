import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/student_cv_sheet.dart';

final _companyAppsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get(ApiPaths.applicationsCompany);
  return ApiClient.extractList(res.data)
      .map((e) => Map<String, dynamic>.from(e as Map))
      .toList();
});

class CompanyApplicationsPage extends ConsumerStatefulWidget {
  const CompanyApplicationsPage({super.key});

  @override
  ConsumerState<CompanyApplicationsPage> createState() => _CompanyApplicationsPageState();
}

class _CompanyApplicationsPageState extends ConsumerState<CompanyApplicationsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final apps = ref.watch(_companyAppsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Applications'),
        actions: shellAppBarActions(context, ref, showLogout: true),
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textLight,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En attente'),
            Tab(text: 'Acceptées'),
            Tab(text: 'Refusées'),
          ],
        ),
      ),
      body: apps.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger les candidatures',
          onRetry: () => ref.refresh(_companyAppsProvider),
        ),
        data: (list) => TabBarView(
          controller: _tab,
          children: [
            _AppList(
              apps: list,
              onRefresh: () => ref.refresh(_companyAppsProvider.future),
              onStatusChange: (id, status) => _changeStatus(context, id, status),
            ),
            _AppList(
              apps: list.where((a) => a['status'] == 'pending').toList(),
              onRefresh: () => ref.refresh(_companyAppsProvider.future),
              onStatusChange: (id, status) => _changeStatus(context, id, status),
            ),
            _AppList(
              apps: list.where((a) => a['status'] == 'accepted').toList(),
              onRefresh: () => ref.refresh(_companyAppsProvider.future),
              onStatusChange: (id, status) => _changeStatus(context, id, status),
            ),
            _AppList(
              apps: list.where((a) => a['status'] == 'refused').toList(),
              onRefresh: () => ref.refresh(_companyAppsProvider.future),
              onStatusChange: (id, status) => _changeStatus(context, id, status),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _changeStatus(BuildContext context, int id, String status) async {
    try {
      await ApiClient().patch(ApiPaths.applicationReview(id), data: {'status': status});
      ref.refresh(_companyAppsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Statut mis à jour'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        final msg = e.toString().contains('403')
            ? 'Permission refusée.'
            : 'Impossible de mettre à jour le statut. Réessayez.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}

class _AppList extends StatelessWidget {
  final List<Map<String, dynamic>> apps;
  final Future<void> Function() onRefresh;
  final void Function(int id, String status) onStatusChange;

  const _AppList({
    required this.apps,
    required this.onRefresh,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    if (apps.isEmpty) {
      return EmptyState(icon: Icons.people_outline, title: 'Aucune candidature');
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: apps.length,
        itemBuilder: (_, i) => _AppCard(
          app: apps[i],
          onStatusChange: onStatusChange,
        ),
      ),
    );
  }
}

class _AppCard extends StatefulWidget {
  final Map<String, dynamic> app;
  final void Function(int id, String status) onStatusChange;
  const _AppCard({required this.app, required this.onStatusChange});

  @override
  State<_AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<_AppCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final app = widget.app;
    final name = app['student_name'] ?? app['student'] ?? 'Étudiant';
    final initials = _initials(name.toString());
    final status = app['status'] ?? 'pending';
    final score = (app['cv_score'] ?? 0).toInt();
    final id = (app['id'] ?? 0) as int;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12)],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name.toString(),
                          style: AppTextStyles.h3.copyWith(fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          app['offer_title']?.toString() ?? '',
                          style: AppTextStyles.small,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        if (score > 0) _ScoreBar(score: score),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      StatusBadge(status: status),
                      const SizedBox(height: 8),
                      Icon(
                        _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: AppColors.textLight,
                        size: 20,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_expanded)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  if (app['application_date'] != null)
                    Text(
                      'Candidature du ${app['application_date']}',
                      style: AppTextStyles.small,
                    ),
                  const SizedBox(height: 14),
                  if (app['student_id'] != null)
                    OutlinedButton.icon(
                      onPressed: () => showStudentCvSheet(
                        context,
                        studentId: app['student_id'] is int
                            ? app['student_id'] as int
                            : int.parse(app['student_id'].toString()),
                        studentName: name.toString(),
                      ),
                      icon: const Icon(Icons.description_outlined, size: 18),
                      label: const Text('View Europass CV'),
                    ),
                  const SizedBox(height: 10),
                  if (status == 'pending') ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => widget.onStatusChange(id, 'refused'),
                            icon: const Icon(Icons.close, size: 16, color: AppColors.danger),
                            label: const Text('Refuser', style: TextStyle(color: AppColors.danger)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.danger),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => widget.onStatusChange(id, 'accepted'),
                            icon: const Icon(Icons.check, size: 16),
                            label: const Text('Accepter'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.success,
                              minimumSize: const Size(0, 44),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}

class _ScoreBar extends StatelessWidget {
  final int score;
  const _ScoreBar({required this.score});

  @override
  Widget build(BuildContext context) {
    final color = score >= 80
        ? AppColors.success
        : score >= 55
        ? AppColors.warning
        : AppColors.danger;
    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$score%',
          style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
