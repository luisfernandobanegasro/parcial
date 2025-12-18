import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/notices_repository.dart';
import '../data/models/notice.dart';
import 'notice_detail_screen.dart';

class NoticesList extends StatefulWidget {
  const NoticesList({super.key});
  @override
  State<NoticesList> createState() => _NoticesListState();
}

class _NoticesListState extends State<NoticesList> {
  late Future<List<Notice>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<NoticesRepository>().fetchNotices();
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Avisos y comunicados")),
      body: FutureBuilder<List<Notice>>(
        future: _future,
        builder: (_, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
                child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Error: ${snap.error}'),
            ));
          }
          final items = snap.data ?? const <Notice>[];
          if (items.isEmpty) {
            return const Center(child: Text('No hay avisos disponibles'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final n = items[i];
              final color = switch (n.prioridad) {
                'URGENTE' => Colors.red,
                'ALERTA' => Colors.orange,
                _ => Colors.blueGrey,
              };
              return Card(
                child: ListTile(
                  leading: Icon(Icons.campaign, color: color),
                  title: Text(n.titulo,
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    '${n.autorNombre ?? 'Sistema'} • ${_fmt(n.publicadoAt)}',
                  ),
                  trailing: n.leido ? const Icon(Icons.mark_email_read) : null,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => NoticeDetailScreen(id: n.id)),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
