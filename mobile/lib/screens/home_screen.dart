import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/fleet_service.dart';
import '../theme.dart';
import '../widgets/masseq_footer.dart';
import '../widgets/masseq_logo.dart';
import 'login_screen.dart';

const _weekdays = [
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', //
];
const _months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', //
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/// Fecha larga en español (es-CO), p. ej. "Sábado, 21 de noviembre de 2026".
String formatLongDate(DateTime d) {
  final day = _weekdays[d.weekday - 1];
  return '${day[0].toUpperCase()}${day.substring(1)}, '
      '${d.day} de ${_months[d.month - 1]} de ${d.year}';
}

/// Líneas de negocio publicadas en web.masseq.com.co.
const businessLines = [
  (icon: Icons.add_road, name: 'Infraestructura vial'),
  (icon: Icons.oil_barrel_outlined, name: 'Hidrocarburos'),
  (icon: Icons.water_drop_outlined, name: 'Hidráulicos'),
  (icon: Icons.terrain_outlined, name: 'Geotecnia'),
  (icon: Icons.emergency_outlined, name: 'Emergencias'),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.username,
    required this.authService,
    required this.fleetService,
    this.now,
  });

  final String username;
  final AuthService authService;
  final FleetService fleetService;

  /// Fecha mostrada en el encabezado (inyectable para los tests).
  final DateTime? now;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<FleetSummary> _summary;

  @override
  void initState() {
    super.initState();
    _summary = widget.fleetService.fetchSummary();
  }

  void _retry() {
    setState(() {
      _summary = widget.fleetService.fetchSummary();
    });
  }

  void _logout() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LoginScreen(
          authService: widget.authService,
          fleetService: widget.fleetService,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MasseqColors.surface,
      bottomNavigationBar: const SafeArea(top: false, child: MasseqFooter()),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _Header(
              username: widget.username,
              date: widget.now ?? DateTime.now(),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
            sliver: SliverToBoxAdapter(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _SectionTitle('Resumen de la flota'),
                      const SizedBox(height: 12),
                      FutureBuilder<FleetSummary>(
                        future: _summary,
                        builder: (context, snapshot) {
                          if (snapshot.connectionState !=
                              ConnectionState.done) {
                            return const _FleetLoading();
                          }
                          if (snapshot.hasError) {
                            return _FleetError(
                              message: snapshot.error.toString(),
                              onRetry: _retry,
                            );
                          }
                          return _FleetSummaryGrid(summary: snapshot.data!);
                        },
                      ),
                      const SizedBox(height: 28),
                      const _SectionTitle('Líneas de negocio'),
                      const SizedBox(height: 12),
                      const _BusinessLines(),
                      const SizedBox(height: 32),
                      Center(
                        child: OutlinedButton.icon(
                          key: const Key('logoutButton'),
                          onPressed: _logout,
                          icon: const Icon(Icons.logout),
                          label: const Text('Cerrar sesión'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: MasseqColors.blue,
                            side: const BorderSide(color: MasseqColors.blue),
                            minimumSize: const Size(200, 48),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.username, required this.date});

  final String username;
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: MasseqColors.black,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Row(
                children: [
                  const MasseqLogo(height: 64),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hola, $username',
                          key: const Key('greeting'),
                          style: const TextStyle(
                            fontFamily: MasseqFonts.title,
                            fontWeight: FontWeight.w700,
                            fontSize: 22,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatLongDate(date),
                          key: const Key('todayDate'),
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFFD0D0D0),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(gradient: MasseqColors.accentGradient),
              child: SizedBox(height: 4, width: double.infinity),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontFamily: MasseqFonts.label,
          fontWeight: FontWeight.w700,
          fontSize: 17,
          letterSpacing: 1,
          color: MasseqColors.blue,
        ),
      ),
    );
  }
}

class _FleetLoading extends StatelessWidget {
  const _FleetLoading();

  @override
  Widget build(BuildContext context) {
    return const Card(
      key: Key('fleetLoading'),
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Consultando la flota…', textAlign: TextAlign.center),
            SizedBox(height: 4),
            Text(
              'Si el servidor estaba inactivo puede tardar hasta un minuto.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: MasseqColors.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _FleetError extends StatelessWidget {
  const _FleetError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final error = Theme.of(context).colorScheme.error;
    return Card(
      key: const Key('fleetError'),
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(Icons.cloud_off_outlined, color: error, size: 32),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton.icon(
              key: const Key('retryButton'),
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FleetSummaryGrid extends StatelessWidget {
  const _FleetSummaryGrid({required this.summary});

  final FleetSummary summary;

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        'total',
        'Total de equipos',
        summary.total,
        MasseqColors.title,
        Icons.local_shipping_outlined,
      ),
      (
        'disponible',
        'Disponibles',
        summary.available,
        MasseqColors.statusAvailable,
        Icons.check_circle_outline,
      ),
      (
        'en_obra',
        'En obra',
        summary.onSite,
        MasseqColors.statusOnSite,
        Icons.construction_outlined,
      ),
      (
        'mantenimiento',
        'En mantenimiento',
        summary.maintenance,
        MasseqColors.statusMaintenance,
        Icons.build_outlined,
      ),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: [
        for (final (key, label, value, color, icon) in items)
          Card(
            key: Key('stat_$key'),
            elevation: 0,
            color: Colors.white,
            margin: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: color.withValues(alpha: 0.25)),
            ),
            child: Semantics(
              label: '$label: $value',
              excludeSemantics: true,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(icon, color: color),
                    Text(
                      '$value',
                      style: TextStyle(
                        fontFamily: MasseqFonts.title,
                        fontWeight: FontWeight.w700,
                        fontSize: 28,
                        height: 1.1,
                        color: color,
                      ),
                    ),
                    Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: MasseqFonts.label,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: MasseqColors.text,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _BusinessLines extends StatelessWidget {
  const _BusinessLines();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => Wrap(
        spacing: 12,
        runSpacing: 12,
        alignment: WrapAlignment.center,
        children: [
          for (final line in businessLines)
            SizedBox(
              key: Key('line_${line.name}'),
              width: (constraints.maxWidth - 12) / 2,
              child: Card(
                elevation: 0,
                color: Colors.white,
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 16,
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: MasseqColors.yellow,
                        child: Icon(line.icon, color: MasseqColors.black),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        line.name,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: MasseqFonts.label,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: MasseqColors.title,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
