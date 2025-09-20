import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../../core/api_client.dart';
import '../../env.dart';
import 'package:dio/dio.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _oldCtrl = TextEditingController();
  final _new1Ctrl = TextEditingController();
  final _new2Ctrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  @override
  void dispose() {
    _oldCtrl.dispose();
    _new1Ctrl.dispose();
    _new2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _loading = true);
    try {
      final api = ApiClient();
      await api.dio.post(
        Env.changePath,
        data: {
          "old_password": _oldCtrl.text,
          "new_password": _new1Ctrl.text,
        },
        options: Options(headers: {"Content-Type": "application/json"}),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Contraseña actualizada correctamente.")),
      );
      Navigator.of(context).pop(); // vuelve a la pantalla anterior
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
      appBar: AppBar(title: const Text("Cambiar contraseña")),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.lock_outline, size: 56, color: cs.secondary),
                    const Gap(12),
                    TextFormField(
                      controller: _oldCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: "Contraseña actual",
                        prefixIcon: Icon(Icons.lock_clock_outlined),
                      ),
                      validator: (v) => (v == null || v.isEmpty) ? "Ingresa tu contraseña actual" : null,
                    ),
                    const Gap(12),
                    TextFormField(
                      controller: _new1Ctrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: "Nueva contraseña",
                        prefixIcon: Icon(Icons.lock_reset),
                      ),
                      validator: (v) {
                        final t = v ?? "";
                        if (t.length < 8) return "Mínimo 8 caracteres";
                        return null;
                      },
                    ),
                    const Gap(12),
                    TextFormField(
                      controller: _new2Ctrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: "Confirmar nueva contraseña",
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      validator: (v) {
                        if (v != _new1Ctrl.text) return "Las contraseñas no coinciden";
                        return null;
                      },
                    ),
                    const Gap(16),
                    ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text("Guardar"),
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
