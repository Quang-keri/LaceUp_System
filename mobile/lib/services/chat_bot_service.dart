import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

import '../utils/constants.dart';

class ChatBotService {
  static Future<String> asking(String message) async {
    try {
      final url = Uri.parse(AppConstants.chatBotUrl);

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'message': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(utf8.decode(response.bodyBytes));

        final resultText = responseData['result'] ?? responseData['data'];

        if (resultText != null) {
          return resultText.toString();
        } else {
          return "Bot không trả về nội dung hợp lệ.";
        }
      } else {
        throw Exception('Lỗi API');
      }
    } catch (e) {
      throw Exception('Không thể kết nối đến máy chủ.');
    }
  }
}