import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class MaintenanceReport extends StatelessWidget {
  const MaintenanceReport({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reporte de mantenimiento')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          TextField(
              decoration: InputDecoration(labelText: 'Título del problema')),
          Gap(12),
          TextField(
              maxLines: 4,
              decoration: InputDecoration(labelText: 'Descripción')),
          Gap(12),
          _PhotoPicker(),
          Gap(20),
          _SubmitBtn(),
        ],
      ),
    );
  }
}

class _PhotoPicker extends StatelessWidget {
  const _PhotoPicker();
  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () {},
      icon: const Icon(Icons.photo_camera_outlined),
      label: const Text('Adjuntar foto'),
    );
  }
}

class _SubmitBtn extends StatelessWidget {
  const _SubmitBtn();
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
        onPressed: () {}, child: const Text('Enviar reporte'));
  }
}
