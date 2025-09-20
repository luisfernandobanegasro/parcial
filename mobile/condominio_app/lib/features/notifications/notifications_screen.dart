import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notificaciones push')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Preferencias'),
          const Gap(8),
          SwitchListTile(title: const Text('Recibir notificaciones'), value: true, onChanged: (_) {}),
          SwitchListTile(title: const Text('Avisos de pagos'), value: true, onChanged: (_) {}),
          SwitchListTile(title: const Text('Alertas de seguridad'), value: true, onChanged: (_) {}),
          const Gap(20),
          ElevatedButton(onPressed: () {}, child: const Text('Probar notificación')),
        ],
      ),
    );
  }
}
