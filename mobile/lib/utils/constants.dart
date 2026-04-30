import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  static String baseUrl = dotenv.get('API_BASE_URL', fallback: 'http://localhost:8080/api/v1');

  static String loginUrl = '$baseUrl/auth/login';
  static String registerUrl = '$baseUrl/auth/register';
  static String venueUrl = '$baseUrl/venues';
}