import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../../../core/api_client.dart';
import '../../../env.dart';
import 'package:dio/dio.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _sentTo;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _loading = true);
    try {
      final api = ApiClient();
      await api.dio.post(
        Env.forgotPath,
        data: {"email": _emailCtrl.text.trim()},
        options: Options(headers: {"Content-Type": "application/json"}),
      );
      if (!mounted) return;
      setState(() => _sentTo = _emailCtrl.text.trim());
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Si el correo existe, se envió un enlace de restablecimiento.")),
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
      appBar: AppBar(title: const Text("Restablecer contraseña")),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(Icons.lock_reset, size: 56, color: cs.secondary),
                  const Gap(8),
                  Text(
                    "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.",
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const Gap(16),
                  Form(
                    key: _formKey,
                    child: TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: "Correo electrónico",
                        prefixIcon: Icon(Icons.alternate_email_outlined),
                      ),
                      validator: (v) {
                        final t = (v ?? "").trim();
                        if (t.isEmpty) return "Ingresa tu correo";
                        if (!t.contains("@") || !t.contains(".")) return "Correo inválido";
                        return null;
                      },
                    ),
                  ),
                  const Gap(16),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text("Enviar enlace"),
                  ),
                  if (_sentTo != null) ...[
                    const Gap(12),
                    Text(
                      "Revisa tu bandeja de entrada: $_sentTo",
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
