import 'package:dio/dio.dart';

import '../models/vietqr_bank.dart';

class VietQrBankService {
  VietQrBankService()
      : _dio = Dio(
    BaseOptions(
      baseUrl: 'https://api.vietqr.io/v2',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
      },
    ),
  );

  final Dio _dio;

  Future<List<VietQrBank>> getBanks() async {
    final response = await _dio.get('/banks');

    final dynamic body = response.data;

    if (body is! Map<String, dynamic>) {
      throw Exception('Dữ liệu ngân hàng VietQR không hợp lệ');
    }

    final dynamic rawData = body['data'];

    if (rawData is! List) {
      throw Exception(
        body['desc']?.toString() ?? 'Không lấy được danh sách ngân hàng',
      );
    }

    final banks = rawData
        .whereType<Map>()
        .map(
          (item) => VietQrBank.fromJson(
        Map<String, dynamic>.from(item),
      ),
    )
        .where(
          (bank) =>
      bank.bin.isNotEmpty &&
          bank.shortName.isNotEmpty &&
          bank.name.isNotEmpty,
    )
        .toList();

    banks.sort(
          (a, b) => a.shortName.toLowerCase().compareTo(
        b.shortName.toLowerCase(),
      ),
    );

    return banks;
  }
}