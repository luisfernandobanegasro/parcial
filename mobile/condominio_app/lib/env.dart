class Env {
  // Si estás en emulador
  //static const String baseUrl = "http://10.0.2.2:8000/api";

  // Si usas teléfono real con adb reverse:
  static const String baseUrl = "http://127.0.0.1:8000/api/";

  // Si usas IP LAN:
  // static const String baseUrl = "http://192.168.1.50:8000/api";

  // Endpoints relativos
  static const String loginPath = "auth/login/";
  static const String refreshPath = "auth/refresh/";
  static const String forgotPath = "auth/password/forgot/";
  static const String resetPath = "auth/password/reset/";
  static const String changePath = "auth/password/change/";
  static const String mePath = "me/";
}
/*
Si cambias a emulador, solo cambia baseUrl a http://10.0.2.2:8000/api/.
Sin adb reverse, usa la IP LAN: http://192.168.x.y:8000/api/.
adb reverse tcp:8000 tcp:8000
*/
