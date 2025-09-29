class Notice {
  final int id;
  final String title;
  final DateTime publishedAt;
  final String category;
  final String? excerpt;
  final String? body;

  Notice({
    required this.id,
    required this.title,
    required this.publishedAt,
    required this.category,
    this.excerpt,
    this.body,
  });

  factory Notice.fromJson(Map<String, dynamic> j) => Notice(
        id: j['id'] as int,
        title: j['titulo'] as String,
        publishedAt: DateTime.parse(j['fecha_publicacion'] as String),
        category: j['categoria'] as String,
        excerpt: j['excerpt'] as String?,
        body: j['cuerpo'] as String?,
      );
}
