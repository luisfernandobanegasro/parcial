// import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
// import 'package:provider/provider.dart';

import '../core/app_state.dart';
import '../core/shell.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/splash_screen.dart';

enum AppRoutes { splash, login, shell }

GoRouter buildRouter(AppState appState) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable:
        appState, // se vuelve a evaluar redirect cuando cambia el estado
    routes: [
      GoRoute(
        name: AppRoutes.splash.name,
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        name: AppRoutes.login.name,
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        name: AppRoutes.shell.name,
        path: '/app',
        builder: (_, __) => const AppShell(),
      ),
    ],
    redirect: (ctx, state) {
      final status = appState.status;
      final loggingIn = state.matchedLocation == '/login';
      final atSplash = state.matchedLocation == '/splash';

      if (status == AuthStatus.unknown) {
        // Siempre espera en splash hasta que init() fije el estado
        return atSplash ? null : '/splash';
      }

      if (status == AuthStatus.unauthenticated) {
        return loggingIn ? null : '/login';
      }

      // authenticated:
      if (loggingIn || atSplash) return '/app';

      return null;
    },
  );
}
