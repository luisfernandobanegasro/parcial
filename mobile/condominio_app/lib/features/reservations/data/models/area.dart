class Area {
  final int id;
  final String nombre;
  final int? capacidad;
  final bool requierePago;
  final String? costoBase;
  final Map<String, dynamic>? politica;
  final int? condominioId;

  Area({
    required this.id,
    required this.nombre,
    this.capacidad,
    required this.requierePago,
    this.costoBase,
    this.politica,
    this.condominioId,
  });

  factory Area.fromJson(Map<String, dynamic> j) => Area(
        id: j['id'],
        nombre: j['nombre'],
        capacidad: j['capacidad'],
        requierePago: j['requiere_pago'] ?? false,
        costoBase: j['costo_base']?.toString(),
        politica: j['politica'] is Map<String, dynamic> ? j['politica'] : null,
        condominioId: j['condominio_id'],
      );

  @override
  String toString() => nombre;
}
