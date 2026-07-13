import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProvinceResponse {
  final int code;
  final String name;

  ProvinceResponse({
    required this.code,
    required this.name,
  });

  factory ProvinceResponse.fromJson(Map<String, dynamic> json) {
    return ProvinceResponse(
      code: json['code'] ?? 0,
      name: json['name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
    };
  }
}

class WardResponse {
  final int code;
  final String name;

  WardResponse({
    required this.code,
    required this.name,
  });

  factory WardResponse.fromJson(Map<String, dynamic> json) {
    return WardResponse(
      code: json['code'] ?? 0,
      name: json['name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
    };
  }
}

class LocationService {
  static const String _baseUrl = 'https://provinces.open-api.vn/api/v2';

  static const String _provincesKey = 'cached_provinces';
  static const String _wardsKey = 'cached_wards';

  late final Dio _dio;

  LocationService() {
    _dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ),
    );
  }

  Future<List<ProvinceResponse>> getProvinces({
    bool forceRefresh = false,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    if (!forceRefresh) {
      final cached = prefs.getString(_provincesKey);

      if (cached != null && cached.isNotEmpty) {
        final List decoded = jsonDecode(cached);
        if (decoded.isNotEmpty) {
          return decoded
              .map((e) => ProvinceResponse.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    }

    final response = await _dio.get('$_baseUrl/p/');

    final List rawData = response.data ?? [];

    final provinces = rawData
        .map((e) => ProvinceResponse.fromJson(e as Map<String, dynamic>))
        .toList();

    await prefs.setString(
      _provincesKey,
      jsonEncode(provinces.map((e) => e.toJson()).toList()),
    );

    return provinces;
  }

  Future<List<WardResponse>> getWardsByProvince(
      int provinceCode, {
        bool forceRefresh = false,
      }) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = '${_wardsKey}_$provinceCode';

    if (!forceRefresh) {
      final cached = prefs.getString(cacheKey);

      if (cached != null && cached.isNotEmpty) {
        final List decoded = jsonDecode(cached);
        if (decoded.isNotEmpty) {
          return decoded
              .map((e) => WardResponse.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    }

    final response = await _dio.get(
      '$_baseUrl/p/$provinceCode',
      queryParameters: {
        'depth': 2,
      },
    );

    final List rawData = response.data?['wards'] ?? [];

    final wards = rawData
        .map((e) => WardResponse.fromJson(e as Map<String, dynamic>))
        .toList();

    await prefs.setString(
      cacheKey,
      jsonEncode(wards.map((e) => e.toJson()).toList()),
    );

    return wards;
  }

  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_provincesKey);

    final keys = prefs.getKeys();

    for (final key in keys) {
      if (key.startsWith(_wardsKey)) {
        await prefs.remove(key);
      }
    }
  }
}

final locationService = LocationService();