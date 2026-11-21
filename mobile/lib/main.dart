import 'dart:async';

import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/fleet_service.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authService = AuthService();
  // La primera vez que se abre la app se crea el usuario de demostración
  // (en segundo plano, para no retrasar el primer frame).
  unawaited(authService.ensureDemoUser());
  runApp(MasseqApp(authService: authService, fleetService: FleetService()));
}

class MasseqApp extends StatelessWidget {
  const MasseqApp({
    super.key,
    required this.authService,
    required this.fleetService,
  });

  final AuthService authService;
  final FleetService fleetService;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MASSEQ Login',
      debugShowCheckedModeBanner: false,
      theme: buildMasseqTheme(),
      home: LoginScreen(authService: authService, fleetService: fleetService),
    );
  }
}
