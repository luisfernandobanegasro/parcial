import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import 'models/notice.dart';

class NoticesRepository {
  final Dio _dio;
  NoticesRepository(ApiClient apiClient) : _dio = apiClient.dio;

  // --- Helpers ---
  List<dynamic> _asList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['results'] is List) return data['results'] as List;
    return const [];
  }

  // ---------------- API OFICIAL (tus nombres) ----------------
  Future<List<Notice>> list({String? estado, String? prioridad}) async {
    final qp = <String, dynamic>{};
    if (estado != null && estado.isNotEmpty) qp['estado'] = estado;
    if (prioridad != null && prioridad.isNotEmpty) qp['prioridad'] = prioridad;

    final resp = await _dio.get('/comunicacion/avisos/', queryParameters: qp);
    final list = _asList(resp.data);
    return list.map((j) => Notice.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<Notice> detail(int id) async {
    final resp = await _dio.get('/comunicacion/avisos/$id/');
    return Notice.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<void> marcarVisto(int id) async {
    await _dio.post('/comunicacion/avisos/$id/marcar_visto/');
  }

  // ---------------- ALIAS para la UI (los nombres que usa tu código) -----
  // AvisosList: context.read<NoticesRepository>().fetchNotices();
  Future<List<Notice>> fetchNotices({String estado = 'vigente'}) async {
    return list(estado: estado);
  }

  // NoticeDetailScreen: await repo.markRead(id);
  Future<void> markRead(int id) => marcarVisto(id);
}
