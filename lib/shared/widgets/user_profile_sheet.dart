import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';
import 'empty_state.dart';
import 'student_cv_sheet.dart';

Future<void> showUserProfileSheet(
  BuildContext context, {
  required int userId,
  String? role,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.55,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      builder: (_, scroll) => FutureBuilder(
        future: ApiClient().get(ApiPaths.adminUser(userId)),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const SizedBox(height: 160, child: Center(child: CircularProgressIndicator()));
          }
          final data = snap.hasData ? ApiClient.extractMap(snap.data!.data) : null;
          if (data == null) {
            return const Padding(
              padding: EdgeInsets.all(24),
              child: EmptyState(icon: Icons.person_off_outlined, title: 'User not found'),
            );
          }
          final userRole = data['role']?.toString() ?? role ?? '';
          final student = data['student'] as Map<String, dynamic>?;
          final company = data['company'] as Map<String, dynamic>?;
          return ListView(
            controller: scroll,
            padding: const EdgeInsets.all(20),
            children: [
              Text(data['full_name']?.toString() ?? 'User', style: AppTextStyles.h2.copyWith(fontSize: 18)),
              Text(data['email']?.toString() ?? '', style: AppTextStyles.bodyMid),
              const SizedBox(height: 8),
              Chip(label: Text(userRole.toUpperCase())),
              const SizedBox(height: 16),
              if (data['town'] != null)
                ListTile(
                  leading: const Icon(Icons.location_on_outlined),
                  title: Text(data['town'].toString()),
                ),
              if (data['pnum'] != null)
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: Text(data['pnum'].toString()),
                ),
              if (student != null) ...[
                const Divider(),
                Text('Student info', style: AppTextStyles.label),
                if (student['institution'] != null)
                  ListTile(
                    leading: const Icon(Icons.school_outlined),
                    title: Text(student['institution'].toString()),
                  ),
                if (student['speciality'] != null)
                  ListTile(
                    leading: const Icon(Icons.book_outlined),
                    title: Text(student['speciality'].toString()),
                  ),
                if (student['grade'] != null)
                  ListTile(
                    leading: const Icon(Icons.grade_outlined),
                    title: Text(student['grade'].toString()),
                  ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    final sid = data['student_id'] ?? student['id'];
                    if (sid != null) {
                      showStudentCvSheet(
                        context,
                        studentId: sid is int ? sid : int.parse(sid.toString()),
                        studentName: data['full_name']?.toString(),
                      );
                    }
                  },
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('View Europass CV'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    backgroundColor: AppColors.primary,
                  ),
                ),
              ],
              if (company != null) ...[
                const Divider(),
                Text('Company info', style: AppTextStyles.label),
                if (company['company_name'] != null)
                  ListTile(
                    leading: const Icon(Icons.business_outlined),
                    title: Text(company['company_name'].toString()),
                  ),
                if (company['company_sector'] != null)
                  ListTile(
                    leading: const Icon(Icons.category_outlined),
                    title: Text(company['company_sector'].toString()),
                  ),
              ],
            ],
          );
        },
      ),
    ),
  );
}
