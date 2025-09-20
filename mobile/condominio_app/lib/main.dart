import 'package:flutter/material.dart';
import 'core/app_theme_friendly.dart';
import 'features/auth/presentation/login_screen.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: FriendlyTheme.light(),
      home: const LoginScreen(),
    );
  }
}
