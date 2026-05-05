import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  Future<String?> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('backend_ip');
    if (ip == null || ip.trim().isEmpty) return null;
    return "http://${ip.trim()}:5000";
  }

  Future<bool> submitFeedback({
    required String category,
    required String feedback,
    File? evidenceFile,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      if (baseUrl == null) {
        print("No backend IP set");
        return false;
      }

      final uri = Uri.parse("$baseUrl/api/feedback/submit");

      final request =
          http.MultipartRequest('POST', uri)
            ..fields['category'] = category
            ..fields['feedback'] = feedback;

      if (evidenceFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath('evidenceFile', evidenceFile.path),
        );
      }

      final response = await request.send().timeout(
        const Duration(seconds: 15),
      );

      // Read response body (VERY useful for debugging)
      final responseBody = await response.stream.bytesToString();

      print("STATUS: ${response.statusCode}");
      print("BODY: $responseBody");

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print("ERROR: $e");
      return false;
    }
  }
}
