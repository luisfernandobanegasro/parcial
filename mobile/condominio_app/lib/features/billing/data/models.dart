// lib/features/billing/data/models.dart

double _asDouble(dynamic v) {
  if (v == null) return 0.0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v.replaceAll(',', '.')) ?? 0.0;
  return 0.0;
}

int _asInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

String _asString(dynamic v) {
  if (v == null) return '';
  return v.toString();
}

class EstadoItem {
  final int cargoId;
  final int unidadId;
  final int conceptoId;
  final String periodo; // yyyy-mm-dd o yyyy-mm-01
  final double monto;
  final double recargo;
  final double pagado;
  final double saldo;
  final String estado;

  EstadoItem({
    required this.cargoId,
    required this.unidadId,
    required this.conceptoId,
    required this.periodo,
    required this.monto,
    required this.recargo,
    required this.pagado,
    required this.saldo,
    required this.estado,
  });

  factory EstadoItem.fromJson(Map<String, dynamic> j) => EstadoItem(
        cargoId: _asInt(j['cargo_id']),
        unidadId: _asInt(j['unidad_id']),
        conceptoId: _asInt(j['concepto_id']),
        periodo: _asString(j['periodo']),
        monto: _asDouble(j['monto']),
        recargo: _asDouble(j['recargo']),
        pagado: _asDouble(j['pagado']),
        saldo: _asDouble(j['saldo']),
        estado: _asString(j['estado_calculado'].toString().isNotEmpty
            ? j['estado_calculado']
            : j['estado_registrado']),
      );
}

class Pago {
  final int id;
  final String fecha; // ISO
  final double monto;
  final String medio; // EFECTIVO/QR/...
  final String estado; // APROBADO/...
  final int? documentoId; // puede venir null o string
  final dynamic unidad; // string o id (según serializer)

  Pago({
    required this.id,
    required this.fecha,
    required this.monto,
    required this.medio,
    required this.estado,
    this.documentoId,
    this.unidad,
  });

  factory Pago.fromJson(Map<String, dynamic> j) => Pago(
        id: _asInt(j['id']),
        fecha: _asString(j['fecha']),
        monto: _asDouble(j['monto']),
        medio: _asString(j['medio']),
        estado: _asString(j['estado']),
        documentoId: (j['documento'] == null) ? null : _asInt(j['documento']),
        unidad: j['unidad'], // puede ser string o int: lo mostramos tal cual
      );
}
