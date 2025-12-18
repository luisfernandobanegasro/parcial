class NoticeFile {
  final int id;
  final String nombre;
  final String url;
  final DateTime subidoAt;

  NoticeFile({
    required this.id,
    required this.nombre,
    required this.url,
    required this.subidoAt,
  });

  factory NoticeFile.fromJson(Map<String, dynamic> j) => NoticeFile(
        id: j['id'] as int,
        nombre: (j['nombre'] ?? '').toString(),
        url: (j['archivo'] ?? '').toString(),
        subidoAt: DateTime.parse(j['subido_at'] as String),
      );
}

class Notice {
  final int id;
  final String titulo;
  final String cuerpo;
  final String prioridad; // INFO | ALERTA | URGENTE
  final String alcance; // TODOS | CONDOMINIO | UNIDAD
  final int? condominioId;
  final int? unidadId;
  final DateTime? venceAt;
  final DateTime publicadoAt;
  final bool isActivo;
  final bool vigente;
  final String? autorNombre;
  final bool leido;
  final List<NoticeFile> archivos;

  Notice({
    required this.id,
    required this.titulo,
    required this.cuerpo,
    required this.prioridad,
    required this.alcance,
    required this.condominioId,
    required this.unidadId,
    required this.venceAt,
    required this.publicadoAt,
    required this.isActivo,
    required this.vigente,
    required this.autorNombre,
    required this.leido,
    required this.archivos,
  });

  factory Notice.fromJson(Map<String, dynamic> j) => Notice(
        id: j['id'] as int,
        titulo: (j['titulo'] ?? '').toString(),
        cuerpo: (j['cuerpo'] ?? '').toString(),
        prioridad: (j['prioridad'] ?? 'INFO').toString(),
        alcance: (j['alcance'] ?? 'TODOS').toString(),
        condominioId: j['condominio_id'] as int?,
        unidadId: j['unidad_id'] as int?,
        venceAt: j['vence_at'] == null ? null : DateTime.parse(j['vence_at']),
        publicadoAt: DateTime.parse(j['publicado_at']),
        isActivo: j['is_activo'] as bool? ?? true,
        vigente: j['vigente'] as bool? ?? true,
        autorNombre: j['autor_nombre']?.toString(),
        leido: j['leido'] as bool? ?? false,
        archivos: (j['archivos'] as List? ?? [])
            .map((e) => NoticeFile.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
