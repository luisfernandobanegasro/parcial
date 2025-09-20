import 'package:dio/dio.dart'; // Cliente HTTP
import 'package:flutter/foundation.dart'; // Para debugPrint
import '../env.dart'; // Configuración de URLs
import 'storage/secure_storage.dart'; // Almacenamiento seguro de tokens

class ApiClient {
  // Cliente HTTP configurado con baseUrl y timeouts
  final Dio dio = Dio(BaseOptions(
    baseUrl: Env.baseUrl,
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 8),
  ));

  // Manejo de tokens en almacenamiento seguro
  final AppSecureStorage storage = AppSecureStorage();

  ApiClient() {
    // Interceptor de logs para depuración
    dio.interceptors.add(LogInterceptor(
      request: true,
      requestHeader: true,
      requestBody: true,
      responseBody: true,
      error: true,
      logPrint: (obj) => debugPrint(obj.toString()),
    ));

    // Interceptor para autenticación automática
    dio.interceptors.add(
      InterceptorsWrapper(
        // Adjunta token en cada request
        onRequest: (options, handler) async {
          final token = await storage.readAccess();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },

        // Maneja errores 401 → intenta refresh y reintenta
        onError: (e, handler) async {
          final is401 = e.response?.statusCode == 401;
          final req = e.requestOptions;
          final isRefreshCall = req.path.endsWith(Env.refreshPath);

          if (is401 && !isRefreshCall && await _refresh()) {
            final token = await storage.readAccess();
            if (token != null && token.isNotEmpty) {
              req.headers['Authorization'] = 'Bearer $token';
            }
            final retry = await dio.fetch(req);
            return handler.resolve(retry);
          }
          handler.next(e);
        },
      ),
    );
  }

  // Renueva el access token usando el refresh
  Future<bool> _refresh() async {
    try {
      final refresh = await storage.readRefresh();
      if (refresh == null || refresh.isEmpty) return false;

      final res = await dio.post(
        Env.refreshPath,
        data: {'refresh': refresh},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );

      final newAccess = res.data['access'] as String?;
      if (newAccess == null || newAccess.isEmpty) return false;

      await storage.saveTokens(access: newAccess, refresh: refresh);
      return true;
    } catch (e) {
      await storage.clear();
      return false;
    }
  }
}
