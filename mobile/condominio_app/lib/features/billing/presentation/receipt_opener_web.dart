import 'dart:html' as html;
import 'package:flutter/material.dart';

Future<void> openReceiptUrl(String absoluteUrl, BuildContext context) async {
  html.window.open(absoluteUrl, '_blank');
}
