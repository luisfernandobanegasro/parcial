import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:provider/provider.dart';

import '../../../core/api_client.dart';
import '../../../core/app_state.dart';
import '../../../env.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String uid;
  final String token;
  const ResetPasswordScreen(
      {super.key, required this.uid, required this.token});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _pass1Ctrl = TextEditingController();
  final _pass2Ctrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _done = false;

  @override
  void dispose() {
    _pass1Ctrl.dispose();
    _pass2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _loading = true);
    try {
      final appState = context.read<AppState>();
      final api = ApiClient(tokenProvider: appState);
      await api.dio.post(
        Env.resetPath,
        data: {
          "uid": widget.uid,
          "token": widget.token,
          "new_password": _pass1Ctrl.text.trim(),
        },
        options: Options(headers: {"Content-Type": "application/json"}),
      );
      if (!mounted) return;
      setState(() => _done = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text("Contraseña restablecida. Inicia sesión nuevamente.")),
      );
      Navigator.of(context).pop();
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
      appBar: AppBar(title: const Text("Crear nueva contraseña")),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.password_outlined,
                        size: 56, color: cs.secondary),
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
                        if (v != _pass1Ctrl.text) return "No coincide";
                        return null;
                      },
                    ),
                    const Gap(16),
                    ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text("Guardar"),
                    ),
                    if (_done) ...[
                      const Gap(8),
                      const Text("Listo, vuelve a iniciar sesión."),
                    ],
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
