import 'package:flutter/material.dart';

import '../theme.dart';

/// Logo de MASSEQ recreado con widgets: una cuadrícula inclinada de bloques
/// azules y uno naranja, el texto "MASSEQ" y el lema "CONSTRUIMOS CONFIANZA".
class MasseqLogo extends StatelessWidget {
  const MasseqLogo({super.key, this.size = 1.0, this.light = false});

  /// Escala del logo (1.0 = tamaño de la pantalla de login).
  final double size;

  /// Versión clara (bloques y texto blancos) para fondos azules.
  final bool light;

  @override
  Widget build(BuildContext context) {
    final textColor = light ? Colors.white : MasseqColors.blue;
    return Semantics(
      label: 'Logo de MASSEQ',
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _BlockGrid(size: 54 * size, light: light),
            SizedBox(width: 12 * size),
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MASSEQ',
                  style: TextStyle(
                    color: textColor,
                    fontSize: 34 * size,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2 * size,
                    height: 1,
                  ),
                ),
                SizedBox(height: 4 * size),
                Text(
                  'CONSTRUIMOS CONFIANZA',
                  style: TextStyle(
                    color: light ? Colors.white70 : MasseqColors.muted,
                    fontSize: 9.5 * size,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.6 * size,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Cuadrícula 3x3 de bloques inclinada (sesgo + rotación leve).
class _BlockGrid extends StatelessWidget {
  const _BlockGrid({required this.size, required this.light});

  final double size;
  final bool light;

  // 0 = vacío, 1 = azul, 2 = azul claro, 3 = naranja.
  static const _pattern = [
    [1, 1, 3],
    [1, 2, 0],
    [2, 0, 0],
  ];

  @override
  Widget build(BuildContext context) {
    final gap = size * 0.06;
    final cell = (size - gap * 2) / 3;

    Color colorFor(int v) => switch (v) {
          1 => light ? Colors.white : MasseqColors.blue,
          2 => light ? Colors.white60 : MasseqColors.blueLight,
          3 => MasseqColors.orange,
          _ => Colors.transparent,
        };

    return SizedBox.square(
      dimension: size,
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.skewX(-0.25)..rotateZ(-0.12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (final row in _pattern)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (final v in row)
                    Container(
                      width: cell,
                      height: cell,
                      decoration: BoxDecoration(
                        color: colorFor(v),
                        borderRadius: BorderRadius.circular(cell * 0.12),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
