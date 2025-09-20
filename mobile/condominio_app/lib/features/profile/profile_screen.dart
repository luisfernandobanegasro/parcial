import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../auth/presentation/login_screen.dart';
import '../auth/data/auth_repository.dart';
import '../../core/api_client.dart';
import '../../core/storage/secure_storage.dart';
import 'security_settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _logout(BuildContext context) async {
    await AppSecureStorage().clear();
    // Navega al login limpiando stack
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<UserProfile> _loadProfile() async {
    final repo = AuthRepository(api: ApiClient(), storage: AppSecureStorage());
    return repo.getCurrentUser();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: FutureBuilder<UserProfile>(
        future: _loadProfile(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Icon(Icons.error_outline, size: 48),
                const Gap(12),
                Text('No se pudo cargar el perfil.\n${snap.error}', textAlign: TextAlign.center),
                const Gap(20),
                ElevatedButton.icon(
                  onPressed: () => _logout(context),
                  icon: const Icon(Icons.logout),
                  label: const Text('Volver a iniciar sesión'),
                ),
              ],
            );
          }

          final user = snap.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(children: [
                const CircleAvatar(radius: 28, child: Icon(Icons.person)),
                const Gap(12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user.username.isNotEmpty ? user.username : 'Usuario',
                      style: Theme.of(context).textTheme.titleMedium),
                  Text(user.email.isNotEmpty ? user.email : 'sin correo'),
                ]),
              ]),
              const Gap(20),
              ListTile(
                leading: const Icon(Icons.security),
                title: const Text('Seguridad'),
                subtitle: const Text('Contraseña, 2FA, sesiones y más'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SecuritySettingsScreen()));
                },
              ),
              ListTile(leading: const Icon(Icons.settings_outlined), title: const Text('Ajustes'), onTap: () {}),
              ListTile(leading: const Icon(Icons.privacy_tip_outlined), title: const Text('Privacidad'), onTap: () {}),
              const Gap(20),
              ElevatedButton.icon(
                onPressed: () => _logout(context),
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar sesión'),
              ),
            ],
          );
        },
      ),
    );
  }
}
