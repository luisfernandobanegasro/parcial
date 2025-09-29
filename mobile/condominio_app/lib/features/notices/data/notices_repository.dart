import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../env.dart';
import 'models/notice.dart';

/// Repositorio global (sin provider).
final noticesRepository = NoticesRepository._();

class NoticesRepository {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  NoticesRepository._() : _dio = Dio(BaseOptions(baseUrl: Env.baseUrl)) {
    // Interceptor simple para Authorization
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access'); // clave típica usada
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
  }

  Future<List<Notice>> listActive() async {
    final res =
        await _dio.get('/api/notices/', queryParameters: {'vigentes': true});
    final data = (res.data as List).cast<Map<String, dynamic>>();
    return data.map(Notice.fromJson).toList();
  }

  Future<Notice> detail(int id) async {
    final res = await _dio.get('/api/notices/$id/');
    return Notice.fromJson((res.data as Map<String, dynamic>));
  }
}
