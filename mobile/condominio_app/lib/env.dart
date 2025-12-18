import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class Env {
  /// Usa --dart-define=API_BASE_URL=... al compilar
  static const String _baseUrlFromEnv = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// Base URL detectada
  static String get baseUrl {
    // Si pasamos la variable en build/run, la usamos
    if (_baseUrlFromEnv.isNotEmpty) {
      return _baseUrlFromEnv;
    }

    // Fallbacks locales (desarrollo)
    if (kIsWeb) {
      return "http://127.0.0.1:8000/api";
    } else if (Platform.isAndroid) {
      return "http://127.0.0.1:8000/api";
    } else if (Platform.isIOS) {
      return "http://127.0.0.1:8000/api";
    } else {
      return "http://127.0.0.1:8000/api";
    }
  }

  // ========== AUTH ==========
  static const tokenPath = '/auth/login/';
  static const refreshPath = '/auth/refresh/';
  static const forgotPath = '/auth/password/forgot/';
  static const resetPath = '/auth/password/reset/';
  static const changePath = '/auth/password/change/';
  static const mePath = '/me/';

  // ========== COMUNICACIÓN ==========
  static String get comunicacionBase => '$baseUrl/comunicacion';
  static const avisosPath = '/avisos/';
  static const lecturasPath = '/lecturas/';

  // ========== RESERVAS ==========
  static String get reservasBase => '$baseUrl/reservas';
  static const reservasPath = '/reservas/';
  static const areasPath = '/areas/';
}
