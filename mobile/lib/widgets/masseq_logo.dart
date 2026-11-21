import 'package:flutter/material.dart';

/// Insignia oficial de MASSEQ (assets/brand/logo-masseq-insignia.png).
class MasseqLogo extends StatelessWidget {
  const MasseqLogo({super.key, this.height = 120});

  final double height;

  static const asset = 'assets/brand/logo-masseq-insignia.png';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'Logo de MASSEQ',
      filterQuality: FilterQuality.medium,
    );
  }
}
