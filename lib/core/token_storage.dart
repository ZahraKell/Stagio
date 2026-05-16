import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'constants.dart';

/// Persists JWT tokens. Web uses SharedPreferences (secure storage is unreliable on web).
class TokenStorage {
  TokenStorage._();
  static final TokenStorage instance = TokenStorage._();

  static const _secure = FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<void> _ensurePrefs() async {
    if (kIsWeb && _prefs == null) {
      _prefs = await SharedPreferences.getInstance();
    }
  }

  Future<String?> read(String key) async {
    if (kIsWeb) {
      await _ensurePrefs();
      return _prefs!.getString(key);
    }
    return _secure.read(key: key);
  }

  Future<void> write(String key, String value) async {
    if (kIsWeb) {
      await _ensurePrefs();
      await _prefs!.setString(key, value);
      return;
    }
    await _secure.write(key: key, value: value);
  }

  Future<void> delete(String key) async {
    if (kIsWeb) {
      await _ensurePrefs();
      await _prefs!.remove(key);
      return;
    }
    await _secure.delete(key: key);
  }

  Future<void> deleteAll() async {
    if (kIsWeb) {
      await _ensurePrefs();
      await _prefs!.remove(AppConstants.accessTokenKey);
      await _prefs!.remove(AppConstants.refreshTokenKey);
      await _prefs!.remove(AppConstants.userRoleKey);
      await _prefs!.remove(AppConstants.companyStatusKey);
      return;
    }
    await _secure.deleteAll();
  }
}
