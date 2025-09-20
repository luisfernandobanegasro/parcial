import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../../../core/api_client.dart';
import '../../../env.dart';
import 'package:dio/dio.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _uidCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  final _pass1Ctrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    // Intenta pre-cargar desde la URL (útil en Flutter Web)
    final qp = Uri.base.queryParameters;
    if ((qp['uid'] ?? "").isNotEmpty) _uidCtrl.text = qp['uid']!;
    if ((qp['token'] ?? "").isNotEmpty) _tokenCtrl.text = qp['token']!;
  }

  @override
  void dispose() {
    _uidCtrl.dispose();
    _tokenCtrl.dispose();
    _pass1Ctrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    try {
      final api = ApiClient();
      await api.dio.post(
        Env.resetPath,
        data: {
          "uid": _uidCtrl.text.trim(),
          "token": _tokenCtrl.text.trim(),
          "new_password": _pass1Ctrl.text,
        },
        options: Options(headers: {"Content-Type": "application/json"}),
      );
      if (!mounted) return;
      setState(() => _done = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Contraseña actualizada correctamente.")),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst("Exception: ", ""))),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text("Nueva contraseña")),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: _done
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, size: 56, color: cs.primary),
                        const Gap(12),
                        const Text("Tu contraseña fue actualizada."),
                        const Gap(12),
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text("Volver al inicio de sesión"),
                        ),
                      ],
                    )
                  : Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Icon(Icons.password_outlined, size: 56, color: cs.secondary),
                          const Gap(12),
                          TextFormField(
                            controller: _uidCtrl,
                            decoration: const InputDecoration(
                              labelText: "UID",
                              prefixIcon: Icon(Icons.fingerprint_outlined),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? "UID requerido" : null,
                          ),
                          const Gap(12),
                          TextFormField(
                            controller: _tokenCtrl,
                            decoration: const InputDecoration(
                              labelText: "Token",
                              prefixIcon: Icon(Icons.vpn_key_outlined),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? "Token requerido" : null,
                          ),
                          const Gap(12),
                          TextFormField(
                            controller: _pass1Ctrl,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: "Nueva contraseña",
                              prefixIcon: Icon(Icons.lock_outline),
                            ),
                            validator: (v) {
                              final t = v ?? "";
                              if (t.length < 8) return "Mínimo 8 caracteres";
                              return null;
                            },
                          ),
                          const Gap(12),
                          TextFormField(
                            controller: _pass2Ctrl,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: "Confirmar contraseña",
                              prefixIcon: Icon(Icons.lock_outline),
                            ),
                            validator: (v) {
                              if (v != _pass1Ctrl.text) return "Las contraseñas no coinciden";
                              return null;
                            },
                          ),
                          const Gap(16),
                          ElevatedButton(
                            onPressed: _loading ? null : _submit,
                            child: _loading
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text("Actualizar contraseña"),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
