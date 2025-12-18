import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/notices_repository.dart';
import '../data/models/notice.dart';

class NoticeDetailScreen extends StatefulWidget {
  final int id;
  const NoticeDetailScreen({super.key, required this.id});

  @override
  State<NoticeDetailScreen> createState() => _NoticeDetailScreenState();
}

class _NoticeDetailScreenState extends State<NoticeDetailScreen> {
  late Future<Notice> _future;

  @override
  void initState() {
    super.initState();
    final repo = context.read<NoticesRepository>();
    _future = repo.detail(widget.id).then((n) async {
      // marca leído (si quieres)
      try {
        await repo.markRead(widget.id);
      } catch (_) {}
      return n;
    });
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de aviso')),
      body: FutureBuilder<Notice>(
        future: _future,
        builder: (_, snap) {
          if (!snap.hasData) {
            if (snap.hasError) {
              return Center(child: Text('Error: ${snap.error}'));
            }
            return const Center(child: CircularProgressIndicator());
          }
          final n = snap.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(n.titulo, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(
                '${n.prioridad} • ${_fmt(n.publicadoAt)} • ${n.autorNombre ?? 'Sistema'}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const Divider(height: 24),
              Text(n.cuerpo),
              if (n.archivos.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text('Adjuntos',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                for (final f in n.archivos)
                  ListTile(
                    leading: const Icon(Icons.attach_file),
                    title: Text(
                        f.nombre.isEmpty ? f.url.split('/').last : f.nombre),
                    subtitle: Text(_fmt(f.subidoAt)),
                    onTap: () {
                      // Para web puedes abrir en nueva pestaña:
                      // import 'dart:html' as html; html.window.open(f.url, '_blank');
                    },
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}
