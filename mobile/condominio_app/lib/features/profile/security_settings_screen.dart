import 'package:flutter/material.dart';
import 'change_password_screen.dart';

class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  bool _biometricsEnabled = true;
  bool _twoFAEnabled = false;

  void _toast(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Seguridad')),
      body: ListView(
        children: [
          const _SectionTitle('Acceso'),
          SwitchListTile(
            title: const Text('Usar biometría / PIN local'),
            subtitle: const Text('Desbloquear la app con huella/rostro o PIN'),
            value: _biometricsEnabled,
            onChanged: (v) {
              setState(() => _biometricsEnabled = v);
              _toast(
                context,
                v ? 'Biometría/PIN activado' : 'Biometría/PIN desactivado',
              );
              // TODO: Persistir preferencia localmente (ej. SharedPreferences/secure storage)
            },
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Cambiar contraseña'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
              );
            },
          ),
          const Divider(),

          const _SectionTitle('Autenticación en dos pasos (2FA)'),
          SwitchListTile(
            title: const Text('Activar 2FA (TOTP)'),
            subtitle: const Text('Protege tu cuenta con un segundo factor'),
            value: _twoFAEnabled,
            onChanged: (v) {
              setState(() => _twoFAEnabled = v);
              _toast(
                context,
                v ? '2FA habilitado (TOTP)' : '2FA deshabilitado',
              );
              // TODO: Abrir flujo para enrolar TOTP (QR secreto) cuando v sea true
            },
          ),
          ListTile(
            leading: const Icon(Icons.key_outlined),
            title: const Text('Códigos de recuperación'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              _toast(context, 'Códigos de recuperación (próximamente)');
              // TODO: Navegar a pantalla de generación/visualización de códigos
            },
          ),
          const Divider(),

          const _SectionTitle('Sesiones y actividad'),
          ListTile(
            leading: const Icon(Icons.devices_other),
            title: const Text('Sesiones activas'),
            subtitle: const Text('Revisa y cierra sesiones abiertas en otros dispositivos'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              _toast(context, 'Sesiones activas (próximamente)');
              // TODO: Navegar a lista de sesiones (GET /api/auth/sessions) y opción de cerrar
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Actividad de inicio de sesión'),
            subtitle: const Text('Historial de accesos y alertas'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              _toast(context, 'Actividad de inicio de sesión (próximamente)');
              // TODO: Navegar a historial (ej. últimos logins, IP, dispositivo)
            },
          ),
          const Divider(),

          const _SectionTitle('Accesos y permisos'),
          ListTile(
            leading: const Icon(Icons.app_shortcut_outlined),
            title: const Text('Revocar accesos de terceros'),
            subtitle: const Text('Tokens o integraciones conectadas'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              _toast(context, 'Revocar accesos (próximamente)');
              // TODO: Navegar a integraciones/tokens para revocar
            },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text, {super.key});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
      child: Text(text, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}
