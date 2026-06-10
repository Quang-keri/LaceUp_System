import 'package:flutter/material.dart';
import 'package:mobile/models/account_deletion.dart';
import 'package:mobile/services/account_deletion_service.dart';

class DeleteAccountDialog extends StatefulWidget {
  final AccountDeletionService service;
  final String role;

  const DeleteAccountDialog({
    super.key,
    required this.service,
    required this.role,
  });

  @override
  State<DeleteAccountDialog> createState() =>
      _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<DeleteAccountDialog> {
  bool _isLoading = false;
  String? _errorMessage;

  bool get _isOwner =>
      widget.role.trim().toUpperCase() == 'OWNER';

  Future<void> _confirmDelete() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result =
      await widget.service.requestAccountDeletion(
      );

      if (!mounted) return;

      Navigator.of(context).pop(result);
    } on AccountDeletionException catch (error) {
      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _errorMessage = error.message;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _errorMessage =
        'Không thể gửi yêu cầu xóa tài khoản. Vui lòng thử lại.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_isLoading,
      child: AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
        contentPadding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: Colors.red,
              size: 30,
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Xác nhận xóa tài khoản',
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
              const Text(
                'Bạn có chắc chắn muốn xóa tài khoản không?',
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFECACA),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _WarningItem(
                      text:
                      'Bạn sẽ không thể đăng nhập lại bằng tài khoản này.',
                    ),
                    const SizedBox(height: 10),
                    const _WarningItem(
                      text:
                      'Thông tin cá nhân và quyền truy cập tài khoản sẽ bị xóa.',
                    ),
                    const SizedBox(height: 10),
                    const _WarningItem(
                      text:
                      'Tài khoản đã xóa không thể khôi phục.',
                    ),
                    if (_isOwner) ...[
                      const SizedBox(height: 10),
                      const _WarningItem(
                        text:
                        'Tài khoản chủ sân có thể phải chờ nếu còn lịch đặt, trận đấu hoặc đối soát chưa hoàn tất.',
                      ),
                    ],
                  ],
                ),
              ),
              if (_isOwner) ...[
                const SizedBox(height: 14),
                const Text(
                  'Hệ thống sẽ kiểm tra các nghĩa vụ còn tồn tại trước khi hoàn tất việc xóa tài khoản.',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    height: 1.4,
                  ),
                ),
              ],
              if (_errorMessage != null) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(11),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFFB91C1C),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Color(0xFFB91C1C),
                            fontWeight: FontWeight.w500,
                            height: 1.4,
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
          TextButton(
            onPressed: _isLoading
                ? null
                : () {
              Navigator.of(context).pop();
            },
            child: const Text('Hủy'),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: _isLoading ? null : _confirmDelete,
            icon: _isLoading
                ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
                : const Icon(Icons.delete_forever_outlined),
            label: Text(
              _isLoading
                  ? 'Đang xử lý...'
                  : 'Xác nhận xóa',
            ),
          ),
        ],
      ),
    );
  }
}

class _WarningItem extends StatelessWidget {
  final String text;

  const _WarningItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 2),
          child: Icon(
            Icons.close_rounded,
            color: Colors.red,
            size: 18,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF991B1B),
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}
