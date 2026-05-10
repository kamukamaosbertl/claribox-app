import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  Future<String?> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('backend_ip');

    if (ip == null || ip.trim().isEmpty) {
      return null;
    }

    return 'http://${ip.trim()}:5000';
  }

  Future<bool> submitFeedback({
    required String feedback,
    File? evidenceFile,
  }) async {
    try {
      final baseUrl = await getBaseUrl();

      if (baseUrl == null) {
        print('No backend IP set');
        return false;
      }

      final uri = Uri.parse('$baseUrl/api/feedback/submit');

      final request = http.MultipartRequest('POST', uri)
        ..fields['feedback'] = feedback.trim();

      if (evidenceFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'evidenceFile',
            evidenceFile.path,
          ),
        );
      }

      final streamedResponse = await request.send().timeout(
            const Duration(seconds: 15),
          );

      final responseBody = await streamedResponse.stream.bytesToString();

      print('STATUS: ${streamedResponse.statusCode}');
      print('BODY: $responseBody');

      return streamedResponse.statusCode == 200 ||
          streamedResponse.statusCode == 201;
    } catch (e) {
      print('ERROR: $e');
      return false;
    }
  }
}