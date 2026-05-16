import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/api_paths.dart';
import '../../core/constants.dart';
import '../../core/token_storage.dart';
import '../../models/user.dart';

class AuthState {
  final bool isLoading;
  final bool isInitialized;
  final UserProfile? user;
  final String? error;
  final bool needsVerification;

  const AuthState({
    this.isLoading = false,
    this.isInitialized = false,
    this.user,
    this.error,
    this.needsVerification = false,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isInitialized,
    UserProfile? user,
    String? error,
    bool? needsVerification,
    bool clearUser = false,
  }) =>
      AuthState(
        isLoading: isLoading ?? this.isLoading,
        isInitialized: isInitialized ?? this.isInitialized,
        user: clearUser ? null : (user ?? this.user),
        error: error,
        needsVerification: needsVerification ?? this.needsVerification,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final _storage = TokenStorage.instance;
  final _api = ApiClient();

  AuthNotifier() : super(const AuthState());

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    final token = await _storage.read(AppConstants.accessTokenKey);
    if (token == null) {
      state = state.copyWith(isLoading: false, isInitialized: true);
      return;
    }
    try {
      final res = await _api.get(ApiPaths.authMe);
      final data = ApiClient.extractMap(res.data);
      if (data != null) {
        final profile = UserProfile.fromJson(data);
        state = AuthState(user: profile, isInitialized: true);
        return;
      }
    } on Object catch (e) {
      if (_isAuthError(e)) {
        await _storage.deleteAll();
      }
    }
    state = state.copyWith(isLoading: false, isInitialized: true, clearUser: true);
  }

  Future<UserRole?> login(String email, String password) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      needsVerification: false,
    );
    try {
      final res = await _api.post(
        ApiPaths.authLogin,
        data: {'email': email, 'password': password},
      );
      final data = res.data as Map<String, dynamic>;
      final access = data['access'] as String;
      final refresh = data['refresh'] as String;
      final roleStr = data['role']?.toString();
      final companyStatus = data['company_status'];

      await _storage.write(AppConstants.accessTokenKey, access);
      await _storage.write(AppConstants.refreshTokenKey, refresh);
      if (roleStr != null) {
        await _storage.write(AppConstants.userRoleKey, roleStr);
      }
      if (companyStatus != null) {
        await _storage.write(
          AppConstants.companyStatusKey,
          companyStatus.toString(),
        );
      }

      final role = roleFromString(roleStr);

      UserProfile profile;
      try {
        final meRes = await _api.get(ApiPaths.authMe);
        final meData = ApiClient.extractMap(meRes.data);
        profile = meData != null
            ? UserProfile.fromJson(meData)
            : UserProfile(
                id: 0,
                email: email,
                fullName: email,
                role: role,
              );
      } catch (_) {
        profile = UserProfile(
          id: 0,
          email: email,
          fullName: email,
          role: role,
        );
      }

      state = AuthState(user: profile, isInitialized: true);
      return role;
    } catch (e) {
      final is403 = e is DioException && e.response?.statusCode == 403;
      state = state.copyWith(
        isLoading: false,
        isInitialized: true,
        error: _parseError(e),
        needsVerification: is403,
      );
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final refresh = await _storage.read(AppConstants.refreshTokenKey);
      if (refresh != null) {
        await _api.post(ApiPaths.authLogout, data: {'refresh': refresh});
      }
    } catch (_) {}
    await _storage.deleteAll();
    state = const AuthState(isInitialized: true);
  }

  Future<UserRole?> getSavedRole() async {
    final roleStr = await _storage.read(AppConstants.userRoleKey);
    final token = await _storage.read(AppConstants.accessTokenKey);
    if (token == null) return null;
    return roleFromString(roleStr);
  }

  String? homeRouteForRole(UserRole role) {
    switch (role) {
      case UserRole.student:
        return '/student/home';
      case UserRole.company:
        return '/company/dashboard';
      case UserRole.admin:
        return '/admin/dashboard';
      case UserRole.administration:
        return '/administration/dashboard';
    }
  }

  bool _isAuthError(dynamic e) {
    if (e is DioException) {
      final status = e.response?.statusCode;
      return status == 401 || status == 403;
    }
    final msg = e.toString();
    return msg.contains('401') || msg.contains('403');
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      final serverMsg = data is Map ? (data['error'] ?? data['detail'] ?? data['message']) : null;

      if (status == 403) {
        return 'Compte non activé. Vérifiez votre email avant de vous connecter.';
      }
      if (status == 401) {
        return 'Email ou mot de passe incorrect.';
      }
      if (serverMsg != null) return serverMsg.toString();
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.unknown) {
        return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      }
      if (e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return 'Le serveur ne répond pas. Réessayez.';
      }
    }
    final msg = e.toString();
    if (msg.contains('SocketException') || msg.contains('Failed host lookup')) {
      return 'Pas de connexion réseau.';
    }
    return 'Une erreur est survenue. Réessayez.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final notifier = AuthNotifier();
  notifier.checkAuth();
  return notifier;
});
