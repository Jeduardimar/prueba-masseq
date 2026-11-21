import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:juan_eduardo_diaz/main.dart';
import 'package:juan_eduardo_diaz/services/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final auth = AuthService(validationDelay: Duration.zero);
    await auth.ensureDemoUser();
    await tester.pumpWidget(MasseqApp(authService: auth));
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

  testWidgets('Valida campos vacíos y contraseña incorrecta', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    expect(find.text('Ingresa el usuario.'), findsOneWidget);
    expect(find.text('Ingresa la contraseña.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('usernameField')), 'admin');
    await tester.enterText(find.byKey(const Key('passwordField')), 'otra');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('authError')), findsOneWidget);
    expect(find.text('La contraseña es incorrecta.'), findsWidgets);
  });

  testWidgets('Inicia sesión con las credenciales de demo y cierra sesión',
      (tester) async {
    await pumpApp(tester);

    await tester.enterText(find.byKey(const Key('usernameField')), 'admin');
    await tester.enterText(
        find.byKey(const Key('passwordField')), 'Masseq2026*');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
    expect(find.text('Bienvenido, admin'), findsOneWidget);

    await tester.ensureVisible(find.byKey(const Key('logoutButton')));
    await tester.tap(find.byKey(const Key('logoutButton')));
    await tester.pumpAndSettle();
    expect(find.text('LOGIN'), findsOneWidget);
  });

  test('La contraseña se guarda como hash con sal, no en texto plano',
      () async {
    await AuthService().ensureDemoUser();
    final prefs = await SharedPreferences.getInstance();
    final values = prefs.getKeys().map((k) => prefs.get(k).toString());
    expect(values.any((v) => v.contains('Masseq2026*')), isFalse);
    expect(await AuthService(validationDelay: Duration.zero).login('nadie', 'x'),
        LoginResult.userNotFound);
  });
}
