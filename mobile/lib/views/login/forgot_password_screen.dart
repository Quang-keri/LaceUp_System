import 'dart:async';

import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../utils/error_utils.dart';
import '../../utils/top_message.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final String initialEmail;

  const ForgotPasswordScreen({
    super.key,
    this.initialEmail = '',
  });

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState
    extends State<ForgotPasswordScreen> {
  static const Color primaryColor = Color(0xFF9156F1);

  final GlobalKey<FormState> _formKey =
  GlobalKey<FormState>();

  late final TextEditingController _emailController;

  bool _isLoading = false;
  bool _isEmailSent = false;

  int _resendSeconds = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();

    _emailController = TextEditingController(
      text: widget.initialEmail.trim(),
    );
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Vui lòng nhập địa chỉ email';
    }

    final emailRegex = RegExp(
      r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
    );

    if (!emailRegex.hasMatch(email)) {
      return 'Email không đúng định dạng';
    }

    return null;
  }

  String _maskEmail(String email) {
    final parts = email.split('@');

    if (parts.length != 2) {
      return email;
    }

    final name = parts.first;
    final domain = parts.last;

    if (name.length <= 2) {
      return '${name.substring(0, 1)}***@$domain';
    }

    final firstCharacter = name.substring(0, 1);
    final lastCharacter =
    name.substring(name.length - 1);

    return '$firstCharacter***$lastCharacter@$domain';
  }

  void _startResendCountdown() {
    _resendTimer?.cancel();

    setState(() {
      _resendSeconds = 60;
    });

    _resendTimer = Timer.periodic(
      const Duration(seconds: 1),
          (timer) {
        if (!mounted) {
          timer.cancel();
          return;
        }

        if (_resendSeconds <= 1) {
          timer.cancel();

          setState(() {
            _resendSeconds = 0;
          });

          return;
        }

        setState(() {
          _resendSeconds--;
        });
      },
    );
  }

  Future<void> _sendForgotPasswordEmail({
    bool isResend = false,
  }) async {
    FocusScope.of(context).unfocus();

    final email = _emailController.text.trim();
    final validationMessage = _validateEmail(email);

    if (validationMessage != null) {
      if (!_isEmailSent) {
        _formKey.currentState?.validate();
      } else {
        showTopMessage(
          context,
          validationMessage,
          isError: true,
        );
      }

      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await authService.forgotPassword(email);

      if (!mounted) return;

      setState(() {
        _isEmailSent = true;
      });

      _startResendCountdown();

      showTopMessage(
        context,
        isResend
            ? 'Đã gửi lại email đặt lại mật khẩu'
            : 'Đã gửi hướng dẫn đặt lại mật khẩu',
        isError: false,
      );
    } catch (error) {
      if (!mounted) return;

      showTopMessage(
        context,
        getErrorMessage(error),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _changeEmail() {
    _resendTimer?.cancel();

    setState(() {
      _isEmailSent = false;
      _resendSeconds = 0;
    });
  }

  void _backToLogin() {
    Navigator.pop(
      context,
      _emailController.text.trim(),
    );
  }

  InputDecoration _inputDecoration({
    required String hintText,
    Widget? prefixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon,
      filled: true,
      fillColor: const Color(0xFFEAF2FF),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 17,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: Color(0xFFCDD6E5),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: Color(0xFFCDD6E5),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: primaryColor,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: Colors.redAccent,
          width: 1.4,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: Colors.redAccent,
          width: 1.5,
        ),
      ),
    );
  }

  Widget _buildEmailForm() {
    return Column(
      children: [
        Container(
          width: 78,
          height: 78,
          decoration: BoxDecoration(
            color: primaryColor.withOpacity(0.10),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.lock_reset_rounded,
            color: primaryColor,
            size: 42,
          ),
        ),

        const SizedBox(height: 22),

        const Text(
          'Quên mật khẩu?',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF111827),
          ),
        ),

        const SizedBox(height: 10),

        const Text(
          'Nhập email đã đăng ký. LaceUp sẽ gửi đường dẫn giúp bạn đặt lại mật khẩu.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            height: 1.5,
            color: Color(0xFF6B7280),
          ),
        ),

        const SizedBox(height: 28),

        Form(
          key: _formKey,
          child: TextFormField(
            controller: _emailController,
            validator: _validateEmail,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [
              AutofillHints.email,
            ],
            enabled: !_isLoading,
            decoration: _inputDecoration(
              hintText: 'Email',
              prefixIcon: const Icon(
                Icons.email_outlined,
                color: Color(0xFF64748B),
              ),
            ),
            onFieldSubmitted: (_) {
              if (!_isLoading) {
                _sendForgotPasswordEmail();
              }
            },
          ),
        ),

        const SizedBox(height: 22),

        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: _isLoading
                ? null
                : () => _sendForgotPasswordEmail(),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              disabledBackgroundColor:
              primaryColor.withOpacity(0.55),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
              width: 23,
              height: 23,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: Colors.white,
              ),
            )
                : const Text(
              'Gửi hướng dẫn',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),

        const SizedBox(height: 16),

        TextButton.icon(
          onPressed: _isLoading
              ? null
              : _backToLogin,
          icon: const Icon(
            Icons.arrow_back_rounded,
            size: 19,
          ),
          label: const Text(
            'Quay lại đăng nhập',
            style: TextStyle(
              fontWeight: FontWeight.w700,
            ),
          ),
          style: TextButton.styleFrom(
            foregroundColor: primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessContent() {
    final email = _emailController.text.trim();

    return Column(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: const BoxDecoration(
            color: Color(0xFFEAF8EF),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_read_outlined,
            size: 44,
            color: Color(0xFF16A34A),
          ),
        ),

        const SizedBox(height: 22),

        const Text(
          'Kiểm tra email của bạn',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 27,
            fontWeight: FontWeight.w900,
            color: Color(0xFF111827),
          ),
        ),

        const SizedBox(height: 12),

        const Text(
          'Nếu email này được đăng ký trên LaceUp, bạn sẽ nhận được đường dẫn đặt lại mật khẩu.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            height: 1.5,
            color: Color(0xFF6B7280),
          ),
        ),

        const SizedBox(height: 18),

        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFF4EEFF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2D3FF),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.email_outlined,
                color: primaryColor,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _maskEmail(email),
                  style: const TextStyle(
                    color: Color(0xFF4C1D95),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7E6),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFFFD591),
            ),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline_rounded,
                size: 21,
                color: Color(0xFFD97706),
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Đường dẫn chỉ có hiệu lực trong 15 phút. Hãy kiểm tra cả thư mục Spam hoặc Thư rác.',
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.45,
                    color: Color(0xFF92400E),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _backToLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Quay lại đăng nhập',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),

        const SizedBox(height: 12),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Chưa nhận được email?',
              style: TextStyle(
                color: Color(0xFF6B7280),
              ),
            ),
            TextButton(
              onPressed:
              _resendSeconds > 0 || _isLoading
                  ? null
                  : () {
                _sendForgotPasswordEmail(
                  isResend: true,
                );
              },
              child: _isLoading
                  ? const SizedBox(
                width: 17,
                height: 17,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: primaryColor,
                ),
              )
                  : Text(
                _resendSeconds > 0
                    ? 'Gửi lại sau ${_resendSeconds}s'
                    : 'Gửi lại',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),

        TextButton(
          onPressed: _isLoading
              ? null
              : _changeEmail,
          style: TextButton.styleFrom(
            foregroundColor: primaryColor,
          ),
          child: const Text(
            'Sử dụng email khác',
            style: TextStyle(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F0FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          tooltip: 'Quay lại',
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
          ),
          onPressed: _isLoading
              ? null
              : _backToLogin,
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              22,
              12,
              22,
              28,
            ),
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(
                maxWidth: 500,
              ),
              padding: const EdgeInsets.fromLTRB(
                22,
                34,
                22,
                28,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 22,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: AnimatedSwitcher(
                duration: const Duration(
                  milliseconds: 280,
                ),
                child: _isEmailSent
                    ? KeyedSubtree(
                  key: const ValueKey(
                    'forgot-password-success',
                  ),
                  child: _buildSuccessContent(),
                )
                    : KeyedSubtree(
                  key: const ValueKey(
                    'forgot-password-form',
                  ),
                  child: _buildEmailForm(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}