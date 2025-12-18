import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/billing_repository.dart';
import '../data/models.dart';
import '../../../env.dart';
import '../../../core/notification_service.dart';

class PagarTab extends StatefulWidget {
  const PagarTab({super.key});

  @override
  State<PagarTab> createState() => _PagarTabState();
}

class _PagarTabState extends State<PagarTab> {
  late Future<List<EstadoItem>> _future;
  final _sel = <int, double>{}; // cargoId -> monto a pagar
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _future = context.read<BillingRepository>().estadoDeMiUnidad();
  }

  double get _totalSel =>
      _sel.values.fold<double>(0.0, (acc, v) => acc + (v > 0 ? v : 0));

  String _fmtMoney(double n) => n.toStringAsFixed(2);
  String _yyyyMm(String s) => (s.length >= 7) ? s.substring(0, 7) : s;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<EstadoItem>>(
      future: _future,
      builder: (_, snap) {
        if (!snap.hasData) {
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          return const Center(child: CircularProgressIndicator());
        }
        final pendientes = (snap.data ?? []).where((e) => e.saldo > 0).toList();
        if (pendientes.isEmpty) {
          return const Center(child: Text('No tienes saldos pendientes 💚'));
        }

        return Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: pendientes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final e = pendientes[i];
                  final selected = _sel.containsKey(e.cargoId);
                  final initialText = _fmtMoney(_sel[e.cargoId] ?? e.saldo);

                  return Card(
                    child: ListTile(
                      leading: Checkbox(
                        value: selected,
                        onChanged: (v) {
                          setState(() {
                            if (v == true) {
                              _sel[e.cargoId] = e.saldo;
                            } else {
                              _sel.remove(e.cargoId);
                            }
                          });
                        },
                      ),
                      title: Text(
                        'Periodo ${_yyyyMm(e.periodo)} • Cargo #${e.cargoId}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        'Saldo: ${e.saldo.toStringAsFixed(2)}',
                        maxLines: 1,
                      ),
                      trailing: SizedBox(
                        width: 120,
                        child: TextFormField(
                          initialValue: initialText,
                          enabled: selected,
                          textAlign: TextAlign.right,
                          keyboardType: const TextInputType.numberWithOptions(
                              signed: false, decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Monto',
                            prefixText: 'Bs ',
                          ),
                          onChanged: (v) {
                            final n = double.tryParse(
                                  v.replaceAll(',', '.').trim(),
                                ) ??
                                0;
                            if (_sel.containsKey(e.cargoId)) {
                              setState(() => _sel[e.cargoId] = n);
                            }
                          },
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // FOOTER: total + botones
            Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    blurRadius: 6,
                    color: Colors.black.withOpacity(0.05),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Total: Bs ${_fmtMoney(_totalSel)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _saving || _sel.isEmpty || _totalSel <= 0
                          ? null
                          : _pagarQR,
                      icon: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.qr_code),
                      label: const Text('Pagar con QR'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _saving || _sel.isEmpty || _totalSel <= 0
                          ? null
                          : _pagarEfectivo,
                      icon: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.payments),
                      label: Text(_sel.isEmpty
                          ? 'Selecciona cargos'
                          : 'Pagar (efectivo)'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  // -------- EFECTIVO --------
  Future<void> _pagarEfectivo() async {
    setState(() => _saving = true);
    try {
      final repo = context.read<BillingRepository>();
      final estado = await repo.estadoDeMiUnidad();
      if (estado.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo determinar la unidad.')),
        );
        return;
      }
      final unidadId = estado.first.unidadId;
      final detalles = _sel.entries
          .map((e) => {'cargo': e.key, 'monto_aplicado': e.value})
          .toList();

      final pago = await repo.registrarPagoEfectivo(
        unidadId: unidadId,
        detalles: detalles,
      );

      // Descarga/abre recibo si existe
      if (pago.documentoId != null) {
        await repo.descargarDocumentoPdf(pago.documentoId!);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Pago #${pago.id} ${pago.estado}')),
      );
      setState(() {
        _sel.clear();
        _future = repo.estadoDeMiUnidad();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // -------- QR (demo) --------
  Future<void> _pagarQR() async {
    setState(() => _saving = true);
    try {
      final repo = context.read<BillingRepository>();

      final estado = await repo.estadoDeMiUnidad();
      if (estado.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo determinar la unidad.')),
        );
        return;
      }
      final unidadId = estado.first.unidadId;

      final detalles = _sel.entries
          .map((e) => {'cargo': e.key, 'monto_aplicado': e.value})
          .toList();
      final pago =
          await repo.registrarPagoQR(unidadId: unidadId, detalles: detalles);

      final attempt = await repo.iniciarQR(pago.id);
      if (!mounted) return;

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) {
          final qrPng =
              '${Env.baseUrl}/finanzas/pagointentos/${attempt.intentoId}/qr.png';
          return AlertDialog(
            title: const Text('Escanea con tu app bancaria'),
            content: SizedBox(
              width: 360,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: Image.network(
                      qrPng,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) =>
                          const Text('No se pudo cargar el QR'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SelectableText(
                    attempt.qrText.isEmpty ? '—' : attempt.qrText,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              FilledButton.icon(
                icon: const Icon(Icons.verified),
                label: const Text('Ya pagué (validar)'),
                onPressed: () async {
                  try {
                    final p = await repo.validarQR(
                      pagoId: pago.id,
                      intentoId: attempt.intentoId,
                    );
                    if (!mounted) return;
                    Navigator.pop(context);

                    // Notificación local
                    await NotificationService.show(
                      title: 'Pago procesado',
                      body: 'Tu pago #${p.id} fue ${p.estado}.',
                    );

                    // Descarga/abre recibo si existe
                    if (p.documentoId != null) {
                      await repo.descargarDocumentoPdf(p.documentoId!);
                    }

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Pago #${p.id} ${p.estado}')),
                    );
                    setState(() {
                      _sel.clear();
                      _future = repo.estadoDeMiUnidad();
                    });
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error validando: $e')),
                    );
                  }
                },
              ),
            ],
          );
        },
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
