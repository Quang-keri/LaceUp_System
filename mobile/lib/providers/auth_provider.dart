import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/user_local_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? user;
  bool loading = true;

  bool get isLoggedIn => user != null;
  String? get userName => user?['userName']?.toString();

  Future<void> loadUser() async {
    try {
      user = await userLocalService.getUser();
    } catch (e) {
      debugPrint('Error loading local user: $e');
      user = null;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> setUser(Map<String, dynamic> userInfo) async {
    user = userInfo;
    await userLocalService.saveUser(userInfo);
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await authService.logout();
      await userLocalService.clearUser();
    } catch (e) {
      debugPrint('Error during logout: $e');
    } finally {
      user = null;
      notifyListeners();
    }
  }
}