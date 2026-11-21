import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Resultado de un intento de inicio de sesión.
enum LoginResult {
  success,
  emptyFields,
  userNotFound,
  wrongPassword;

  /// Mensaje en español para mostrar al usuario (null si fue exitoso).
  String? get message => switch (this) {
        LoginResult.success => null,
        LoginResult.emptyFields => 'Ingresa el usuario y la contraseña.',
        LoginResult.userNotFound => 'El usuario no existe.',
        LoginResult.wrongPassword => 'La contraseña es incorrecta.',
      };
}

/// Autenticación local: un único usuario guardado en el dispositivo con
/// shared_preferences. La contraseña nunca se guarda en texto plano: se guarda
/// el hash SHA-256 de `sal + contraseña` y la sal aleatoria.
class AuthService {
  AuthService({this.validationDelay = const Duration(milliseconds: 700)});

  /// Usuario de demostración que se crea la primera vez que se abre la app.
  static const demoUsername = 'admin';
  static const _demoPassword = 'Masseq2026*';

  static const _kUsername = 'auth.username';
  static const _kSalt = 'auth.salt';
  static const _kHash = 'auth.passwordHash';

  /// Pausa corta para que el loader del botón sea visible.
  final Duration validationDelay;

  /// Crea el usuario de demostración si aún no existe en el dispositivo.
  Future<void> ensureDemoUser() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString(_kUsername) != null) return;

    final salt = _generateSalt();
    await prefs.setString(_kSalt, salt);
    await prefs.setString(_kHash, hashPassword(_demoPassword, salt));
    await prefs.setString(_kUsername, demoUsername);
  }

  Future<LoginResult> login(String username, String password) async {
    final user = username.trim();
    if (user.isEmpty || password.isEmpty) return LoginResult.emptyFields;

    await Future<void>.delayed(validationDelay);
    await ensureDemoUser();

    final prefs = await SharedPreferences.getInstance();
    if (user != prefs.getString(_kUsername)) return LoginResult.userNotFound;

    final salt = prefs.getString(_kSalt)!;
    final storedHash = prefs.getString(_kHash)!;
    return _constantTimeEquals(hashPassword(password, salt), storedHash)
        ? LoginResult.success
        : LoginResult.wrongPassword;
  }

  /// SHA-256 en hexadecimal de `sal + contraseña`.
  static String hashPassword(String password, String salt) =>
      sha256.convert(utf8.encode('$salt$password')).toString();

  static String _generateSalt() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return base64UrlEncode(bytes);
  }

  static bool _constantTimeEquals(String a, String b) {
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a.codeUnitAt(i) ^ b.codeUnitAt(i);
    }
    return diff == 0;
  }
}
