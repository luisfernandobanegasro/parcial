import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';

import '../../../core/api_client.dart';
import 'models.dart';

class BillingRepository {
  final Dio _dio;
  BillingRepository(ApiClient api) : _dio = api.dio;

  // --- util: desempaquetar "results" si DRF pagina ---
  List _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['results'] is List) return data['results'] as List;
    return const [];
  }

  // --- helpers: obtener unidad por defecto sin tocar backend ---
  Future<int?> _getDefaultUnidadId() async {
    // A) /usuarios/me/ o /me/
    for (final path in const ['/usuarios/me/', '/me/']) {
      try {
        final r = await _dio.get(path);
        final m = (r.data as Map?) ?? {};
        final list = (m['unidades'] as List?) ?? const [];
        if (list.isNotEmpty) {
          final pri = list.firstWhere(
            (u) => (u['principal'] == true),
            orElse: () => list.first,
          );
          final id = pri['id'];
          if (id is int) return id;
          if (id is num) return id.toInt();
        }
      } catch (_) {}
    }

    // B) /propiedades/unidades/?mine=1
    try {
      final r = await _dio
          .get('/propiedades/unidades/', queryParameters: {'mine': 1});
      final list = _unwrapList(r.data);
      if (list.isNotEmpty) {
        final id = (list.first as Map)['id'];
        if (id is int) return id;
        if (id is num) return id.toInt();
      }
    } catch (_) {}

    // C) /propiedades/usuarios-unidades/ para el usuario principal
    String? perfilId;
    for (final path in const ['/usuarios/me/', '/me/']) {
      try {
        final r = await _dio.get(path);
        final m = (r.data as Map?) ?? {};
        final id = m['id'];
        if (id is String && id.isNotEmpty) {
          perfilId = id;
          break;
        }
      } catch (_) {}
    }
    if (perfilId != null) {
      try {
        final r =
            await _dio.get('/propiedades/usuarios-unidades/', queryParameters: {
          'usuario': perfilId,
          'es_principal': 'true',
        });
        final list = _unwrapList(r.data);
        if (list.isNotEmpty) {
          final u = list.first as Map;
          final id = u['unidad'];
          if (id is int) return id;
          if (id is num) return id.toInt();
        }
      } catch (_) {}
    }

    return null; // no hallado
  }

  // -------- Consultar estado por unidad --------
  Future<List<EstadoItem>> estadoDeMiUnidad({int? unidadId}) async {
    final uid = unidadId ?? await _getDefaultUnidadId();
    if (uid == null) return [];
    final r = await _dio.get('/finanzas/estados/unidad/$uid/');
    final list = _unwrapList(r.data);
    return list
        .map((e) => EstadoItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // -------- Registrar pago (EFECTIVO) --------
  Future<Pago> registrarPagoEfectivo({
    required int unidadId,
    required List<Map<String, dynamic>> detalles,
  }) async {
    final body = {
      'unidad_id': unidadId,
      'medio': 'EFECTIVO',
      'detalles': detalles,
      'generar_documento': true,
      'tipo_documento': 'RECIBO',
    };
    final r = await _dio.post('/finanzas/pagos/registrar/', data: body);
    return Pago.fromJson(r.data as Map<String, dynamic>);
  }

  // -------- Registrar pago (QR) --------
  Future<Pago> registrarPagoQR({
    required int unidadId,
    required List<Map<String, dynamic>> detalles,
  }) async {
    final body = {
      'unidad_id': unidadId,
      'medio': 'QR',
      'detalles': detalles,
      'generar_documento': true,
      'tipo_documento': 'RECIBO',
    };
    final r = await _dio.post('/finanzas/pagos/registrar/', data: body);
    return Pago.fromJson(r.data as Map<String, dynamic>);
  }

  // -------- QR: iniciar + validar --------
  Future<({int intentoId, String qrText})> iniciarQR(int pagoId) async {
    final r = await _dio.post('/finanzas/pagos/$pagoId/iniciar_qr/');
    final m = r.data as Map<String, dynamic>;
    return (
      intentoId: (m['intento_id'] as num).toInt(),
      qrText: (m['qr_text'] ?? '').toString(),
    );
  }

  Future<Pago> validarQR({required int pagoId, required int intentoId}) async {
    final r = await _dio.post(
      '/finanzas/pagos/$pagoId/validar_qr/',
      data: {'intento_id': intentoId},
    );
    final m = (r.data as Map<String, dynamic>)['pago'] as Map<String, dynamic>;
    return Pago.fromJson(m);
  }

  // -------- Historial --------
  Future<List<Pago>> listarPagos({int? unidadId}) async {
    final uid = unidadId ?? await _getDefaultUnidadId();
    final r = await _dio.get('/finanzas/pagos/',
        queryParameters: uid != null ? {'unidad': uid} : null);
    final list = _unwrapList(r.data);
    return list.map((e) => Pago.fromJson(e as Map<String, dynamic>)).toList();
  }

  // -------- Descargar documento PDF + abrir --------
  Future<String?> descargarDocumentoPdf(int documentoId) async {
    final url = '/finanzas/documentos/$documentoId/descargar/';
    final r = await _dio.get<List<int>>(
      url,
      options:
          Options(responseType: ResponseType.bytes, followRedirects: false),
    );

    if (r.statusCode != 200 || r.data == null) return null;

    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/recibo_$documentoId.pdf');
    await file.writeAsBytes(r.data!, flush: true);

    await OpenFilex.open(file.path);
    return file.path;
  }
}
