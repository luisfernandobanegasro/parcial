import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

Future<void> openReceiptUrl(String absoluteUrl, BuildContext context) async {
  await Clipboard.setData(ClipboardData(text: absoluteUrl));
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('Enlace copiado. Ábrelo en tu navegador:\n$absoluteUrl'),
      duration: const Duration(seconds: 4),
    ),
  );
}
