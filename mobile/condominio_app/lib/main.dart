import 'package:flutter/material.dart';
import 'core/app_theme_friendly.dart';
import 'core/app_router.dart';

// Si ya tienes un AuthRepository, puedes llamarlo aquí.
// import 'features/auth/data/auth_repository.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});

  // final _auth = AuthRepository();
  Future<void> _logout() async {
    // Si tienes repo de auth, descomenta:
    // await _auth.logout();
    await Future<void>.value();
  }

  @override
  Widget build(BuildContext context) {
    final router = buildAppRouter(onLogout: _logout);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      theme: FriendlyTheme.light(),
      routerConfig: router,
    );
  }
}
