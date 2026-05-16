import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  // Step 1 = enter email, Step 2 = enter OTP + new password
  int _step = 1;
  bool _loading = false;

  // Step 1
  final _emailCtrl = TextEditingController();

  // Step 2
  final _codeCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  bool _obscure = true;

  // We keep the email around so step 2 can send it
  String _submittedEmail = '';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _passCtrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  // ─── Step 1: request OTP ────────────────────────────────────────────────
  Future<void> _requestOtp() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      _showError('Veuillez saisir votre adresse email.');
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiClient().post(ApiPaths.authForgotPassword, data: {'email': email});
      _submittedEmail = email;
      if (mounted) {
        setState(() {
          _loading = false;
          _step = 2;
        });
        _showSuccess('Un code a été envoyé à $email');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        _showError('Impossible d\'envoyer le code. Vérifiez votre connexion.');
      }
    }
  }

  // ─── Step 2: reset password ─────────────────────────────────────────────
  Future<void> _resetPassword() async {
    final code = _codeCtrl.text.trim();
    final newPass = _passCtrl.text;
    final confirm = _pass2Ctrl.text;

    if (code.isEmpty || newPass.isEmpty || confirm.isEmpty) {
      _showError('Tous les champs sont obligatoires.');
      return;
    }
    if (newPass.length < 8) {
      _showError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPass != confirm) {
      _showError('Les mots de passe ne correspondent pas.');
      return;
    }

    setState(() => _loading = true);
    try {
      await ApiClient().post(ApiPaths.authResetPassword, data: {
        'email': _submittedEmail,
        'code': code,
        'new_password': newPass,
        'confirm_password': confirm,
      });
      if (mounted) {
        setState(() => _loading = false);
        _showSuccess('Mot de passe réinitialisé avec succès !');
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        final msg = e.toString().contains('400')
            ? 'Code invalide ou expiré. Réessayez.'
            : 'Une erreur est survenue. Réessayez.';
        _showError(msg);
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
    );
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.success),
    );
  }

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
            child: Column(
              children: [
                // ── Top bar ──────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                        onPressed: () {
                          if (_step == 2) {
                            setState(() => _step = 1);
                          } else {
                            context.pop();
                          }
                        },
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Icon ─────────────────────────────────────────
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.lock_reset_outlined,
                            color: Colors.white,
                            size: 36,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          _step == 1 ? 'Mot de passe oublié' : 'Nouveau mot de passe',
                          style: AppTextStyles.h1.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _step == 1
                              ? 'Entrez votre email pour recevoir un code de réinitialisation.'
                              : 'Entrez le code reçu par email et choisissez un nouveau mot de passe.',
                          style: AppTextStyles.bodyMid.copyWith(color: Colors.white70),
                        ),
                        const SizedBox(height: 40),
                        // ── Form card ─────────────────────────────────────
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 32,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: _step == 1 ? _buildStep1() : _buildStep2(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Step 1 form ─────────────────────────────────────────────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Step indicator
        _StepIndicator(current: 1, total: 2),
        const SizedBox(height: 24),
        Text('Adresse email', style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'exemple@email.com',
            prefixIcon: Icon(Icons.email_outlined, color: AppColors.textLight),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ElevatedButton(
            onPressed: _requestOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text(
              'Envoyer le code',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Center(
          child: TextButton(
            onPressed: () => context.go('/login'),
            child: Text(
              'Retour à la connexion',
              style: TextStyle(color: AppColors.textMid, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Step 2 form ─────────────────────────────────────────────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Step indicator
        _StepIndicator(current: 2, total: 2),
        const SizedBox(height: 8),
        // Email reminder chip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.email_outlined, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'Code envoyé à $_submittedEmail',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text('Code de vérification', style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: _codeCtrl,
          keyboardType: TextInputType.number,
          maxLength: 6,
          autofocus: true,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            letterSpacing: 8,
          ),
          decoration: const InputDecoration(
            hintText: '000000',
            counterText: '',
            prefixIcon: Icon(Icons.pin_outlined, color: AppColors.textLight),
          ),
        ),
        const SizedBox(height: 20),
        Text('Nouveau mot de passe', style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passCtrl,
          obscureText: _obscure,
          decoration: InputDecoration(
            hintText: '8 caractères minimum',
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textLight),
            suffixIcon: IconButton(
              icon: Icon(
                _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: AppColors.textLight,
              ),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Confirmer le mot de passe', style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: _pass2Ctrl,
          obscureText: _obscure,
          decoration: const InputDecoration(
            hintText: 'Répétez le mot de passe',
            prefixIcon: Icon(Icons.lock_outline, color: AppColors.textLight),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ElevatedButton(
            onPressed: _resetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text(
              'Réinitialiser',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton.icon(
            onPressed: () => setState(() => _step = 1),
            icon: const Icon(Icons.refresh, size: 16, color: AppColors.accent),
            label: Text(
              'Renvoyer le code',
              style: TextStyle(color: AppColors.accent, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Small step progress indicator ────────────────────────────────────────────
class _StepIndicator extends StatelessWidget {
  final int current;
  final int total;
  const _StepIndicator({required this.current, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        final active = i < current;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < total - 1 ? 6 : 0),
            height: 4,
            decoration: BoxDecoration(
              color: active ? AppColors.primary : AppColors.border,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      }),
    );
  }
}
