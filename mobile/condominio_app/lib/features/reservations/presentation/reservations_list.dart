import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/models/reservation.dart';
import '../data/reservations_repository.dart';

class ReservationsList extends StatefulWidget {
  const ReservationsList({super.key});

  @override
  State<ReservationsList> createState() => _ReservationsListState();
}

class _ReservationsListState extends State<ReservationsList> {
  late Future<List<Reservation>> _future;

  @override
  void initState() {
    super.initState();
    final repo = context.read<ReservationsRepository>();
    _future = repo.fetchReservations(vigentes: true);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Reservation>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text("Error: ${snap.error}"));
        }
        final reservas = snap.data ?? [];
        if (reservas.isEmpty) {
          return const Center(child: Text("No hay reservas"));
        }
        return ListView.builder(
          itemCount: reservas.length,
          itemBuilder: (_, i) {
            final r = reservas[i];
            return Card(
              child: ListTile(
                title: Text("${r.areaNombre} — ${r.motivo}"),
                subtitle: Text(
                  "${r.solicitanteUsername} • ${_fmt(r.inicio)} → ${_fmt(r.fin)}",
                ),
                trailing: Text(r.estado,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            );
          },
        );
      },
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
}
