import 'dart:async';
import 'package:dio/dio.dart';
import '../env.dart';

/// Contrato para pedir/renovar token desde el interceptor.
abstract class TokenProvider {
  Future<String?> getAccessToken();
  Future<bool> refreshToken(); // true si se renovó
  void forceLogout(); // por ejemplo, limpiar estado y navegar a login
}

class ApiClient {
  final Dio dio;

  ApiClient({required TokenProvider tokenProvider})
      : dio = Dio(BaseOptions(
          baseUrl: Env.baseUrl,
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
          headers: {'Content-Type': 'application/json'},
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokenProvider.getAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        // Si es 401 intentamos refrescar UNA vez.
        if (e.response?.statusCode == 401) {
          final ok = await tokenProvider.refreshToken();
          if (ok) {
            try {
              final req = e.requestOptions;
              final token = await tokenProvider.getAccessToken();
              if (token != null) req.headers['Authorization'] = 'Bearer $token';
              final clone = await dio.fetch(req);
              return handler.resolve(clone);
            } catch (_) {
              // si falla el reintento, continúa con error
            }
          } else {
            tokenProvider.forceLogout();
          }
        }
        handler.next(e);
      },
    ));
  }
}
