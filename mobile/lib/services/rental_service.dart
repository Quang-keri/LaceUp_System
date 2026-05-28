import 'package:dio/dio.dart';
import '../config/api_client.dart';
import '../models/rental_area.dart';

class RentalService {
  final String _endpoint = '/rental-areas';

  Future<dynamic> getRentalAreaOptions() async {
    try {
      final response = await apiClient.get('$_endpoint/options');
      return response.data['result'];
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Lỗi tải danh sách options',
      );
    } catch (e) {
      throw Exception('Lỗi xử lý dữ liệu: $e');
    }
  }

  Future<RentalAreaResponse> getRentalAreaById(String id) async {
    try {
      final response = await apiClient.get('$_endpoint/$id');
      final data = response.data['result'] ?? response.data;
      return RentalAreaResponse.fromJson(data);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải thông tin khu vực sân',
      );
    } catch (e) {
      throw Exception('Lỗi xử lý dữ liệu: $e');
    }
  }

  Future<dynamic> getMyRentalAreas({
    int page = 1,
    int size = 10,
    String? keyword,
    String? status,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'size': size,
        if (keyword != null) 'keyword': keyword,
        if (status != null) 'status': status,
      };

      final response = await apiClient.get(
        '$_endpoint/my-rentals',
        queryParameters: queryParams,
      );

      return response.data['result'] ?? response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Lỗi tải danh sách sân của bạn',
      );
    }
  }

  Future<dynamic> getAllRentalAreas({
    int page = 1,
    int size = 10,
    String? keyword,
    int? provinceCode,
    String? ward,
    String? verificationStatus,
    double? minLat,
    double? maxLat,
    double? minLng,
    double? maxLng,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'size': size,
        if (keyword != null) 'keyword': keyword,
        if (provinceCode != null) 'provinceCode': provinceCode,
        if (ward != null) 'ward': ward,
        if (verificationStatus != null)
          'verificationStatus': verificationStatus,
        if (minLat != null) 'minLat': minLat,
        if (maxLat != null) 'maxLat': maxLat,
        if (minLng != null) 'minLng': minLng,
        if (maxLng != null) 'maxLng': maxLng,
      };

      final response = await apiClient.get(
        _endpoint,
        queryParameters: queryParams,
      );
      return response.data['result'] ?? response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Lỗi tải danh sách khu vực',
      );
    }
  }

  Future<dynamic> createRentalArea(
    Map<String, dynamic> values, {
    List<String>? imagePaths,
  }) async {
    try {
      final formData = FormData.fromMap({
        'userId': values['userId'],
        'rentalAreaName': values['rentalAreaName'],
        'street': values['street'],
        'ward': values['ward'],
        'district': values['district'],
        'cityName': values['cityName'],
        'contactName': values['contactName'],
        'contactPhone': values['contactPhone'],
        'gmail': values['gmail'] ?? '',
        if (values['latitude'] != null)
          'latitude': values['latitude'].toString(),
        if (values['longitude'] != null)
          'longitude': values['longitude'].toString(),
        'openTime': values['openTime'],
        'closeTime': values['closeTime'],
        'facebookLink': values['facebookLink'] ?? '',
      });

      if (imagePaths != null && imagePaths.isNotEmpty) {
        for (var path in imagePaths) {
          formData.files.add(
            MapEntry('images', await MultipartFile.fromFile(path)),
          );
        }
      }

      final response = await apiClient.post(
        _endpoint,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return response.data['result'] ?? response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi tạo khu vực sân');
    }
  }

  Future<dynamic> updateRentalArea(
    String rentalAreaId,
    Map<String, dynamic> request, {
    List<String>? imagePaths,
  }) async {
    try {
      final formData = FormData.fromMap({
        'rentalAreaName': request['rentalAreaName'] ?? '',
        'street': request['address']?['street'] ?? '',
        'ward': request['address']?['ward'] ?? '',
        'contactName': request['contactName'] ?? '',
        'contactPhone': request['contactPhone'] ?? '',
        'cityId': request['cityId']?.toString() ?? '',
        'status': request['status'] ?? '',
      });

      if (imagePaths != null && imagePaths.isNotEmpty) {
        for (var path in imagePaths) {
          formData.files.add(
            MapEntry('images', await MultipartFile.fromFile(path)),
          );
        }
      }

      final response = await apiClient.put(
        '$_endpoint/$rentalAreaId',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return response.data['result'] ?? response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Lỗi cập nhật khu vực sân',
      );
    }
  }

  Future<void> deleteRentalArea(String rentalAreaId) async {
    try {
      await apiClient.delete('$_endpoint/$rentalAreaId');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi xóa khu vực sân');
    }
  }

  Future<void> approveRentalArea(String rentalAreaId) async {
    try {
      await apiClient.put('$_endpoint/$rentalAreaId/approve');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi duyệt khu vực sân');
    }
  }

  Future<void> rejectRentalArea(String rentalAreaId, {String? reason}) async {
    try {
      final payload = reason != null ? {'reason': reason} : {};
      await apiClient.put('$_endpoint/$rentalAreaId/reject', data: payload);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi từ chối khu vực sân');
    }
  }
}

final rentalService = RentalService();
