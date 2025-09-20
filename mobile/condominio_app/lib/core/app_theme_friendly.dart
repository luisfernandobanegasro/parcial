import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FriendlyTheme {
  static const Color primary = Color(0xFF2F7D32);
  static const Color secondary = Color(0xFFE9A23B);
  static const Color baseBeige = Color(0xFFF7F3EA);

  static ColorScheme scheme = ColorScheme.fromSeed(
    seedColor: primary,
    brightness: Brightness.light,
  ).copyWith(
    surface: Colors.white,
    background: baseBeige,
  );

  static ThemeData light() {
    final textTheme = GoogleFonts.ralewayTextTheme();
    final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(24));

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: baseBeige,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFFFF8EE),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(28)),
          borderSide: BorderSide(color: secondary, width: 1.2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: rounded,
          minimumSize: const Size.fromHeight(48),
        ),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        shadowColor: scheme.primary.withOpacity(.1),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(elevation: 8),
    );
  }
}
