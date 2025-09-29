import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/notices_repository.dart';
import '../data/models/notice.dart';
export '../presentation/notices_list.dart';

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
    _future = noticesRepository.listActive();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Avisos y comunicados')),
      body: FutureBuilder<List<Notice>>(
        future: _future,
        builder: (_, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final items = snap.data ?? [];
          if (items.isEmpty)
            return const Center(child: Text('No hay avisos vigentes'));

          return RefreshIndicator(
            onRefresh: () async {
              setState(() => _future = noticesRepository.listActive());
              await _future;
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemBuilder: (_, i) {
                final n = items[i];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.campaign_outlined),
                    title: Text(n.title),
                    subtitle: Text('${n.category} • ${_fmt(n.publishedAt)}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/notices/detail/${n.id}'),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemCount: items.length,
            ),
          );
        },
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
