import 'package:flutter/material.dart';
import 'package:mobile/models/account_deletion.dart';
import 'package:mobile/services/account_deletion_service.dart';

class DeleteAccountDialog extends StatefulWidget {
  final AccountDeletionService service;
  final String authProvider;
  final String role;

  const DeleteAccountDialog({
    super.key,
    required this.service,
    required this.authProvider,
    required this.role,
  });

  @override
  State<DeleteAccountDialog> createState() =>
      _DeleteAccountDialogState();
}

class _DeleteAccountDialogState
    extends State<DeleteAccountDialog> {
  final TextEditingController _passwordController =
  TextEditingController();

  final TextEditingController _reasonController =
  TextEditingController();

  final TextEditingController _confirmationController =
  TextEditingController();

  bool _isLoading = false;
  bool _hidePassword = true;
  String? _errorMessage;

  bool get _requiresPassword {
    final provider =
    widget.authProvider.trim().toUpperCase();


    return provider != 'GOOGLE';
  }

  bool get _isOwner =>
      widget.role.trim().toUpperCase() == 'OWNER';

  @override
  void dispose() {
    _passwordController.dispose();
    _reasonController.dispose();
    _confirmationController.dispose();

    super.dispose();
  }
  Future<bool> _showFinalDeleteConfirmation() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (confirmContext) {
        return PopScope(
          canPop: false,
          child: AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
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
                    'Bạn có chắc chắn?',
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
                    'Bạn đang chuẩn bị gửi yêu cầu xóa tài khoản.',
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.4,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 14),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.red.shade200,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildWarningItem(
                          'Bạn sẽ không thể đăng nhập lại bằng tài khoản này.',
                        ),
                        const SizedBox(height: 10),
                        _buildWarningItem(
                          'Thông tin cá nhân và quyền truy cập tài khoản sẽ bị xóa.',
                        ),
                        const SizedBox(height: 10),
                        _buildWarningItem(
                          'Tài khoản sau khi xóa thành công sẽ không thể khôi phục.',
                        ),

                        if (_isOwner) ...[
                          const SizedBox(height: 10),
                          _buildWarningItem(
                            'Yêu cầu của chủ sân có thể phải chờ xử lý nếu còn lịch đặt, trận đấu hoặc đối soát chưa hoàn tất.',
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  Text(
                    _isOwner
                        ? 'Hệ thống sẽ kiểm tra các sân, lịch đặt, trận đấu và đối soát trước khi quyết định xóa tài khoản.'
                        : 'Sau khi xác nhận, yêu cầu sẽ được gửi đến hệ thống để xử lý ngay.',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(confirmContext).pop(false);
                },
                child: const Text('Không, quay lại'),
              ),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  Navigator.of(confirmContext).pop(true);
                },
                icon: const Icon(
                  Icons.delete_forever_outlined,
                ),
                label: const Text(
                  'Vẫn xóa tài khoản',
                ),
              ),
            ],
          ),
        );
      },
    );

    return result ?? false;
  }

  Widget _buildWarningItem(String text) {
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
            style: TextStyle(
              color: Colors.red.shade800,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    final confirmation =
    _confirmationController.text.trim().toUpperCase();

    if (_requiresPassword &&
        _passwordController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập mật khẩu hiện tại';
      });

      return;
    }

    if (confirmation != 'XOA') {
      setState(() {
        _errorMessage =
        'Vui lòng nhập chính xác XOA để xác nhận';
      });

      return;
    }

    final confirmed =
    await _showFinalDeleteConfirmation();

    if (!mounted || !confirmed) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result =
      await widget.service.requestAccountDeletion(
        password: _requiresPassword
            ? _passwordController.text.trim()
            : null,
        reason: _reasonController.text.trim(),
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
        'Không thể xóa tài khoản. Vui lòng thử lại.';
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
        titlePadding:
        const EdgeInsets.fromLTRB(24, 24, 24, 8),
        contentPadding:
        const EdgeInsets.fromLTRB(24, 8, 24, 12),
        actionsPadding:
        const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: const Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: Colors.red,
              size: 28,
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Xóa tài khoản',
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
            crossAxisAlignment:
            CrossAxisAlignment.start,
            children: [
              Text(
                _isOwner
                    ? 'Tài khoản chủ sân chỉ được xóa hoàn tất '
                    'sau khi sân đã đóng hoặc chuyển quyền, '
                    'không còn lịch đặt, trận đấu và đối soát '
                    'đang xử lý.'
                    : 'Thông tin cá nhân và quyền đăng nhập của bạn '
                    'sẽ bị xóa. Hành động này không thể hoàn tác.',
                style: const TextStyle(
                  height: 1.45,
                  color: Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 16),

              if (_requiresPassword) ...[
                TextField(
                  controller: _passwordController,
                  obscureText: _hidePassword,
                  enabled: !_isLoading,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu hiện tại',
                    hintText: 'Nhập mật khẩu hiện tại',
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(
                      Icons.lock_outline,
                    ),
                    suffixIcon: IconButton(
                      onPressed: _isLoading
                          ? null
                          : () {
                        setState(() {
                          _hidePassword =
                          !_hidePassword;
                        });
                      },
                      icon: Icon(
                        _hidePassword
                            ? Icons.visibility_outlined
                            : Icons
                            .visibility_off_outlined,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ] else ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4EEFF),
                    borderRadius:
                    BorderRadius.circular(12),
                  ),
                  child: const Row(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.g_mobiledata_rounded,
                        color: Color(0xFF9156F1),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Bạn đang sử dụng tài khoản Google. '
                              'Yêu cầu xóa sẽ được xác thực bằng '
                              'phiên đăng nhập hiện tại.',
                          style: TextStyle(
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              TextField(
                controller: _reasonController,
                enabled: !_isLoading,
                maxLines: 3,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText:
                  'Lý do xóa (không bắt buộc)',
                  hintText:
                  'Cho chúng tôi biết lý do bạn rời đi',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 4),

              const Text(
                'Nhập "XOA" để xác nhận:',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _confirmationController,
                enabled: !_isLoading,
                textCapitalization:
                TextCapitalization.characters,
                decoration: const InputDecoration(
                  hintText: 'XOA',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(
                    Icons.delete_forever_outlined,
                  ),
                ),
                onChanged: (_) {
                  if (_errorMessage != null) {
                    setState(() {
                      _errorMessage = null;
                    });
                  }
                },
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius:
                    BorderRadius.circular(10),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontWeight: FontWeight.w500,
                    ),
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
            child: const Text('Quay lại'),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: _isLoading ? null : _submit,
            icon: _isLoading
                ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
                : const Icon(
              Icons.delete_forever_outlined,
            ),
            label: Text(
              _isLoading
                  ? 'Đang xử lý...'
                  : 'Xóa tài khoản',
            ),
          ),
        ],
      ),
    );
  }
}
