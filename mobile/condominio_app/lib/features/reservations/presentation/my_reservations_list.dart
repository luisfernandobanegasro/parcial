import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../reservations/data/models/reservation.dart';
import '../../reservations/data/reservations_repository.dart';

class MyReservationsList extends StatefulWidget {
  const MyReservationsList({super.key});
  @override
  State<MyReservationsList> createState() => _MyReservationsListState();
}

class _MyReservationsListState extends State<MyReservationsList> {
  late Future<List<Reservation>> _future;
  bool _isStaff = false;
  String? _username;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Reservation>> _load() async {
    final repo = context.read<ReservationsRepository>();

    // 1) /me/ para saber username + is_staff
    try {
      final resp = await repo.dio.get('/me/');
      final auth = resp.data?['auth'] ?? {};
      _isStaff = (auth['is_staff'] == true);
      _username = (auth['username'] ?? '').toString();
    } catch (_) {
      _isStaff = false;
      _username = null;
    }

    // 2) Traemos vigentes (sin mias=yes para evitar el 500) y filtramos por username
    final all = await repo.fetchReservations(vigentes: true);
    if (_username == null || _username!.isEmpty) return all;
    return all.where((r) => r.solicitanteUsername == _username).toList();
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
  }

  Future<void> _accion(Future<void> Function() call, String success) async {
    try {
      await call();
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(success)));
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Reservation>>(
      future: _future,
      builder: (_, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
        final list = snap.data ?? [];
        if (list.isEmpty)
          return const Center(child: Text('No tienes reservas activas'));

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final r = list[i];
              final tile = ListTile(
                title: Text('${r.areaNombre} • ${r.estado}'),
                subtitle:
                    Text('${_fmt(r.inicio)} → ${_fmt(r.fin)}\n${r.motivo}'),
                isThreeLine: true,
                trailing: PopupMenuButton<String>(
                  onSelected: (v) {
                    final repo = context.read<ReservationsRepository>();
                    if (v == 'cancel') {
                      _accion(() => repo.cancelar(r.id), 'Reserva cancelada');
                    } else if (v == 'confirm' && _isStaff) {
                      _accion(() => repo.confirmar(r.id), 'Reserva confirmada');
                    } else if (v == 'reject' && _isStaff) {
                      _accion(() => repo.rechazar(r.id), 'Reserva rechazada');
                    }
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                        value: 'cancel', child: Text('Cancelar')),
                    if (_isStaff)
                      const PopupMenuItem(
                          value: 'confirm', child: Text('Confirmar (admin)')),
                    if (_isStaff)
                      const PopupMenuItem(
                          value: 'reject', child: Text('Rechazar (admin)')),
                  ],
                ),
              );

              return Dismissible(
                key: ValueKey(r.id),
                background: Container(
                  padding: const EdgeInsets.only(left: 16),
                  alignment: Alignment.centerLeft,
                  color: Colors.red.shade200,
                  child: const Icon(Icons.cancel),
                ),
                direction: DismissDirection.startToEnd,
                confirmDismiss: (_) async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Cancelar reserva'),
                      content: Text('¿Cancelar la reserva #${r.id}?'),
                      actions: [
                        TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('No')),
                        FilledButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Sí, cancelar')),
                      ],
                    ),
                  );
                  return ok ?? false;
                },
                onDismissed: (_) {
                  final repo = context.read<ReservationsRepository>();
                  _accion(() => repo.cancelar(r.id), 'Reserva cancelada');
                },
                child: Card(child: tile),
              );
            },
          ),
        );
      },
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} '
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
