import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../env.dart';

class AuthRepository {
  final ApiClient api;
  final AppSecureStorage storage;
  AuthRepository({required this.api, required this.storage});

  /// Login real: envía credenciales, guarda tokens.
  Future<void> login({required String username, required String password}) async {
    try {
      final Response res = await api.dio.post(
        Env.loginPath,
        data: {'username': username, 'password': password},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );

      // SimpleJWT: {access: "...", refresh: "..."}
      final access  = res.data['access']  as String?;
      final refresh = res.data['refresh'] as String?;

      if (access == null || refresh == null) {
        throw Exception('Respuesta inválida del servidor (sin tokens)');
      }
      await storage.saveTokens(access: access, refresh: refresh);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data['detail']?.toString() ?? 'Error de autenticación')
          : 'Error de red';
      rethrowWithMessage(msg);
    }
  }

  /// Cierra sesión local (limpia tokens).
  Future<void> logout() async {
    await storage.clear();
    // (Opcional) Llamar a un endpoint de logout si tu backend lo tiene.
  }

  /// Perfil del usuario autenticado.
  Future<UserProfile> getCurrentUser() async {
    final res = await api.dio.get(Env.mePath);
    // Parse robusto (cuida encoding)
    final data = (res.data is Map) ? res.data as Map<String, dynamic>
                                   : json.decode(res.data as String) as Map<String, dynamic>;
    return UserProfile.fromJson(data);
  }

  Never rethrowWithMessage(String msg) => throw Exception(msg);
}

class UserProfile {
  final String id;
  final String username;
  final String email;

  UserProfile({required this.id, required this.username, required this.email});

  factory UserProfile.fromJson(Map<String, dynamic> j) => UserProfile(
        id: (j['id'] ?? '').toString(),
        // Ajusta según tu serializer en Django:
        username: (j['username'] ?? j['name'] ?? j['full_name'] ?? '').toString(),
        email: (j['email'] ?? '').toString(),
      );
}
