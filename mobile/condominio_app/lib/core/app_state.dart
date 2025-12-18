import 'package:flutter/foundation.dart';

import 'storage/secure_storage.dart';
import '../features/auth/data/auth_repository.dart';
import 'api_client.dart' show TokenProvider;

enum AuthStatus { unknown, authenticated, unauthenticated }

class AppState extends ChangeNotifier implements TokenProvider {
  final AuthRepository authRepo;
  final IStorage storage;

  AuthStatus _status = AuthStatus.unknown;
  AuthStatus get status => _status;

  AppState({required this.authRepo, required this.storage});

  /// Llamar en el arranque (por ejemplo en SplashScreen).
  Future<void> init() async {
    final access = await authRepo.accessToken;
    final refresh = await authRepo.refreshToken;

    if (access != null && access.isNotEmpty) {
      _status = AuthStatus.authenticated;
    } else if (refresh != null) {
      final ok = await authRepo.refresh();
      _status = ok ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> setLoggedIn() async {
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> doLogout() async {
    await authRepo.logout();
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  // -------- TokenProvider (usado por ApiClient) ----------
  @override
  Future<String?> getAccessToken() => authRepo.accessToken;

  @override
  Future<bool> refreshToken() => authRepo.refresh();

  @override
  void forceLogout() {
    // Limpieza inmediata si el refresh falla
    storage.deleteAll();
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  // --- ME (perfil actual) cache ---
  Map<String, dynamic>? _me;
  Map<String, dynamic>? get me => _me;

  void setMe(Map<String, dynamic> data) {
    _me = Map<String, dynamic>.from(data);
    notifyListeners(); // por si alguien escucha cambios
  }

  void clearMe() {
    _me = null;
    // opcional: no hace falta notificar aquí si no lo usas reactivo
  }
}
