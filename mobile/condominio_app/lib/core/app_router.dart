import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_screen.dart';

enum AppRoutes { login, adminHome }

class AdminHome extends StatelessWidget {
  const AdminHome({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Panel Administrador')),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Bienvenido 👋'),
          const SizedBox(height: 16),
          FilledButton.icon(
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar sesión'),
            onPressed: () => GoRouter.of(context).goNamed(AppRoutes.login.name),
          ),
        ]),
      ),
    );
  }
}

final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      name: AppRoutes.login.name,
      path: '/login',
      builder: (_, __) => const LoginScreen(),
    ),
    GoRoute(
      name: AppRoutes.adminHome.name,
      path: '/admin',
      builder: (_, __) => const AdminHome(),
    ),
  ],
);
