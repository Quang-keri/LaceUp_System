import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/user_local_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? user;

  bool loading = true;

  bool get isLoggedIn => user != null;

  String? get userName =>
      user?['userName']?.toString();

  String? get userId =>
      user?['userId']?.toString();

  String get authProvider {
    final dynamic rawProvider =
        user?['provider'] ?? user?['authProvider'];

    return rawProvider
        ?.toString()
        .trim()
        .toUpperCase() ??
        'LOCAL';
  }

  String get role {
    final dynamic rawRole = user?['role'];

    if (rawRole is Map) {
      return rawRole['roleName']
          ?.toString()
          .trim()
          .toUpperCase() ??
          '';
    }

    return rawRole
        ?.toString()
        .trim()
        .toUpperCase() ??
        '';
  }

  bool get isGoogleAccount =>
      authProvider == 'GOOGLE';

  bool get requiresPasswordForDeletion =>
      authProvider == 'LOCAL' ||
          authProvider == 'BOTH';

  Future<void> loadUser() async {
    loading = true;

    try {
      user = await userLocalService.getUser();

    } catch (e) {
      user = null;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> setUser(
      Map<String, dynamic> userInfo,
      ) async {
    user = userInfo;

    await userLocalService.saveUser(userInfo);

    loading = false;
    notifyListeners();
  }


  Future<void> clearLocalSession() async {
    try {
      await userLocalService.clearUser();
    } catch (e) {
      debugPrint(
        'Không thể xóa dữ liệu user local: $e',
      );
    } finally {
      user = null;
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await authService.logout();
    } catch (e) {

      debugPrint('Backend logout thất bại: $e');
    } finally {
      await clearLocalSession();
    }
  }
}