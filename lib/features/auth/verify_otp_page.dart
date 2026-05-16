import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/theme.dart';
import 'package:dio/dio.dart';

class VerifyOtpPage extends StatefulWidget {
  final String email;
  const VerifyOtpPage({super.key, required this.email});

  @override
  State<VerifyOtpPage> createState() => _VerifyOtpPageState();
}

class _VerifyOtpPageState extends State<VerifyOtpPage> {
  final _codeCtrl = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  String? _errorMsg;
  bool _resentSuccess = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final code = _codeCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Entrez le code à 6 chiffres.');
      return;
    }
    setState(() {
      _loading = true;
      _errorMsg = null;
      _resentSuccess = false;
    });
    try {
      await ApiClient().post(ApiPaths.authVerifyOtp, data: {
        'email': widget.email,
        'code': code,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email vérifié ! Vous pouvez maintenant vous connecter.'),
            backgroundColor: AppColors.success,
          ),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMsg = _parseError(e);
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _errorMsg = null;
      _resentSuccess = false;
      _codeCtrl.clear();
    });
    try {
      await ApiClient().post(ApiPaths.authResendOtp, data: {'email': widget.email});
      if (mounted) {
        setState(() => _resentSuccess = true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMsg = _parseError(e));
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        final msg = data['error'] ?? data['detail'];
        if (msg != null) return msg.toString();
      }
      final status = e.response?.statusCode;
      if (status == 400) return 'Code invalide ou expiré. Renvoyez un nouveau code.';
      if (status == 404) return 'Utilisateur introuvable.';
      if (e.type == DioExceptionType.connectionError) {
        return 'Impossible de se connecter au serveur.';
      }
    }
    return 'Une erreur est survenue. Réessayez.';
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
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                        onPressed: () => context.go('/login'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icon
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.mark_email_read_outlined,
                            color: Colors.white,
                            size: 36,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Vérifiez votre email',
                          style: AppTextStyles.h1.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Un code de confirmation a été envoyé à :',
                          style: AppTextStyles.bodyMid.copyWith(color: Colors.white70),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.email,
                          style: AppTextStyles.bodyMid.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Form card
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Error banner
                              if (_errorMsg != null) ...[
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.danger.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: AppColors.danger.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline,
                                          color: AppColors.danger, size: 18),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _errorMsg!,
                                          style: const TextStyle(
                                              color: AppColors.danger, fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              // Resent success banner
                              if (_resentSuccess) ...[
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.success.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: AppColors.success.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.check_circle_outline,
                                          color: AppColors.success, size: 18),
                                      const SizedBox(width: 8),
                                      const Expanded(
                                        child: Text(
                                          'Nouveau code envoyé ! Vérifiez votre boîte mail.',
                                          style: TextStyle(
                                              color: AppColors.success, fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              Text('Code de confirmation', style: AppTextStyles.label),
                              const SizedBox(height: 8),

                              // Code input — NO auto-submit, user taps Confirm
                              TextFormField(
                                controller: _codeCtrl,
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                                autofocus: true,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 10,
                                ),
                                decoration: const InputDecoration(
                                  hintText: '------',
                                  hintStyle: TextStyle(letterSpacing: 10, fontSize: 28),
                                  counterText: '',
                                ),
                                onChanged: (v) {
                                  // Clear errors as user types
                                  if (_errorMsg != null || _resentSuccess) {
                                    setState(() {
                                      _errorMsg = null;
                                      _resentSuccess = false;
                                    });
                                  }
                                },
                                // Submit on keyboard "done" action
                                onFieldSubmitted: (_) => _verify(),
                              ),
                              const SizedBox(height: 6),
                              Center(
                                child: Text(
                                  'Entrez le code à 6 chiffres reçu par email',
                                  style: AppTextStyles.small,
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(height: 28),

                              // Confirm button
                              SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: _loading
                                    ? const Center(child: CircularProgressIndicator())
                                    : ElevatedButton(
                                  onPressed: _verify,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: const Text(
                                    'Confirmer',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Resend button — full width, outlined style
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: _resending
                                    ? const Center(
                                  child: SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                )
                                    : OutlinedButton.icon(
                                  onPressed: _resend,
                                  icon: const Icon(Icons.refresh,
                                      size: 16, color: AppColors.accent),
                                  label: const Text(
                                    'Renvoyer un nouveau code',
                                    style: TextStyle(
                                      color: AppColors.accent,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(
                                        color: AppColors.accent.withOpacity(0.4)),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
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
}
