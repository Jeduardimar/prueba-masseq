import 'dart:convert';
import 'dart:math';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Resultado de un intento de inicio de sesión.
enum LoginStatus { success, emptyFields, invalidCredentials, locked }

class LoginResult {
  const LoginResult(
    this.status, {
    this.remainingAttempts,
    this.lockedFor = Duration.zero,
  });

  final LoginStatus status;

  /// Intentos que quedan antes del bloqueo (tras un intento fallido).
  final int? remainingAttempts;

  /// Tiempo que falta para poder volver a intentar (si está bloqueado).
  final Duration lockedFor;

  bool get isSuccess => status == LoginStatus.success;

  /// Mensaje en español. Nunca revela si el usuario existe.
  String? get message => switch (status) {
        LoginStatus.success => null,
        LoginStatus.emptyFields => 'Ingresa el usuario y la contraseña.',
        LoginStatus.invalidCredentials => 'Usuario o contraseña incorrectos.',
        LoginStatus.locked =>
          'Demasiados intentos fallidos. Intenta de nuevo en '
              '${lockedFor.inSeconds.clamp(1, 999)} s.',
      };
}

/// Deriva la clave de una contraseña con PBKDF2-HMAC-SHA256.
typedef KeyDerivation = Future<List<int>> Function(
    String password, List<int> salt, int iterations);

/// Por defecto PBKDF2 se ejecuta fuera del hilo de la UI con [compute].
Future<List<int>> derivePbkdf2InBackground(
        String password, List<int> salt, int iterations) =>
    compute(_derivePbkdf2, _KdfJob(password, salt, iterations));

/// PBKDF2 en el mismo hilo (útil en tests).
Future<List<int>> pbkdf2Sha256(String password, List<int> salt, int iterations) =>
    _derivePbkdf2(_KdfJob(password, salt, iterations));

/// Parámetros de PBKDF2 para [compute].
class _KdfJob {
  const _KdfJob(this.password, this.salt, this.iterations);
  final String password;
  final List<int> salt;
  final int iterations;
}

/// PBKDF2-HMAC-SHA256 de 256 bits.
Future<List<int>> _derivePbkdf2(_KdfJob job) async {
  final kdf = Pbkdf2.hmacSha256(iterations: job.iterations, bits: 256);
  final key = await kdf.deriveKeyFromPassword(
    password: job.password,
    nonce: job.salt,
  );
  return key.extractBytes();
}

/// Autenticación local con un único usuario guardado en el almacenamiento
/// seguro del dispositivo (Keystore en Android, Web Crypto en la web).
///
/// La contraseña nunca se guarda: se guarda la clave derivada con
/// PBKDF2-HMAC-SHA256 (100.000 iteraciones, sal aleatoria de 16 bytes).
/// Tras [maxAttempts] intentos fallidos el login se bloquea [lockDuration].
class AuthService {
  AuthService({
    FlutterSecureStorage? storage,
    this.iterations = defaultIterations,
    this.validationDelay = const Duration(milliseconds: 300),
    DateTime Function()? clock,
    KeyDerivation? deriveKey,
  })  : _storage = storage ?? const FlutterSecureStorage(),
        _now = clock ?? DateTime.now,
        _deriveKey = deriveKey ?? derivePbkdf2InBackground;

  static const defaultIterations = 100000;
  static const maxAttempts = 5;
  static const lockDuration = Duration(seconds: 30);

  /// Usuario de demostración que se crea la primera vez que se abre la app.
  static const demoUsername = 'admin';
  static const _demoPassword = 'Masseq2026*';

  static const _kUsername = 'auth.username';
  static const _kSalt = 'auth.salt';
  static const _kHash = 'auth.hash';
  static const _kIterations = 'auth.iterations';
  static const _kFailed = 'auth.failedAttempts';
  static const _kLockedUntil = 'auth.lockedUntil';

  final FlutterSecureStorage _storage;
  final DateTime Function() _now;
  final KeyDerivation _deriveKey;

  /// Iteraciones de PBKDF2 para usuarios nuevos.
  final int iterations;

  /// Pausa mínima para que el loader del botón sea visible.
  final Duration validationDelay;

  Future<void>? _seeding;

  /// Crea el usuario de demostración si aún no existe en el dispositivo.
  /// Llamadas simultáneas comparten la misma operación (una sola sal).
  Future<void> ensureDemoUser() => _seeding ??= _seedDemoUser();

  Future<void> _seedDemoUser() async {
    if (await _storage.read(key: _kUsername) != null) return;

    final salt = _randomBytes(16);
    final hash = await _deriveKey(_demoPassword, salt, iterations);
    await _storage.write(key: _kSalt, value: base64Encode(salt));
    await _storage.write(key: _kHash, value: base64Encode(hash));
    await _storage.write(key: _kIterations, value: '$iterations');
    await _storage.write(key: _kUsername, value: demoUsername);
  }

  /// Tiempo restante de bloqueo (cero si no está bloqueado).
  Future<Duration> lockRemaining() async {
    final until = int.tryParse(await _storage.read(key: _kLockedUntil) ?? '');
    if (until == null) return Duration.zero;
    final left = DateTime.fromMillisecondsSinceEpoch(until).difference(_now());
    return left.isNegative ? Duration.zero : left;
  }

  Future<LoginResult> login(String username, String password) async {
    final user = username.trim();
    if (user.isEmpty || password.isEmpty) {
      return const LoginResult(LoginStatus.emptyFields);
    }

    final locked = await lockRemaining();
    if (locked > Duration.zero) {
      return LoginResult(LoginStatus.locked, lockedFor: locked);
    }

    await ensureDemoUser();
    final started = _now();

    final storedUser = await _storage.read(key: _kUsername);
    final salt = base64Decode((await _storage.read(key: _kSalt))!);
    final storedHash = base64Decode((await _storage.read(key: _kHash))!);
    final rounds =
        int.tryParse(await _storage.read(key: _kIterations) ?? '') ?? iterations;

    // Se deriva la clave aunque el usuario no exista, para que el tiempo de
    // respuesta no revele qué usuarios existen.
    final candidate = await _deriveKey(password, salt, rounds);
    final ok = _constantTimeEquals(candidate, storedHash) &
        _constantTimeEquals(utf8.encode(user), utf8.encode(storedUser ?? ''));

    final elapsed = _now().difference(started);
    if (elapsed < validationDelay) {
      await Future<void>.delayed(validationDelay - elapsed);
    }

    if (ok) {
      await _storage.delete(key: _kFailed);
      await _storage.delete(key: _kLockedUntil);
      return const LoginResult(LoginStatus.success);
    }
    return _registerFailure();
  }

  Future<LoginResult> _registerFailure() async {
    final failed =
        (int.tryParse(await _storage.read(key: _kFailed) ?? '') ?? 0) + 1;
    if (failed >= maxAttempts) {
      final until = _now().add(lockDuration);
      await _storage.write(
        key: _kLockedUntil,
        value: '${until.millisecondsSinceEpoch}',
      );
      await _storage.delete(key: _kFailed);
      return const LoginResult(LoginStatus.locked, lockedFor: lockDuration);
    }
    await _storage.write(key: _kFailed, value: '$failed');
    return LoginResult(
      LoginStatus.invalidCredentials,
      remainingAttempts: maxAttempts - failed,
    );
  }

  static List<int> _randomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (_) => random.nextInt(256));
  }

  /// Comparación en tiempo constante (no se detiene en el primer byte distinto).
  static bool _constantTimeEquals(List<int> a, List<int> b) {
    var diff = a.length ^ b.length;
    for (var i = 0; i < max(a.length, b.length); i++) {
      final x = i < a.length ? a[i] : 0;
      final y = i < b.length ? b[i] : 0;
      diff |= x ^ y;
    }
    return diff == 0;
  }
}
