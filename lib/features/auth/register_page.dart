import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, Color(0xFF1E3A8A), Color(0xFF4F46E5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 32),
                  Text('Create an account', style: AppTextStyles.h1.copyWith(color: Colors.white)),
                  const SizedBox(height: 8),
                  Text(
                    'Choose your role',
                    style: AppTextStyles.bodyMid.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 32),
                  _RoleCard(
                    icon: Icons.admin_panel_settings_outlined,
                    title: 'Administration',
                    subtitle: 'University internship office',
                    gradientColors: [AppColors.gradientMid, AppColors.primary],
                    onTap: () => context.push('/register/administration'),
                  ),
                  const SizedBox(height: 16),
                  _RoleCard(
                    icon: Icons.school_outlined,
                    title: 'Student',
                    subtitle: 'Find your internship',
                    gradientColors: [AppColors.accent, AppColors.gradientEnd],
                    onTap: () => context.push('/register/student'),
                  ),
                  const SizedBox(height: 16),
                  _RoleCard(
                    icon: Icons.business_outlined,
                    title: 'Company',
                    subtitle: 'Publish internship offers',
                    gradientColors: [AppColors.gradientStart, AppColors.gradientMid],
                    onTap: () => context.push('/register/company'),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: AppTextStyles.body.copyWith(color: Colors.white70),
                      ),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Text(
                          'Sign in',
                          style: AppTextStyles.body.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                            decorationColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradientColors),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 30),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTextStyles.h3),
                  const SizedBox(height: 4),
                  Text(subtitle, style: AppTextStyles.bodyMid),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: AppColors.textLight, size: 18),
          ],
        ),
      ),
    );
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/// Extracts a human-readable error message from a Dio exception.
/// Tries to parse the Django REST Framework error response body.
String _parseApiError(dynamic e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      // DRF returns errors as { "field": ["message"] } or { "detail": "message" }
      final parts = <String>[];
      data.forEach((key, value) {
        if (value is List) {
          parts.add(value.join(' '));
        } else if (value is String) {
          parts.add(value);
        }
      });
      if (parts.isNotEmpty) return parts.join('\n');
    }
    final status = e.response?.statusCode;
    if (status == 400) return 'Données invalides. Vérifiez vos informations.';
    if (status == 409) return 'Cet email est déjà utilisé.';
    if (status != null) return 'Erreur serveur ($status). Réessayez.';
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.unknown) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    }
  }
  return 'Une erreur est survenue. Réessayez.';
}

// ─── Student Registration ─────────────────────────────────────────────────────

class StudentRegisterPage extends StatefulWidget {
  const StudentRegisterPage({super.key});

  @override
  State<StudentRegisterPage> createState() => _StudentRegisterPageState();
}

class _StudentRegisterPageState extends State<StudentRegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inscription Étudiant'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              // University email notice
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.accent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppColors.accent, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Utilisez votre email universitaire (.edu.dz ou domaine de votre université).',
                        style: AppTextStyles.small.copyWith(color: AppColors.accent),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _field('Nom complet', _nameCtrl, Icons.person_outline),
              const SizedBox(height: 16),
              _field('Email universitaire', _emailCtrl, Icons.email_outlined,
                  type: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _passwordField('Mot de passe', _passCtrl),
              const SizedBox(height: 16),
              _passwordField('Confirmer le mot de passe', _pass2Ctrl),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Créer mon compte'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, IconData icon,
      {TextInputType? type}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          keyboardType: type,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AppColors.textLight),
          ),
          validator: (v) => (v == null || v.trim().isEmpty) ? 'Champ requis' : null,
        ),
      ],
    );
  }

  Widget _passwordField(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          obscureText: _obscure,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textLight),
            suffixIcon: IconButton(
              icon: Icon(
                _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: AppColors.textLight,
              ),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Champ requis';
            if (v.length < 8) return 'Au moins 8 caractères';
            return null;
          },
        ),
      ],
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passCtrl.text != _pass2Ctrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Les mots de passe ne correspondent pas')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      // Endpoint: POST api/auth/register/
      // Fields expected by Django: full_name, email, password, confirm_password, role
      await ApiClient().post(ApiPaths.authRegister, data: {
        'full_name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'confirm_password': _pass2Ctrl.text,
        'role': 'student',
      });
      if (mounted) {
        context.go('/verify-otp?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_parseApiError(e)),
            backgroundColor: AppColors.danger,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

// ─── Company Registration ─────────────────────────────────────────────────────

class CompanyRegisterPage extends StatefulWidget {
  const CompanyRegisterPage({super.key});

  @override
  State<CompanyRegisterPage> createState() => _CompanyRegisterPageState();
}

class _CompanyRegisterPageState extends State<CompanyRegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _companyNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _companyNameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inscription Entreprise'),
        backgroundColor: AppColors.gradientStart,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              _field('Nom de l\'entreprise', _companyNameCtrl, Icons.business_outlined),
              const SizedBox(height: 16),
              _field('Email professionnel', _emailCtrl, Icons.email_outlined,
                  type: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _passwordField('Mot de passe', _passCtrl),
              const SizedBox(height: 16),
              _passwordField('Confirmer le mot de passe', _pass2Ctrl),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gradientStart,
                  ),
                  child: const Text('Créer mon compte entreprise'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, IconData icon,
      {TextInputType? type}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          keyboardType: type,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AppColors.textLight),
          ),
          validator: (v) => (v == null || v.trim().isEmpty) ? 'Champ requis' : null,
        ),
      ],
    );
  }

  Widget _passwordField(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          obscureText: _obscure,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textLight),
            suffixIcon: IconButton(
              icon: Icon(
                _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: AppColors.textLight,
              ),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Champ requis';
            if (v.length < 8) return 'Au moins 8 caractères';
            return null;
          },
        ),
      ],
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passCtrl.text != _pass2Ctrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Les mots de passe ne correspondent pas')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      // Endpoint: POST api/auth/register/
      // full_name is used as the company display name
      await ApiClient().post(ApiPaths.authRegister, data: {
        'full_name': _companyNameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'confirm_password': _pass2Ctrl.text,
        'role': 'company',
      });
      if (mounted) {
        context.go('/verify-otp?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_parseApiError(e)),
            backgroundColor: AppColors.danger,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class AdministrationRegisterPage extends StatefulWidget {
  const AdministrationRegisterPage({super.key});

  @override
  State<AdministrationRegisterPage> createState() => _AdministrationRegisterPageState();
}

class _AdministrationRegisterPageState extends State<AdministrationRegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Administration sign up'),
        backgroundColor: AppColors.gradientMid,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Use the exact email pre-approved by the platform admin for your university.',
                style: TextStyle(color: AppColors.textMid, fontSize: 13),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Full name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'University email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (v) {
                  if (v == null || !v.contains('@')) return 'Valid email required';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passCtrl,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v != null && v.length >= 8) ? null : 'At least 8 characters',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _pass2Ctrl,
                obscureText: _obscure,
                decoration: const InputDecoration(
                  labelText: 'Confirm password',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (v) => (v == _passCtrl.text) ? null : 'Passwords must match',
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.gradientMid),
                        child: const Text('Create administration account'),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiClient().post(ApiPaths.authRegister, data: {
        'full_name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'confirm_password': _pass2Ctrl.text,
        'role': 'administration',
      });
      if (mounted) {
        context.go('/verify-otp?email=${Uri.encodeComponent(_emailCtrl.text.trim())}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_parseApiError(e)), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
