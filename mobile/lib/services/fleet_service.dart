import 'dart:convert';

import 'package:http/http.dart' as http;

/// Resumen de la flota calculado con los datos reales de la API.
class FleetSummary {
  const FleetSummary({
    required this.total,
    required this.available,
    required this.onSite,
    required this.maintenance,
  });

  final int total;
  final int available;
  final int onSite;
  final int maintenance;

  factory FleetSummary.fromMachines(List<dynamic> machines) {
    int count(String status) => machines
        .where((m) => m is Map<String, dynamic> && m['status'] == status)
        .length;
    return FleetSummary(
      total: machines.length,
      available: count('disponible'),
      onSite: count('en_obra'),
      maintenance: count('mantenimiento'),
    );
  }
}

/// Error mostrado al usuario cuando no se puede obtener la flota.
class FleetException implements Exception {
  const FleetException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Lee la flota desde la API publicada en Render (solo lectura).
class FleetService {
  FleetService({http.Client? client, Uri? endpoint, this.timeout = _timeout})
    : _client = client ?? http.Client(),
      _endpoint = endpoint ?? defaultEndpoint;

  static final defaultEndpoint = Uri.parse(
    'https://masseq-flota-api.onrender.com/api/machines',
  );

  // Render gratuito "despierta" en ~1 min si el servicio estaba dormido.
  static const _timeout = Duration(seconds: 90);

  final http.Client _client;
  final Uri _endpoint;
  final Duration timeout;

  Future<FleetSummary> fetchSummary() async {
    final http.Response response;
    try {
      response = await _client
          .get(_endpoint, headers: const {'Accept': 'application/json'})
          .timeout(timeout);
    } catch (_) {
      throw const FleetException(
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
    if (response.statusCode == 429) {
      throw const FleetException(
        'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
      );
    }
    if (response.statusCode != 200) {
      throw FleetException(
        'El servidor respondió con un error (${response.statusCode}).',
      );
    }
    try {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      if (data is! List) throw const FormatException();
      return FleetSummary.fromMachines(data);
    } catch (_) {
      throw const FleetException('La respuesta del servidor no es válida.');
    }
  }
}
