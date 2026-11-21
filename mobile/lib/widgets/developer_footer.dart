import 'package:flutter/material.dart';

import '../theme.dart';

/// Pie con el crédito de MASSEQ y el autor de la app.
class DeveloperFooter extends StatelessWidget {
  const DeveloperFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Desarrollado por Masseq',
          style: TextStyle(
            color: MasseqColors.blue,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        SizedBox(height: 2),
        Text(
          'App: Juan Eduardo Díaz Martínez',
          style: TextStyle(color: MasseqColors.muted, fontSize: 11),
        ),
      ],
    );
  }
}
