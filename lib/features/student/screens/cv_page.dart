import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/theme.dart';
import '../../../models/cv.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/shell_actions.dart';

final _cvProvider = FutureProvider.autoDispose<CvData?>((ref) async {
  try {
    final res = await ApiClient().get(ApiPaths.authCv);
    final data = ApiClient.extractMap(res.data);
    return data != null ? CvData.fromJson(data) : null;
  } catch (_) {
    return null;
  }
});

class StudentCvPage extends ConsumerStatefulWidget {
  const StudentCvPage({super.key});

  @override
  ConsumerState<StudentCvPage> createState() => _StudentCvPageState();
}

class _StudentCvPageState extends ConsumerState<StudentCvPage> {
  bool _editing = false;
  bool _saving = false;
  final _github = TextEditingController();
  final _linkedin = TextEditingController();
  final _portfolio = TextEditingController();
  final _description = TextEditingController();

  @override
  void dispose() {
    _github.dispose();
    _linkedin.dispose();
    _portfolio.dispose();
    _description.dispose();
    super.dispose();
  }

  void _loadFromCv(CvData cv) {
    _github.text = cv.github;
    _linkedin.text = cv.linkedin;
    _portfolio.text = cv.portfolio;
    _description.text = cv.description;
  }

  Future<void> _saveCv() async {
    setState(() => _saving = true);
    try {
      await ApiClient().patch(ApiPaths.authCvUpdate, data: {
        'github': _github.text.trim(),
        'linkedin': _linkedin.text.trim(),
        'portfolio': _portfolio.text.trim(),
        'description': _description.text.trim(),
      });
      ref.invalidate(_cvProvider);
      setState(() {
        _editing = false;
        _saving = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('CV saved'), backgroundColor: AppColors.success),
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

  Future<void> _createCv() async {
    await _saveCv();
  }

  Future<void> _addSkill() async {
    final nameCtrl = TextEditingController();
    String level = 'intermediate';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add skill'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Skill name'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: level,
              items: const [
                DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                DropdownMenuItem(value: 'intermediate', child: Text('Intermediate')),
                DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
              ],
              onChanged: (v) => level = v ?? level,
              decoration: const InputDecoration(labelText: 'Level'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add')),
        ],
      ),
    );
    if (ok == true && nameCtrl.text.trim().isNotEmpty) {
      await ApiClient().post(ApiPaths.authCvSkill, data: {
        'name': nameCtrl.text.trim(),
        'level': level,
      });
      ref.invalidate(_cvProvider);
    }
    nameCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cvAsync = ref.watch(_cvProvider);
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('My Europass CV'),
        actions: [
          ...shellAppBarActions(context, ref),
          cvAsync.maybeWhen(
            data: (cv) => cv != null
                ? IconButton(
                    icon: Icon(_editing ? Icons.close : Icons.edit_outlined),
                    onPressed: () {
                      if (!_editing) _loadFromCv(cv);
                      setState(() => _editing = !_editing);
                    },
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: cvAsync.when(
        loading: () => const LoadingState(),
        error: (e, _) => ErrorRetry(
          message: 'Could not load your CV',
          onRetry: () => ref.refresh(_cvProvider),
        ),
        data: (cv) {
          if (cv == null) {
            return EmptyState(
              icon: Icons.description_outlined,
              title: 'No CV yet',
              subtitle: 'Create your Europass CV to apply for internships',
              actionLabel: 'Create my CV',
              onAction: () async {
                _editing = true;
                await _createCv();
              },
            );
          }
          if (!_editing && _github.text.isEmpty) _loadFromCv(cv);
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(_cvProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _scoreCard(cv),
                const SizedBox(height: 16),
                if (_editing) ...[
                  _tf('GitHub URL', _github, Icons.code),
                  _tf('LinkedIn URL', _linkedin, Icons.link),
                  _tf('Portfolio URL', _portfolio, Icons.language),
                  _tf('About me', _description, Icons.notes, maxLines: 4),
                  const SizedBox(height: 12),
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
                          onPressed: _saving ? null : _saveCv,
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                          child: _saving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Save CV', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  if (cv.github.isNotEmpty) _linkRow(Icons.code, cv.github),
                  if (cv.linkedin.isNotEmpty) _linkRow(Icons.link, cv.linkedin),
                  if (cv.portfolio.isNotEmpty) _linkRow(Icons.language, cv.portfolio),
                  if (cv.description.isNotEmpty) ...[
                    Text('About', style: AppTextStyles.label),
                    const SizedBox(height: 6),
                    Text(cv.description, style: AppTextStyles.bodyMid),
                  ],
                ],
                const SizedBox(height: 16),
                _section('Education', Icons.school_outlined, cv.educations.map((e) => '${e.degree} — ${e.institution}').toList()),
                _section('Experience', Icons.work_outline, cv.experiences.map((e) => '${e.jobTitle} @ ${e.company}').toList()),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Skills', style: AppTextStyles.h3.copyWith(fontSize: 14)),
                    TextButton.icon(
                      onPressed: _addSkill,
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add'),
                    ),
                  ],
                ),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: cv.skills
                      .map((s) => Chip(
                            label: Text('${s.name} (${s.level})'),
                            backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
                _section('Languages', Icons.translate, cv.languages.map((l) => '${l.name} — ${l.level}').toList()),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _scoreCard(CvData cv) {
    final score = cv.completionScore;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.navyGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircularProgressIndicator(
            value: score / 100,
            backgroundColor: Colors.white24,
            color: AppColors.success,
            strokeWidth: 6,
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('CV completion', style: AppTextStyles.body.copyWith(color: Colors.white70)),
                Text('$score%', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
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

  Widget _linkRow(IconData icon, String url) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        Icon(icon, size: 18, color: AppColors.accent),
        const SizedBox(width: 8),
        Expanded(child: Text(url, style: AppTextStyles.small)),
      ]),
    );
  }

  Widget _section(String title, IconData icon, List<String> items) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(title, style: AppTextStyles.h3.copyWith(fontSize: 14)),
          ]),
          const SizedBox(height: 8),
          if (items.isEmpty)
            Text('No entries yet', style: AppTextStyles.small)
          else
            ...items.map((t) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text('• $t', style: AppTextStyles.bodyMid),
                )),
        ],
      ),
    );
  }
}
