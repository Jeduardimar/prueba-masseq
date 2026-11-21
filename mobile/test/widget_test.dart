import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:juan_eduardo_diaz/main.dart';
import 'package:juan_eduardo_diaz/screens/home_screen.dart';
import 'package:juan_eduardo_diaz/services/auth_service.dart';
import 'package:juan_eduardo_diaz/services/fleet_service.dart';

/// AuthService para tests: PBKDF2 en el mismo hilo y con menos iteraciones.
AuthService testAuth() => AuthService(
  iterations: 1000,
  validationDelay: Duration.zero,
  deriveKey: pbkdf2Sha256,
);

/// Respuesta simulada de GET /api/machines: 2 disponibles, 1 en obra,
/// 1 en mantenimiento.
const machinesJson =
    '[{"id":1,"status":"disponible"},'
    '{"id":2,"status":"disponible"},{"id":3,"status":"en_obra"},'
    '{"id":4,"status":"mantenimiento"}]';

FleetService fleetReturning(int status, String body) =>
    FleetService(client: MockClient((_) async => http.Response(body, status)));

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  Future<void> pumpApp(WidgetTester tester, {FleetService? fleet}) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final auth = testAuth();
    await auth.ensureDemoUser();
    await tester.pumpWidget(
      MasseqApp(
        authService: auth,
        fleetService: fleet ?? fleetReturning(200, machinesJson),
      ),
    );
    await tester.pump();
  }

  Future<void> attempt(WidgetTester tester, String user, String pass) async {
    await tester.enterText(find.byKey(const Key('usernameField')), user);
    await tester.enterText(find.byKey(const Key('passwordField')), pass);
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
  }

  testWidgets('La pantalla de login muestra los campos y el botón', (
    tester,
  ) async {
    await pumpApp(tester);

    expect(find.text('LOGIN'), findsOneWidget);
    expect(find.byKey(const Key('usernameField')), findsOneWidget);
    expect(find.byKey(const Key('passwordField')), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Username'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Password'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Ingresar'), findsOneWidget);
    expect(find.text('MASSEQ | CONSTRUIMOS CONFIANZA'), findsOneWidget);
    expect(
      find.text('© 2026 Masseq Proyectos e Ingeniería S.A.S.'),
      findsOneWidget,
    );
    expect(find.textContaining('Juan Eduardo'), findsNothing);
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

  testWidgets(
    'Inicia sesión, muestra el resumen real de la flota y cierra sesión',
    (tester) async {
      await pumpApp(tester);

      await attempt(tester, 'admin', 'Masseq2026*');
      expect(find.text('Hola, admin'), findsOneWidget);
      expect(find.byKey(const Key('todayDate')), findsOneWidget);
      expect(find.bySemanticsLabel('Total de equipos: 4'), findsOneWidget);
      expect(find.bySemanticsLabel('Disponibles: 2'), findsOneWidget);
      expect(find.bySemanticsLabel('En obra: 1'), findsOneWidget);
      expect(find.bySemanticsLabel('En mantenimiento: 1'), findsOneWidget);
      for (final line in businessLines) {
        expect(find.text(line.name), findsOneWidget);
      }

      await tester.ensureVisible(find.byKey(const Key('logoutButton')));
    await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('logoutButton')));
      await tester.pumpAndSettle();
      expect(find.text('LOGIN'), findsOneWidget);
    },
  );

  testWidgets('Muestra el error de la API y permite reintentar', (
    tester,
  ) async {
    var calls = 0;
    final fleet = FleetService(
      client: MockClient((_) async {
        calls++;
        return calls == 1
            ? http.Response('{"message":"x"}', 500)
            : http.Response(machinesJson, 200);
      }),
    );
    await pumpApp(tester, fleet: fleet);
    await attempt(tester, 'admin', 'Masseq2026*');

    expect(find.byKey(const Key('fleetError')), findsOneWidget);
    expect(find.textContaining('(500)'), findsOneWidget);

    await tester.tap(find.byKey(const Key('retryButton')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('fleetError')), findsNothing);
    expect(find.bySemanticsLabel('Total de equipos: 4'), findsOneWidget);
  });

  test('FleetService informa el límite de peticiones (429)', () async {
    expect(
      fleetReturning(429, '{}').fetchSummary(),
      throwsA(
        isA<FleetException>().having(
          (e) => e.message,
          'message',
          contains('Demasiadas solicitudes'),
        ),
      ),
    );
  });

  test('Formatea la fecha en español', () {
    expect(
      formatLongDate(DateTime(2026, 11, 21)),
      'Sábado, 21 de noviembre de 2026',
    );
  });

  test('La contraseña no se guarda en texto plano', () async {
    final storage = const FlutterSecureStorage();
    await testAuth().ensureDemoUser();
    final values = (await storage.readAll()).values;
    expect(values.any((v) => v.contains('Masseq2026*')), isFalse);
  });

  test('PBKDF2-HMAC-SHA256 coincide con el vector de prueba RFC 7914', () async {
    // RFC 7914 §11: P="passwd", S="salt", c=1, dkLen=64 (se comparan 32 bytes).
    final key = await pbkdf2Sha256('passwd', 'salt'.codeUnits, 1);
    final hex = key.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    expect(hex, startsWith('55ac046e56e3089fec1691c22544b605'));
  });
}
