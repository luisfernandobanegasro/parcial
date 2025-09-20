import 'package:flutter/material.dart';

class SecurityAlerts extends StatelessWidget {
  const SecurityAlerts({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alertas de seguridad')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemBuilder: (_, i) => Card(
          child: ListTile(
            leading: const Icon(Icons.warning_amber_rounded),
            title: Text('Alerta #${i + 1}'),
            subtitle: const Text('Detalle de la anomalía detectada.'),
            trailing: const Icon(Icons.chevron_right),
          ),
        ),
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemCount: 8,
      ),
    );
  }
}
