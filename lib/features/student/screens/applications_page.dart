import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../models/application.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';

final _myAppsProvider = FutureProvider.autoDispose<List<Application>>((ref) async {
  final api = ApiClient();
  final res = await api.get(ApiPaths.applicationsMine);
  return ApiClient.unwrapList(res.data, Application.fromJson);
});

class StudentApplicationsPage extends ConsumerStatefulWidget {
  const StudentApplicationsPage({super.key});

  @override
  ConsumerState<StudentApplicationsPage> createState() => _StudentApplicationsPageState();
}

class _StudentApplicationsPageState extends ConsumerState<StudentApplicationsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final apps = ref.watch(_myAppsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('My Applications'),
        bottom: TabBar(
          controller: _tab,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textLight,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En attente'),
            Tab(text: 'En révision'),
            Tab(text: 'Acceptées'),
            Tab(text: 'Refusées'),
          ],
        ),
      ),
      body: apps.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger vos candidatures',
          onRetry: () => ref.refresh(_myAppsProvider),
        ),
        data: (list) => TabBarView(
          controller: _tab,
          children: [
            _AppList(apps: list, onRefresh: () => ref.refresh(_myAppsProvider.future)),
            _AppList(apps: list.where((a) => a.status == 'pending').toList(), onRefresh: () => ref.refresh(_myAppsProvider.future)),
            _AppList(apps: list.where((a) => a.status == 'review').toList(), onRefresh: () => ref.refresh(_myAppsProvider.future)),
            _AppList(apps: list.where((a) => a.status == 'accepted' || a.status == 'validated').toList(), onRefresh: () => ref.refresh(_myAppsProvider.future)),
            _AppList(apps: list.where((a) => a.status == 'rejected').toList(), onRefresh: () => ref.refresh(_myAppsProvider.future)),
          ],
        ),
      ),
    );
  }
}

class _AppList extends StatelessWidget {
  final List<Application> apps;
  final Future<void> Function() onRefresh;
  const _AppList({required this.apps, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (apps.isEmpty) {
      return EmptyState(
        icon: Icons.assignment_outlined,
        title: 'Aucune candidature',
        subtitle: 'Vous n\'avez pas encore de candidatures dans cette catégorie.',
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: apps.length,
        itemBuilder: (_, i) => _AppCard(app: apps[i]),
      ),
    );
  }
}

class _AppCard extends StatefulWidget {
  final Application app;
  const _AppCard({required this.app});

  @override
  State<_AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<_AppCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final app = widget.app;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _Avatar(initials: app.companyInitials),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(app.offerTitle, style: AppTextStyles.h3.copyWith(fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Text(app.company, style: AppTextStyles.small),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 12, color: AppColors.textLight),
                            const SizedBox(width: 4),
                            Text(app.wilaya, style: AppTextStyles.small),
                            const SizedBox(width: 12),
                            const Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textLight),
                            const SizedBox(width: 4),
                            Text(_formatDate(app.appliedDate), style: AppTextStyles.small),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      StatusBadge(status: app.status),
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
          if (_expanded) _buildExpanded(app),
        ],
      ),
    );
  }

  Widget _buildExpanded(Application app) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(height: 1),
          const SizedBox(height: 14),
          Text('Suivi du dossier', style: AppTextStyles.label),
          const SizedBox(height: 12),
          _StageStep(label: 'Candidature envoyée', done: true),
          _StageStep(
            label: 'Examen de la candidature',
            done: app.status != 'pending',
          ),
          _StageStep(
            label: 'Réponse de l\'entreprise',
            done: app.status == 'accepted' || app.status == 'validated' || app.status == 'rejected',
          ),
          _StageStep(
            label: 'Convention signée',
            done: app.stageState == 'ongoing' || app.stageState == 'completed',
          ),
          _StageStep(label: 'Stage terminé & attestation', done: app.attestationIssued),
          if (app.attestationIssued) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.download_outlined),
              label: const Text('Télécharger l\'attestation'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}

class _Avatar extends StatelessWidget {
  final String initials;
  const _Avatar({required this.initials});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(gradient: AppColors.navyGradient, borderRadius: BorderRadius.circular(14)),
      child: Center(
        child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
      ),
    );
  }
}

class _StageStep extends StatelessWidget {
  final String label;
  final bool done;
  const _StageStep({required this.label, required this.done});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: done ? AppColors.success : AppColors.border,
              shape: BoxShape.circle,
            ),
            child: Icon(
              done ? Icons.check : Icons.radio_button_unchecked,
              color: done ? Colors.white : AppColors.textLight,
              size: 14,
            ),
          ),
          const SizedBox(width: 10),
          Text(label, style: TextStyle(fontSize: 13, color: done ? AppColors.textDark : AppColors.textLight, fontWeight: done ? FontWeight.w600 : FontWeight.w400)),
        ],
      ),
    );
  }
}
