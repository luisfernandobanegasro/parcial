import 'package:flutter/material.dart';
import '../data/notices_repository.dart';
import '../data/models/notice.dart';
export '../presentation/notice_detail_screen.dart';

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
    _future = noticesRepository.detail(widget.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de aviso')),
      body: FutureBuilder<Notice>(
        future: _future,
        builder: (_, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final n = snap.data!;
          return Padding(
            padding: const EdgeInsets.all(16),
            child: ListView(
              children: [
                Text(n.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text('${n.category} • ${_fmt(n.publishedAt)}',
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 16),
                Text(n.body ?? n.excerpt ?? 'Sin contenido'),
              ],
            ),
          );
        },
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
