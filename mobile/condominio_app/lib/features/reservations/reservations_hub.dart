import 'package:flutter/material.dart';
import 'presentation/create_reservation_screen.dart';
import 'presentation/my_reservations_list.dart';

class ReservationsHub extends StatefulWidget {
  final int initialTab; // 0=reservar, 1=mis reservas
  const ReservationsHub({super.key, this.initialTab = 0});

  @override
  State<ReservationsHub> createState() => _ReservationsHubState();
}

class _ReservationsHubState extends State<ReservationsHub>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab =
        TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
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
            Tab(text: 'Mis reservas'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          CreateReservationScreen(),
          MyReservationsList(),
        ],
      ),
    );
  }
}
