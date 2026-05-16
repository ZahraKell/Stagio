import 'package:dio/dio.dart';

String parseApiError(dynamic e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'] ?? data['error'] ?? data['detail'];
      if (msg != null) return msg.toString();
      final errors = data['errors'];
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        if (first is List && first.isNotEmpty) return first.first.toString();
        return first.toString();
      }
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Cannot reach the server. Is the backend running?';
    }
  }
  return e.toString();
}
