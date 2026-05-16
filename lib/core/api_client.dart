import 'package:dio/dio.dart';

import 'api_paths.dart';
import 'constants.dart';
import 'token_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final _storage = TokenStorage.instance;
  late final Dio _dio;
  bool _isRefreshing = false;

  Dio get dio => _dio;

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onError: _onError,
    ));
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(AppConstants.accessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isRefreshCall = err.requestOptions.path.contains('token/refresh');
    if (err.response?.statusCode == 401 &&
        !_isRefreshing &&
        !isRefreshCall) {
      _isRefreshing = true;
      try {
        final refreshed = await _refreshToken();
        if (refreshed) {
          final token = await _storage.read(AppConstants.accessTokenKey);
          err.requestOptions.headers['Authorization'] = 'Bearer $token';
          final cloneReq = await _dio.fetch(err.requestOptions);
          handler.resolve(cloneReq);
          return;
        }
        await _storage.deleteAll();
      } catch (_) {
        await _storage.deleteAll();
      } finally {
        _isRefreshing = false;
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.read(AppConstants.refreshTokenKey);
      if (refresh == null) return false;

      final response = await Dio().post(
        '${AppConstants.baseUrl}${ApiPaths.authRefresh}',
        data: {'refresh': refresh},
      );

      final newAccess = response.data['access'] as String?;
      if (newAccess != null) {
        await _storage.write(AppConstants.accessTokenKey, newAccess);
        final newRefresh = response.data['refresh'] as String?;
        if (newRefresh != null) {
          await _storage.write(AppConstants.refreshTokenKey, newRefresh);
        }
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }

  /// Extracts a list from raw JSON or DRF `{"data": [...]}` envelopes.
  static List<dynamic> extractList(dynamic responseData) {
    if (responseData is List) return responseData;
    if (responseData is Map) {
      final data = responseData['data'];
      if (data is List) return data;
      final results = responseData['results'];
      if (results is List) return results;
    }
    return [];
  }

  static List<T> unwrapList<T>(
    dynamic responseData,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return extractList(responseData)
        .map((e) => fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Map<String, dynamic>? extractMap(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      if (responseData['data'] is Map<String, dynamic>) {
        return responseData['data'] as Map<String, dynamic>;
      }
      return responseData;
    }
    return null;
  }

  static T? unwrapSingle<T>(
    dynamic responseData,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final map = extractMap(responseData);
    return map != null ? fromJson(map) : null;
  }
}
