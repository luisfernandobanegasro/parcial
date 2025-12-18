import 'package:flutter/material.dart';
import 'consultar_tab.dart';
import 'pagar_tab.dart';
import 'historial_tab.dart';

class BillingHub extends StatefulWidget {
  final int initialTab; // 0=consultar, 1=pagar, 2=historial
  const BillingHub({super.key, this.initialTab = 0});

  @override
  State<BillingHub> createState() => _BillingHubState();
}

class _BillingHubState extends State<BillingHub>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTab.clamp(0, 2),
    );
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
        title: const Text('Pagos y cuotas'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Consultar'),
            Tab(text: 'Pagar'),
            Tab(text: 'Historial'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          ConsultarTab(),
          PagarTab(), // ← ya es un widget válido y const
          HistorialTab(),
        ],
      ),
    );
  }
}
