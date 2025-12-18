import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class VisitorForm extends StatelessWidget {
  const VisitorForm({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar visitante')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          TextField(
              decoration: InputDecoration(labelText: 'Nombre del visitante')),
          Gap(12),
          TextField(decoration: InputDecoration(labelText: 'Documento / ID')),
          Gap(12),
          TextField(
              decoration: InputDecoration(labelText: 'Apartamento destino')),
          Gap(12),
          TextField(decoration: InputDecoration(labelText: 'Fecha y hora')),
          Gap(20),
          _SubmitBtn(),
        ],
      ),
    );
  }
}

class _SubmitBtn extends StatelessWidget {
  const _SubmitBtn();
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(onPressed: () {}, child: const Text('Registrar'));
  }
}
