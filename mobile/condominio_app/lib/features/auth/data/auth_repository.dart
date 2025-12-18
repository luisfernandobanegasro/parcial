import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../env.dart';

class AuthRepository {
  final Dio _dio;
  final IStorage _storage;

  AuthRepository({required Dio dio, required IStorage storage})
      : _dio = dio,
        _storage = storage;

  static const _kAccess = 'access';
  static const _kRefresh = 'refresh';

  Future<void> login(
      {required String username, required String password}) async {
    final res = await _dio.post(
      Env.tokenPath,
      data: {'username': username, 'password': password},
    );
    final data = (res.data as Map).cast<String, dynamic>();
    final access = data['access'] as String?;
    final refresh = data['refresh'] as String?;
    if (access == null || refresh == null) {
      throw Exception('Respuesta de login inválida.');
    }
    await _storage.write(key: _kAccess, value: access);
    await _storage.write(key: _kRefresh, value: refresh);
  }

  Future<bool> refresh() async {
    final refresh = await _storage.read(key: _kRefresh);
    if (refresh == null) return false;
    try {
      final res = await _dio.post(Env.refreshPath, data: {'refresh': refresh});
      final data = (res.data as Map).cast<String, dynamic>();
      final access = data['access'] as String?;
      if (access == null) return false;
      await _storage.write(key: _kAccess, value: access);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      // Si no tienes un endpoint de logout en el backend,
      // simplemente limpia el storage local:
      await _storage.deleteAll();
    } catch (_) {
      // en caso de error, igual limpia local
      await _storage.deleteAll();
    }
  }

  Future<String?> get accessToken async => _storage.read(key: _kAccess);
  Future<String?> get refreshToken async => _storage.read(key: _kRefresh);
}
