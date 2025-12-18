class Reservation {
  final int id;
  final int area;
  final String areaNombre;
  final String solicitante;
  final String solicitanteUsername;
  final DateTime inicio;
  final DateTime fin;
  final int asistentes;
  final String motivo;
  final String estado;

  Reservation({
    required this.id,
    required this.area,
    required this.areaNombre,
    required this.solicitante,
    required this.solicitanteUsername,
    required this.inicio,
    required this.fin,
    required this.asistentes,
    required this.motivo,
    required this.estado,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) => Reservation(
        id: json['id'],
        area: json['area'],
        areaNombre: json['area_nombre'],
        solicitante: json['solicitante'],
        solicitanteUsername: json['solicitante_username'],
        inicio: DateTime.parse(json['inicio']),
        fin: DateTime.parse(json['fin']),
        asistentes: json['asistentes'] ?? 0,
        motivo: json['motivo'] ?? '',
        estado: json['estado'],
      );
}
