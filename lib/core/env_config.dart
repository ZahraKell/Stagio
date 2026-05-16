import 'package:flutter/foundation.dart' show kIsWeb;

import 'platform_info.dart';

/// Central API configuration. Override at build/run time:
/// `flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/`
class EnvConfig {
  static const String _apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String get apiBaseUrl {
    if (_apiBaseUrl.isNotEmpty) {
      return _apiBaseUrl.endsWith('/') ? _apiBaseUrl : '$_apiBaseUrl/';
    }
    if (kIsWeb) return 'http://127.0.0.1:8000/api/';
    if (PlatformInfo.isAndroid) return 'http://10.0.2.2:8000/api/';
    return 'http://127.0.0.1:8000/api/';
  }
}
