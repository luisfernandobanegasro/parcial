import 'package:flutter/material.dart';

class NoticesList extends StatelessWidget {
  const NoticesList({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Avisos y comunicados')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemBuilder: (_, i) => Card(
          child: ListTile(
            leading: const Icon(Icons.campaign_outlined),
            title: Text('Aviso #${i + 1}'),
            subtitle: const Text('Descripción breve del aviso.'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ),
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemCount: 10,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.filter_list),
        label: const Text('Filtrar'),
      ),
    );
  }
}
