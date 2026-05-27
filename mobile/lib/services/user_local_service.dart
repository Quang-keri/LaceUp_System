import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class UserLocalService {
  static const String userKey = 'current_user';

  Future<void> saveUser(dynamic user) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      userKey,
      jsonEncode(user),
    );
  }

  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();

    final userString = prefs.getString(userKey);

    if (userString == null) return null;

    return jsonDecode(userString);
  }

  Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(userKey);
  }
}

final userLocalService = UserLocalService();