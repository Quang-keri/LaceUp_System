// lib/services/court_service.dart

import 'dart:io';
import 'package:dio/dio.dart';
import '../config/api_client.dart';
import '../models/category.dart';
import '../models/court.dart';
import '../models/page_response.dart';

class CourtService {
  final String _endpoint = '/courts';
  final String _courtCopyEndpoint = '/court_copies';

  // Lấy danh sách sân của tôi
  Future<PageResponse<CourtResponse>> getMyCourts({int page = 1, int size = 10, String? keyword}) async {
    Map<String, dynamic> params = {'page': page, 'size': size};
    if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;

    try {
      final response = await apiClient.get('$_endpoint/my-courts', queryParameters: params);
      final resultData = response.data['result'] ?? response.data;
      return PageResponse<CourtResponse>.fromJson(resultData, (json) => CourtResponse.fromJson(json));
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tải danh sách sân của bạn');
    }
  }

  // Lấy danh sách sân theo Khu vực (Rental Area)
  Future<PageResponse<CourtResponse>> getCourtsByRentalArea(String rentalAreaId, {int page = 1, int size = 10, String? keyword}) async {
    Map<String, dynamic> params = {'page': page, 'size': size};
    if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;

    try {
      final response = await apiClient.get('$_endpoint/rental-area/$rentalAreaId', queryParameters: params);
      final resultData = response.data['result'] ?? response.data;
      return PageResponse<CourtResponse>.fromJson(resultData, (json) => CourtResponse.fromJson(json));
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tải danh sách sân');
    }
  }

  // Lấy chi tiết 1 sân
  Future<CourtResponse> getCourtById(String courtId) async {
    try {
      final response = await apiClient.get('$_endpoint/$courtId');
      final resultData = response.data['result'] ?? response.data;
      return CourtResponse.fromJson(resultData);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Không tìm thấy thông tin sân');
    }
  }

  // TẠO SÂN MỚI (CÓ UPLOAD ẢNH)
  Future<dynamic> createCourt({
    required String rentalAreaId,
    required String courtName,
    required String categoryId,
    List<int>? amenityIds,
    List<Map<String, String>>? courtCopyRequests, // Dạng: [{'courtCode': 'A1', 'location': ''}]
    List<File>? images, // Danh sách file ảnh từ thiết bị
  }) async {
    try {
      // 1. Tạo FormData
      FormData formData = FormData.fromMap({
        "rentalAreaId": rentalAreaId,
        "courtName": courtName,
        "categoryId": categoryId,
      });

      // 2. Thêm mảng amenityIds
      if (amenityIds != null) {
        for (var id in amenityIds) {
          formData.fields.add(MapEntry("amenityIds", id.toString()));
        }
      }

      // 3. Thêm danh sách sân con
      if (courtCopyRequests != null) {
        for (int i = 0; i < courtCopyRequests.length; i++) {
          formData.fields.add(MapEntry("courtCopyRequests[$i].courtCode", courtCopyRequests[i]['courtCode'] ?? ''));
          formData.fields.add(MapEntry("courtCopyRequests[$i].location", courtCopyRequests[i]['location'] ?? ''));
        }
      }

      // 4. Đính kèm Files Ảnh
      if (images != null) {
        for (var file in images) {
          String fileName = file.path.split('/').last;
          formData.files.add(MapEntry(
            "images",
            await MultipartFile.fromFile(file.path, filename: fileName),
          ));
        }
      }

      // 5. Gửi request
      final response = await apiClient.post(
        _endpoint,
        data: formData,
        options: Options(headers: {"Content-Type": "multipart/form-data"}),
      );
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tạo sân');
    }
  }

  // CẬP NHẬT SÂN (CÓ UPLOAD ẢNH)
  Future<dynamic> updateCourt({
    required String courtId,
    String? courtName,
    String? categoryId,
    double? pricePerHour,
    List<String>? courtCodes,
    List<File>? images,
  }) async {
    try {
      FormData formData = FormData();

      if (courtName != null) formData.fields.add(MapEntry("courtName", courtName));
      if (categoryId != null) formData.fields.add(MapEntry("categoryId", categoryId));
      if (pricePerHour != null) formData.fields.add(MapEntry("pricePerHour", pricePerHour.toString()));

      if (courtCodes != null) {
        for (int i = 0; i < courtCodes.length; i++) {
          formData.fields.add(MapEntry("courtCodes[$i]", courtCodes[i]));
        }
      }

      if (images != null) {
        for (var file in images) {
          formData.files.add(MapEntry(
            "images",
            await MultipartFile.fromFile(file.path, filename: file.path.split('/').last),
          ));
        }
      }

      final response = await apiClient.put(
        '$_endpoint/$courtId',
        data: formData,
        options: Options(headers: {"Content-Type": "multipart/form-data"}),
      );
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi cập nhật sân');
    }
  }

  // Xóa sân
  Future<void> deleteCourt(String courtId) async {
    try {
      await apiClient.delete('$_endpoint/$courtId');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi xóa sân');
    }
  }

  // Lấy danh sách danh mục (Bóng đá, Cầu lông...)
  Future<List<CategoryResponse>> getCategories() async {
    try {
      final response = await apiClient.get('/categories');
      final List<dynamic> resultData = response.data['result'] ?? response.data['data'] ?? [];
      return resultData.map((i) => CategoryResponse.fromJson(i)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi tải danh mục');
    }
  }

  // ================= COURT COPY (SÂN CON) API =================

  Future<dynamic> createCourtCopy(String courtId, String courtCode) async {
    try {
      final response = await apiClient.post(_courtCopyEndpoint, data: {
        'courtId': courtId,
        'courtCode': courtCode,
      });
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi thêm sân con');
    }
  }

  Future<dynamic> updateCourtCopy(String courtCopyId, String courtId, String courtCode, String status) async {
    try {
      final response = await apiClient.put('$_courtCopyEndpoint/$courtCopyId', data: {
        'courtId': courtId,
        'courtCode': courtCode,
        'status': status,
      });
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi cập nhật sân con');
    }
  }

  Future<void> deleteCourtCopy(String courtCopyId) async {
    try {
      await apiClient.delete('$_courtCopyEndpoint/$courtCopyId');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi xóa sân con');
    }
  }

  // Kiểm tra lịch trống
  Future<bool> checkCourtCopyAvailability(String courtCopyId, String start, String end, {String? excludeSlotId}) async {
    Map<String, dynamic> params = {'start': start, 'end': end};
    if (excludeSlotId != null) params['excludeSlotId'] = excludeSlotId;

    try {
      final response = await apiClient.get(
        '$_courtCopyEndpoint/$courtCopyId/availability',
        queryParameters: params,
      );
      // Giả sử API trả về { "result": true/false }
      return response.data['result'] == true;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi kiểm tra lịch trống');
    }
  }
}

final courtService = CourtService();