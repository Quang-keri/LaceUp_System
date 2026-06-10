import 'package:flutter/material.dart';
import 'package:mobile/models/account_deletion.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/services/account_deletion_service.dart';
import 'package:mobile/widgets/main_navigation.dart';
import 'package:provider/provider.dart';

// Chỉ mở import này nếu dự án đã cài google_sign_in.
// import 'package:google_sign_in/google_sign_in.dart';

import 'widgets/delete_account_dialog.dart';

const Color _primaryColor = Color(0xFF9156F1);

String _resolveAuthProvider(
    Map<String, dynamic>? user,
    ) {
  final rawProvider =
      user?['provider'] ??
          user?['authProvider'] ??
          'LOCAL';

  return rawProvider.toString().toUpperCase();
}

String _resolveRole(
    Map<String, dynamic>? user,
    ) {
  final rawRole = user?['role'];

  if (rawRole is Map) {
    return (rawRole['roleName'] ?? '')
        .toString()
        .toUpperCase();
  }

  return rawRole?.toString().toUpperCase() ?? '';
}

Future<void> _showDeleteAccountSuccessDialog(
    BuildContext context, {
      required String message,
    }) async {
  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return PopScope(
        canPop: false,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          contentPadding: const EdgeInsets.fromLTRB(
            24,
            28,
            24,
            16,
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFFA7F3D0),
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Color(0xFF10B981),
                  size: 46,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Xóa tài khoản thành công',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                message.trim().isNotEmpty
                    ? message
                    : 'Tài khoản của bạn đã được xóa khỏi hệ thống.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4EEFF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.logout_rounded,
                      color: _primaryColor,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Phiên đăng nhập hiện tại sẽ kết thúc và bạn sẽ được chuyển về trang đăng nhập.',
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actionsPadding: const EdgeInsets.fromLTRB(
            20,
            0,
            20,
            20,
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: _primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                icon: const Icon(
                  Icons.home_outlined ,
                  size: 20,
                ),
                label: const Text(
                  'Về trang chủ',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    },
  );
}

Future<void> _showWaitingDeletionDialog(
    BuildContext context, {
      required DeleteAccountResponse result,
    }) async {
  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        titlePadding: const EdgeInsets.fromLTRB(
          24,
          24,
          24,
          8,
        ),
        contentPadding: const EdgeInsets.fromLTRB(
          24,
          8,
          24,
          12,
        ),
        actionsPadding: const EdgeInsets.fromLTRB(
          20,
          0,
          20,
          20,
        ),
        title: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.schedule_outlined,
              color: Colors.orange,
              size: 28,
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Yêu cầu đã được ghi nhận',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                result.message.trim().isNotEmpty
                    ? result.message
                    : 'Yêu cầu xóa tài khoản của bạn đang được hệ thống kiểm tra.',
                style: const TextStyle(
                  height: 1.45,
                  color: Color(0xFF4B5563),
                ),
              ),
              if (result.blockers.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFFED7AA),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bạn cần xử lý:',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF9A3412),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...result.blockers.map(
                            (blocker) => Padding(
                          padding: const EdgeInsets.only(
                            bottom: 10,
                          ),
                          child: Row(
                            crossAxisAlignment:
                            CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 1),
                                child: Icon(
                                  Icons.info_outline_rounded,
                                  size: 19,
                                  color: Colors.orange,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  blocker,
                                  style: const TextStyle(
                                    height: 1.4,
                                    color: Color(0xFF7C2D12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 46,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: const Text(
                'Đã hiểu',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      );
    },
  );
}


void _showDeleteAccountError(
    BuildContext context,
    String message,
    ) {
  final messenger = ScaffoldMessenger.of(context);

  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFFB91C1C),
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        content: Row(
          children: [
            const Icon(
              Icons.error_outline_rounded,
              color: Colors.white,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
}

Future<void> openDeleteAccountFlow(
    BuildContext context, {
      required AccountDeletionService service,
    }) async {
  final authProvider = context.read<AuthProvider>();

  final Map<String, dynamic>? user = authProvider.user;

  final loginProvider = _resolveAuthProvider(user);
  final role = _resolveRole(user);

  final result = await showDialog<DeleteAccountResponse>(
    context: context,
    barrierDismissible: false,
    builder: (_) {
      return DeleteAccountDialog(
        service: service,
        role: role,
      );
    },
  );

  if (result == null || !context.mounted) {
    return;
  }


  if (result.isWaiting) {
    await _showWaitingDeletionDialog(
      context,
      result: result,
    );

    return;
  }

  if (!result.isCompleted) {
    _showDeleteAccountError(
      context,
      result.message.trim().isNotEmpty
          ? result.message
          : 'Không thể hoàn tất xóa tài khoản.',
    );

    return;
  }

  await _showDeleteAccountSuccessDialog(
    context,
    message: result.message,
  );

  if (!context.mounted) {
    return;
  }


  final navigator = Navigator.of(context);

  if (loginProvider == 'GOOGLE' ||
      loginProvider == 'BOTH') {
    try {
      // Mở dòng dưới nếu dự án đã sử dụng google_sign_in.
      // await GoogleSignIn().signOut();
    } catch (_) {

    }
  }

  authProvider.logout();

  navigator.pushAndRemoveUntil(
    MaterialPageRoute(
      builder: (_) => const MainNavigation(),
    ),
        (route) => false,
  );
}