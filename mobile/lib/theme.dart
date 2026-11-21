import 'package:flutter/material.dart';

/// Colores de la identidad de MASSEQ (web.masseq.com.co).
abstract final class MasseqColors {
  static const blue = Color(0xFF0057A8);
  static const blueLight = Color(0xFF0072B0);
  static const yellow = Color(0xFFF6B40E);
  static const orange = Color(0xFFE8642F);
  static const black = Color(0xFF000000);
  static const title = Color(0xFF070200);
  static const text = Color(0xFF3F3F3F);
  static const muted = Color(0xFF5A5A5A);
  static const background = Color(0xFFFFFFFF);
  static const surface = Color(0xFFF5F6F8);

  /// Degradado de acento amarillo → naranja → azul.
  static const accentGradient = LinearGradient(
    colors: [yellow, orange, blue],
  );
}

/// Familias tipográficas incluidas como assets (ver pubspec.yaml).
abstract final class MasseqFonts {
  /// Títulos: Poppins 700 en mayúsculas.
  static const title = 'Poppins';

  /// Subtítulos, etiquetas y botones: Barlow Semi Condensed 600/700.
  static const label = 'BarlowSemiCondensed';

  /// Texto: Nunito Sans.
  static const body = 'NunitoSans';
}

ThemeData buildMasseqTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: MasseqColors.blue,
    primary: MasseqColors.blue,
    tertiary: MasseqColors.yellow,
    surface: MasseqColors.background,
  );

  const labelStyle = TextStyle(
    fontFamily: MasseqFonts.label,
    fontWeight: FontWeight.w700,
    letterSpacing: 1,
  );

  final base = ThemeData(useMaterial3: true, fontFamily: MasseqFonts.body);

  return base.copyWith(
    colorScheme: scheme,
    scaffoldBackgroundColor: MasseqColors.background,
    textTheme: base.textTheme
        .apply(
          bodyColor: MasseqColors.text,
          displayColor: MasseqColors.title,
        )
        .copyWith(
          headlineMedium: const TextStyle(
            fontFamily: MasseqFonts.title,
            fontWeight: FontWeight.w700,
            fontSize: 28,
            color: MasseqColors.title,
          ),
          headlineSmall: const TextStyle(
            fontFamily: MasseqFonts.title,
            fontWeight: FontWeight.w700,
            fontSize: 22,
            color: MasseqColors.title,
          ),
          titleMedium: labelStyle.copyWith(
            fontSize: 17,
            color: MasseqColors.blue,
          ),
        ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF8A8A8A)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: MasseqColors.blue, width: 2),
      ),
      labelStyle: const TextStyle(color: MasseqColors.text),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: MasseqColors.blue,
        foregroundColor: Colors.white,
        disabledBackgroundColor: MasseqColors.blue.withValues(alpha: 0.55),
        disabledForegroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: labelStyle.copyWith(fontSize: 18),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        textStyle: labelStyle.copyWith(fontSize: 17),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
