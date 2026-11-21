import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../services/auth_service.dart';
import '../theme.dart';
import '../widgets/developer_footer.dart';
import '../widgets/masseq_logo.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.username,
    required this.authService,
  });

  final String username;
  final AuthService authService;

  void _logout(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LoginScreen(authService: authService),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: MasseqColors.black,
        foregroundColor: Colors.white,
        toolbarHeight: 64,
        title: const MasseqLogo(height: 44),
        centerTitle: true,
        // Línea de acento amarillo → naranja → azul, como en la web.
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(4),
          child: DecoratedBox(
            decoration: BoxDecoration(gradient: MasseqColors.accentGradient),
            child: SizedBox(height: 4, width: double.infinity),
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                children: [
                  Text(
                    'BIENVENIDO, ${username.toUpperCase()}',
                    semanticsLabel: 'Bienvenido, $username',
                    style: theme.textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Iniciaste sesión correctamente.',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: MasseqColors.muted),
                  ),
                  const SizedBox(height: 24),
                  SvgPicture.asset('assets/images/volqueta.svg', height: 100),
                  const SizedBox(height: 24),
                  const Card(
                    elevation: 0,
                    color: MasseqColors.surface,
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SOBRE ESTA APP',
                            style: TextStyle(
                              fontFamily: MasseqFonts.label,
                              fontWeight: FontWeight.w700,
                              fontSize: 17,
                              letterSpacing: 1,
                              color: MasseqColors.blue,
                            ),
                          ),
                          SizedBox(height: 12),
                          _SummaryItem(
                            icon: Icons.phone_android,
                            text: 'App móvil en Flutter de la prueba técnica '
                                'de MASSEQ (flota de maquinaria pesada).',
                          ),
                          _SummaryItem(
                            icon: Icons.lock_outline,
                            text: 'Login local: el usuario se guarda en el '
                                'almacenamiento seguro del dispositivo y la '
                                'contraseña se deriva con PBKDF2-HMAC-SHA256 '
                                '(100.000 iteraciones y sal aleatoria).',
                          ),
                          _SummaryItem(
                            icon: Icons.language,
                            text: 'La web (Angular) y la API (Express) de la '
                                'flota están publicadas en Vercel y Render.',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  OutlinedButton.icon(
                    key: const Key('logoutButton'),
                    onPressed: () => _logout(context),
                    icon: const Icon(Icons.logout),
                    label: const Text('CERRAR SESIÓN'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: MasseqColors.blue,
                      side: const BorderSide(color: MasseqColors.blue),
                      minimumSize: const Size(200, 48),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const DeveloperFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  const _SummaryItem({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: MasseqColors.blue),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
