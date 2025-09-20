import 'package:flutter/material.dart';

class BillingHub extends StatefulWidget {
  final int initialTab; // 0=consultar, 1=pagar, 2=historial
  const BillingHub({super.key, this.initialTab = 0});

  @override
  State<BillingHub> createState() => _BillingHubState();
}

class _BillingHubState extends State<BillingHub> with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this, initialIndex: widget.initialTab);
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
          _Placeholder(text: 'Listado de cuotas y servicios'),
          _Placeholder(text: 'Flujo de pago en línea'),
          _Placeholder(text: 'Historial y comprobantes'),
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
