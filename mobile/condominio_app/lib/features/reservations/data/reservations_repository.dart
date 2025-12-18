import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import 'models/area.dart';
import 'models/reservation.dart';

class ReservationsRepository {
  final Dio _dio;
  ReservationsRepository(ApiClient apiClient) : _dio = apiClient.dio;

  Dio get dio => _dio; // útil para /me/

  List<dynamic> _asList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['results'] is List) return data['results'] as List;
    return const [];
  }

  // ---- Áreas ----
  Future<List<Area>> fetchAreas() async {
    final resp = await _dio.get('/reservas/areas/');
    final list = _asList(resp.data);
    return list.map((j) => Area.fromJson(j as Map<String, dynamic>)).toList();
  }

  // ---- Reservas ----
  Future<List<Reservation>> fetchReservations({
    bool? vigentes,
    bool?
        soloMias, // ignorado en server por bug de tipos; filtraremos en cliente
  }) async {
    final qp = <String, dynamic>{};
    if (vigentes == true) qp['vigente'] = 'yes';
    // NO mandamos mias=yes para evitar el 500 (uuid vs int)

    final resp = await _dio.get('/reservas/reservas/', queryParameters: qp);
    final list = _asList(resp.data);
    return list
        .map((j) => Reservation.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  // Disponibilidad (ocupaciones en el rango)
  Future<List<Reservation>> checkAvailability({
    required int areaId,
    required DateTime start,
    required DateTime end,
  }) async {
    final resp = await _dio.get(
      '/reservas/areas/$areaId/disponibilidad/',
      queryParameters: {
        'start': start.toIso8601String(),
        'end': end.toIso8601String(),
      },
    );
    final list = _asList((resp.data ?? {})['ocupadas']);
    return list
        .map((j) => Reservation.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<Reservation> createReservation(Map<String, dynamic> payload) async {
    final resp = await _dio.post('/reservas/reservas/', data: payload);
    return Reservation.fromJson(resp.data as Map<String, dynamic>);
  }

  // Acciones
  Future<void> cancelar(int id) async {
    await _dio.patch('/reservas/reservas/$id/cancelar/');
  }

  Future<void> confirmar(int id) async {
    await _dio.patch('/reservas/reservas/$id/confirmar/');
  }

  Future<void> rechazar(int id) async {
    await _dio.patch('/reservas/reservas/$id/rechazar/');
  }
}
