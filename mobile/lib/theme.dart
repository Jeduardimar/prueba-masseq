import 'package:flutter/material.dart';

/// Colores de la identidad de MASSEQ.
abstract final class MasseqColors {
  static const blue = Color(0xFF1E4E9C);
  static const blueLight = Color(0xFF4F7BC4);
  static const orange = Color(0xFFF28C28);
  static const yellow = Color(0xFFF5B400);
  static const text = Color(0xFF1F2937);
  static const muted = Color(0xFF6B7280);
}

ThemeData buildMasseqTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: MasseqColors.blue,
    primary: MasseqColors.blue,
    surface: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: Colors.white,
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF9CA3AF)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: MasseqColors.blue, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: MasseqColors.blue,
        foregroundColor: Colors.white,
        disabledBackgroundColor: MasseqColors.blue.withValues(alpha: 0.6),
        disabledForegroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
