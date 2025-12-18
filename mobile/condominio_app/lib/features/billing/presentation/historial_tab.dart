import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/billing_repository.dart';
import '../data/models.dart';

class HistorialTab extends StatefulWidget {
  const HistorialTab({super.key});
  @override
  State<HistorialTab> createState() => _HistorialTabState();
}

class _HistorialTabState extends State<HistorialTab> {
  late Future<List<Pago>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<BillingRepository>().listarPagos();
  }

  String _fmtFecha(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    final dd = d.toLocal();
    String two(int x) => x.toString().padLeft(2, '0');
    return '${two(dd.day)}/${two(dd.month)}/${dd.year} ${two(dd.hour)}:${two(dd.minute)}';
  }

  String _fmtMoney(double n) => n.toStringAsFixed(2);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Pago>>(
      future: _future,
      builder: (_, snap) {
        if (!snap.hasData) {
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          return const Center(child: CircularProgressIndicator());
        }

        final list = snap.data!;
        if (list.isEmpty) {
          return const Center(child: Text('Sin pagos todavía'));
        }

        return RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _future = context.read<BillingRepository>().listarPagos();
            });
          },
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final p = list[i];
              final aprobado = p.estado == 'APROBADO';
              final docId = p.documentoId;

              return Card(
                child: ListTile(
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Pago #${p.id}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: (aprobado ? Colors.green : Colors.orange)
                              .withOpacity(0.15),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                              color: aprobado ? Colors.green : Colors.orange),
                        ),
                        child: Text(
                          p.estado,
                          style: TextStyle(
                            fontSize: 12,
                            color: aprobado ? Colors.green : Colors.orange,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.10),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.blue),
                        ),
                        child: Text(
                          p.medio,
                          style: const TextStyle(
                              fontSize: 12,
                              color: Colors.blue,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      '${_fmtFecha(p.fecha)} — Unidad: ${p.unidad ?? '-'}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _fmtMoney(p.monto),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: aprobado ? Colors.green : Colors.orange,
                        ),
                      ),
                      if (docId != null) ...[
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () async {
                            final repo = context.read<BillingRepository>();
                            final path =
                                await repo.descargarDocumentoPdf(docId);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  path == null
                                      ? 'No se pudo descargar el recibo'
                                      : 'Recibo guardado: $path',
                                ),
                              ),
                            );
                          },
                          child: const Text(
                            'Recibo',
                            style: TextStyle(
                              decoration: TextDecoration.underline,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
