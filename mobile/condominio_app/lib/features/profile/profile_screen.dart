import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/app_state.dart';
import '../../env.dart';
import 'security_settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Future<Map<String, dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    final appState = context.read<AppState>();
    // Si ya hay "me" en memoria, no golpeamos de nuevo al backend.
    if (appState.me != null) {
      _future = Future.value(Map<String, dynamic>.from(appState.me!));
    } else {
      _future = _fetchMe();
    }
  }

  Future<Map<String, dynamic>> _fetchMe() async {
    final appState = context.read<AppState>();
    final api = ApiClient(tokenProvider: appState);

    // Tu Env NO se toca: construimos la URL absoluta al endpoint real
    // /api/usuarios/me/
    final url = '${Env.baseUrl}/usuarios${Env.mePath}';
    final r = await api.dio.get(url);

    final data = Map<String, dynamic>.from(r.data as Map);
    // Guardar en AppState para reutilizar en la sesión
    appState.setMe(data);
    return data;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return Scaffold(
            appBar: AppBar(title: const Text('Perfil')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (snap.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Perfil')),
            body: Center(child: Text('Error: ${snap.error}')),
          );
        }

        final me = snap.data ?? const {};
        final nombre = (me['nombre_completo'] as String?) ??
            (me['usuario'] as String?) ??
            (me['auth']?['username'] as String?) ??
            'Usuario';
        final correo = (me['correo'] as String?) ??
            (me['auth']?['email'] as String?) ??
            '—';
        final roles = _roles(me);

        return Scaffold(
          appBar: AppBar(title: const Text('Perfil')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              // Header con “foto” de adorno
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        child: Text(
                          _initials(nombre),
                          style: const TextStyle(fontSize: 20),
                        ),
                      ),
                      const Gap(16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              nombre,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const Gap(4),
                            Text(
                              correo,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const Gap(12),

              // Ajustes
              _sectionTitle(context, 'Ajustes'),
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.security_outlined),
                      title: const Text('Seguridad'),
                      subtitle:
                          const Text('Cambiar contraseña, 2FA, biometría'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SecuritySettingsScreen(),
                          ),
                        );
                      },
                    ),
                    const Divider(height: 0),
                    ListTile(
                      leading: const Icon(Icons.settings_outlined),
                      title: const Text('Preferencias'),
                      subtitle:
                          const Text('Tema, notificaciones (próximamente)'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Preferencias (próximamente)'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Gap(12),

              // Cuenta
              _sectionTitle(context, 'Cuenta'),
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.badge_outlined),
                      title: const Text('Roles'),
                      subtitle: Text(roles.isEmpty ? '—' : roles.join(', ')),
                    ),
                    const Divider(height: 0),
                    ListTile(
                      leading: const Icon(Icons.logout),
                      title: const Text('Cerrar sesión'),
                      onTap: () async {
                        await context.read<AppState>().doLogout();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Helpers UI
  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '👤';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  static List<String> _roles(Map<String, dynamic> me) {
    final gs = (me['auth']?['groups'] as List?) ?? const [];
    // groups del backend vienen como lista de nombres; si fueran objetos {id,name}, ajusta aquí.
    return gs.map((e) => e.toString()).toList();
  }

  Widget _sectionTitle(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
      child: Text(text, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}
