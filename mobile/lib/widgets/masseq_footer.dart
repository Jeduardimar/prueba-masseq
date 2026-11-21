import 'package:flutter/material.dart';

import '../theme.dart';

/// Pie de página como el de la web: franja oscura con el lema de MASSEQ.
class MasseqFooter extends StatelessWidget {
  const MasseqFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: MasseqColors.footer,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'MASSEQ | CONSTRUIMOS CONFIANZA',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: MasseqFonts.label,
              fontWeight: FontWeight.w700,
              fontSize: 15,
              letterSpacing: 1.2,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 4),
          Text(
            '© 2026 Masseq Proyectos e Ingeniería S.A.S.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: Color(0xFFC4C4C4)),
          ),
        ],
      ),
    );
  }
}
