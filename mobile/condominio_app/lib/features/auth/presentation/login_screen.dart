import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../../../core/api_client.dart';
import '../../../core/storage/secure_storage.dart';
// import '../../home/home_menu.dart'; // opcional: remover si no se usa
import '../../../core/shell.dart';
import '../data/auth_repository.dart';
import 'forgot_password_screen.dart';


class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _doLogin() async {
    FocusScope.of(context).unfocus();
    final u = _userCtrl.text.trim();
    final p = _passCtrl.text;

    if (u.isEmpty || p.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa usuario y contraseña')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final repo = AuthRepository(api: ApiClient(), storage: AppSecureStorage());
      await repo.login(username: u, password: p);

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const AppShell()),
        (route) => false,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(Icons.apartment_rounded, size: 64, color: cs.secondary),
                  const Gap(10),
                  Text(
                    'SmartCondominium',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const Gap(18),
                  TextField(
                    controller: _userCtrl,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Usuario',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const Gap(12),
                  TextField(
                    controller: _passCtrl,
                    obscureText: true,
                    onSubmitted: (_) => _doLogin(),
                    decoration: const InputDecoration(
                      labelText: 'Contraseña',
                      prefixIcon: Icon(Icons.lock_outline),
                    ),
                  ),
                  const Gap(18),
                  ElevatedButton(
                    onPressed: _loading ? null : _doLogin,
                    child: _loading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Iniciar sesión'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                      );
                    },
                    child: const Text('¿Olvidaste tu contraseña?'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
