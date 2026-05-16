import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';
import '../../models/cv.dart';
import 'empty_state.dart';

Future<void> showStudentCvSheet(
  BuildContext context, {
  required int studentId,
  String? studentName,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scroll) => FutureBuilder(
        future: ApiClient().get(ApiPaths.studentCv(studentId)),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
          }
          final data = snap.hasData ? ApiClient.extractMap(snap.data!.data) : null;
          if (data == null) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: EmptyState(
                icon: Icons.description_outlined,
                title: 'No CV yet',
                subtitle: studentName != null ? '$studentName has not created a CV.' : null,
              ),
            );
          }
          final cv = CvData.fromJson(data);
          return ListView(
            controller: scroll,
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                studentName ?? 'Candidate CV',
                style: AppTextStyles.h2.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 16),
              if (cv.description.isNotEmpty) ...[
                Text('About', style: AppTextStyles.label),
                Text(cv.description, style: AppTextStyles.bodyMid),
                const SizedBox(height: 12),
              ],
              if (cv.github.isNotEmpty) Text('GitHub: ${cv.github}', style: AppTextStyles.small),
              if (cv.linkedin.isNotEmpty) Text('LinkedIn: ${cv.linkedin}', style: AppTextStyles.small),
              const SizedBox(height: 16),
              Text('Education', style: AppTextStyles.h3.copyWith(fontSize: 14)),
              ...cv.educations.map((e) => ListTile(
                    dense: true,
                    title: Text(e.degree),
                    subtitle: Text('${e.institution} (${e.startYear})'),
                  )),
              Text('Experience', style: AppTextStyles.h3.copyWith(fontSize: 14)),
              ...cv.experiences.map((e) => ListTile(
                    dense: true,
                    title: Text(e.jobTitle),
                    subtitle: Text(e.company),
                  )),
              Text('Skills', style: AppTextStyles.h3.copyWith(fontSize: 14)),
              Wrap(
                spacing: 6,
                children: cv.skills
                    .map((s) => Chip(label: Text('${s.name} (${s.level})')))
                    .toList(),
              ),
            ],
          );
        },
      ),
    ),
  );
}
