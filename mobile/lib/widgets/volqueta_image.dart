import 'package:flutter/material.dart';

/// Ilustración de la volqueta (PNG con fondo transparente).
class VolquetaImage extends StatelessWidget {
  const VolquetaImage({super.key, this.height = 120});

  final double height;

  static const asset = 'assets/images/volqueta.png';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'Ilustración de una volqueta',
      filterQuality: FilterQuality.medium,
    );
  }
}
