import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/login_screen.dart';
import '../features/notices/presentation/notices_list.dart';
import '../features/notices/presentation/notice_detail_screen.dart';

enum AppRoutes { login, adminHome, notices, noticeDetail }

/// Home genérico que recibe una función de cierre de sesión
class AdminHome extends StatelessWidget {
  final Future<void> Function()? onLogout;
  const AdminHome({super.key, this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Panel Administrador')),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Bienvenido 👋'),
          const SizedBox(height: 16),
          FilledButton.icon(
            icon: const Icon(Icons.campaign_outlined),
            label: const Text('Ver avisos'),
            onPressed: () => context.goNamed(AppRoutes.notices.name),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar sesión'),
            onPressed: () async {
              try {
                if (onLogout != null) await onLogout!();
              } catch (_) {}
              if (context.mounted) context.goNamed(AppRoutes.login.name);
            },
          ),
        ]),
      ),
    );
  }
}

/// Construye el GoRouter e inyecta un callback de logout (opcional)
GoRouter buildAppRouter({Future<void> Function()? onLogout}) {
  return GoRouter(
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
        builder: (_, __) => AdminHome(onLogout: onLogout),
      ),
      GoRoute(
        name: AppRoutes.notices.name,
        path: '/notices',
        builder: (_, __) => const NoticesList(),
        routes: [
          GoRoute(
            name: AppRoutes.noticeDetail.name,
            path: 'detail/:id',
            builder: (ctx, state) =>
                NoticeDetailScreen(id: int.parse(state.pathParameters['id']!)),
          ),
        ],
      ),
    ],
  );
}
