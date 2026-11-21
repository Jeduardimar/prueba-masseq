import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:juan_eduardo_diaz/main.dart';
import 'package:juan_eduardo_diaz/services/auth_service.dart';

/// AuthService para tests: PBKDF2 en el mismo hilo y con menos iteraciones.
AuthService testAuth() => AuthService(
      iterations: 1000,
      validationDelay: Duration.zero,
      deriveKey: pbkdf2Sha256,
    );

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final auth = testAuth();
    await auth.ensureDemoUser();
    await tester.pumpWidget(MasseqApp(authService: auth));
    await tester.pump();
  }

  Future<void> attempt(WidgetTester tester, String user, String pass) async {
    await tester.enterText(find.byKey(const Key('usernameField')), user);
    await tester.enterText(find.byKey(const Key('passwordField')), pass);
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
  }

  testWidgets('La pantalla de login muestra los campos y el botón',
      (tester) async {
    await pumpApp(tester);

    expect(find.text('LOGIN'), findsOneWidget);
    expect(find.byKey(const Key('usernameField')), findsOneWidget);
    expect(find.byKey(const Key('passwordField')), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Username'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Password'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Ingresar'), findsOneWidget);
    expect(find.text('Desarrollado por Masseq'), findsOneWidget);
  });

  testWidgets('Valida campos vacíos y usa un mensaje genérico', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    expect(find.text('Ingresa el usuario.'), findsOneWidget);
    expect(find.text('Ingresa la contraseña.'), findsOneWidget);

    // Mismo mensaje para contraseña incorrecta y para usuario inexistente.
    await attempt(tester, 'admin', 'otra');
    expect(find.text('Usuario o contraseña incorrectos.'), findsWidgets);
    expect(find.text('Te quedan 4 intentos.'), findsOneWidget);

    await attempt(tester, 'nadie', 'otra');
    expect(find.text('Usuario o contraseña incorrectos.'), findsWidgets);
    expect(find.text('Te quedan 3 intentos.'), findsOneWidget);
  });

  testWidgets('Bloquea 30 s tras 5 intentos fallidos', (tester) async {
    await pumpApp(tester);

    for (var i = 0; i < AuthService.maxAttempts; i++) {
      await attempt(tester, 'admin', 'mala$i');
    }
    expect(find.byKey(const Key('lockMessage')), findsOneWidget);
    final button = tester.widget<FilledButton>(
      find.byKey(const Key('loginButton')),
    );
    expect(button.onPressed, isNull);

    await tester.pump(const Duration(seconds: 31));
    expect(find.byKey(const Key('lockMessage')), findsNothing);
  });

  testWidgets('Inicia sesión con las credenciales de demo y cierra sesión',
      (tester) async {
    await pumpApp(tester);

    await attempt(tester, 'admin', 'Masseq2026*');
    expect(find.text('Bienvenido, admin'), findsOneWidget);

    await tester.ensureVisible(find.byKey(const Key('logoutButton')));
    await tester.tap(find.byKey(const Key('logoutButton')));
    await tester.pumpAndSettle();
    expect(find.text('LOGIN'), findsOneWidget);
  });

  test('La contraseña no se guarda en texto plano', () async {
    final storage = const FlutterSecureStorage();
    await testAuth().ensureDemoUser();
    final values = (await storage.readAll()).values;
    expect(values.any((v) => v.contains('Masseq2026*')), isFalse);
  });

  test('PBKDF2-HMAC-SHA256 coincide con el vector de prueba RFC 7914',
      () async {
    // RFC 7914 §11: P="passwd", S="salt", c=1, dkLen=64 (se comparan 32 bytes).
    final key = await pbkdf2Sha256('passwd', 'salt'.codeUnits, 1);
    final hex = key.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    expect(hex, startsWith('55ac046e56e3089fec1691c22544b605'));
  });
}
