import 'package:flutter/material.dart';

import '../features/home/home_menu.dart';
import '../features/billing/billing_hub.dart';
import '../features/reservations/reservations_hub.dart';
import '../features/notices/notices_list.dart';
import '../features/profile/profile_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  final _pages = const [
    HomeMenu(),
    BillingHub(),
    ReservationsHub(),
    NoticesList(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;

    final nav = NavigationBar(
      selectedIndex: _index,
      onDestinationSelected: (i) => setState(() => _index = i),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.apps_outlined), selectedIcon: Icon(Icons.apps), label: 'Inicio'),
        NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: 'Pagos'),
        NavigationDestination(icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: 'Reservas'),
        NavigationDestination(icon: Icon(Icons.campaign_outlined), selectedIcon: Icon(Icons.campaign), label: 'Avisos'),
        NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
      ],
    );

    if (wide) {
      // Layout de escritorio: Rail a la izquierda + contenido
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _index,
              onDestinationSelected: (i) => setState(() => _index = i),
              labelType: NavigationRailLabelType.all,
              destinations: const [
                NavigationRailDestination(icon: Icon(Icons.apps_outlined), label: Text('Inicio')),
                NavigationRailDestination(icon: Icon(Icons.payments_outlined), label: Text('Pagos')),
                NavigationRailDestination(icon: Icon(Icons.event_available_outlined), label: Text('Reservas')),
                NavigationRailDestination(icon: Icon(Icons.campaign_outlined), label: Text('Avisos')),
                NavigationRailDestination(icon: Icon(Icons.person_outline), label: Text('Perfil')),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: _pages[_index]),
          ],
        ),
      );
    }

    // Layout móvil: solo bottom nav; cada página trae su propio Scaffold
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: nav,
    );
  }
}
