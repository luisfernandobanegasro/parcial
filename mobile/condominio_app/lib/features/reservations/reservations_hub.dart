import 'package:flutter/material.dart';

class ReservationsHub extends StatefulWidget {
  final int initialTab; // 0=reservar, 1=confirmar/pagar
  const ReservationsHub({super.key, this.initialTab = 0});

  @override
  State<ReservationsHub> createState() => _ReservationsHubState();
}

class _ReservationsHubState extends State<ReservationsHub> with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reservas de áreas'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Reservar'),
            Tab(text: 'Confirmar y pagar'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          _Placeholder(text: 'Calendario + selector de área + hora'),
          _Placeholder(text: 'Resumen de reserva + confirmar y pagar'),
        ],
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  final String text;
  const _Placeholder({required this.text, super.key});
  @override
  Widget build(BuildContext context) => Center(child: Text(text));
}
