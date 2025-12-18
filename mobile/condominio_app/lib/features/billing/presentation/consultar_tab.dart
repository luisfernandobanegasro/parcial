import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/billing_repository.dart';
import '../data/models.dart';

class ConsultarTab extends StatefulWidget {
  const ConsultarTab({super.key});
  @override
  State<ConsultarTab> createState() => _ConsultarTabState();
}

class _ConsultarTabState extends State<ConsultarTab> {
  late Future<List<EstadoItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<BillingRepository>().estadoDeMiUnidad();
  }

  String _yyyyMm(String s) => (s.length >= 7) ? s.substring(0, 7) : s;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<EstadoItem>>(
      future: _future,
      builder: (_, snap) {
        if (!snap.hasData) {
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Error: ${snap.error}'),
              ),
            );
          }
          return const Center(child: CircularProgressIndicator());
        }
        final items = snap.data!;
        if (items.isEmpty) {
          return const Center(child: Text('No hay cargos en tu unidad.'));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(12),
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemCount: items.length,
          itemBuilder: (_, i) {
            final e = items[i];
            final saldo = e.saldo;
            final color = saldo > 0 ? Colors.red : Colors.green;
            return Card(
              child: ListTile(
                title: Text(
                  'Periodo ${_yyyyMm(e.periodo)} • Cargo #${e.cargoId}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  'Monto: ${e.monto} • Pagado: ${e.pagado} • Estado: ${e.estado}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  saldo.toStringAsFixed(2),
                  style: TextStyle(color: color, fontWeight: FontWeight.bold),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
