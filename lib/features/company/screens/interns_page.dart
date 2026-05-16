import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';

class CompanyInternItem {
  final int applicationId;
  final int? conventionId;
  final String studentName;
  final String offerTitle;
  final String status;
  final String stage;
  final String? conventionStatus;

  const CompanyInternItem({
    required this.applicationId,
    this.conventionId,
    required this.studentName,
    required this.offerTitle,
    required this.status,
    required this.stage,
    this.conventionStatus,
  });

  factory CompanyInternItem.fromJson(Map<String, dynamic> json) => CompanyInternItem(
        applicationId: json['application_id'] ?? json['id'] ?? 0,
        conventionId: json['convention_id'],
        studentName: json['student_name'] ?? '',
        offerTitle: json['offer_title'] ?? '',
        status: json['status'] ?? '',
        stage: json['stage'] ?? json['stage_state'] ?? '',
        conventionStatus: json['convention_status'],
      );

  bool get canSignConvention =>
      conventionId != null &&
      (conventionStatus == 'pending_company' || stage == 'convention_to_sign');

  bool get canValidateReport => stage == 'report_to_validate';
}

final _companyInternsProvider =
    FutureProvider.autoDispose<List<CompanyInternItem>>((ref) async {
  final res = await ApiClient().get(ApiPaths.applicationsMyInterns);
  return ApiClient.unwrapList(res.data, CompanyInternItem.fromJson);
});

class CompanyInternsPage extends ConsumerWidget {
  const CompanyInternsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final interns = ref.watch(_companyInternsProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(title: const Text('Mes stagiaires')),
      body: interns.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Impossible de charger les stages',
          onRetry: () => ref.refresh(_companyInternsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.badge_outlined,
              title: 'Aucun stagiaire',
              subtitle: 'Les stages acceptés apparaîtront ici.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(_companyInternsProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (_, i) => _InternCard(item: list[i], ref: ref),
            ),
          );
        },
      ),
    );
  }
}

class _InternCard extends StatelessWidget {
  final CompanyInternItem item;
  final WidgetRef ref;
  const _InternCard({required this.item, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 12)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.offerTitle, style: AppTextStyles.h3.copyWith(fontSize: 14)),
                    Text(item.studentName, style: AppTextStyles.small),
                  ],
                ),
              ),
              StatusBadge(status: item.stage.isNotEmpty ? item.stage : item.status),
            ],
          ),
          if (item.canSignConvention) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => _signConvention(context),
              icon: const Icon(Icons.edit_document, size: 16),
              label: const Text('Signer la convention'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
          if (item.canValidateReport) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => _validateReport(context),
              icon: const Icon(Icons.task_alt, size: 16),
              label: const Text('Valider le rapport'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
                backgroundColor: AppColors.success,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _signConvention(BuildContext context) async {
    if (item.conventionId == null) return;
    try {
      await ApiClient().post(ApiPaths.conventionSign(item.conventionId!));
      ref.invalidate(_companyInternsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Convention signée'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Échec de la signature'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Future<void> _validateReport(BuildContext context) async {
    try {
      await ApiClient().patch(ApiPaths.applicationValidateReport(item.applicationId));
      ref.invalidate(_companyInternsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rapport validé'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Échec de la validation'), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}
