import 'package:dio/dio.dart';
import '../utils/constants.dart';
import 'auth_interceptor.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late Dio dio;

  factory ApiClient() {
    return _instance;
  }

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        contentType: 'application/json',
      ),
    );

    dio.interceptors.add(AuthInterceptor());
  }
}

final apiClient = ApiClient().dio;
