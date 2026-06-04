import 'dart:async';

import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import 'login_screen.dart';

class VerifyOtpScreen extends StatefulWidget {
  final String email;

  const VerifyOtpScreen({
    super.key,
    required this.email,
  });

  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  static const Color primaryColor = Color(0xFF9156F1);

  final otpController = TextEditingController();

  bool loadingConfirm = false;
  bool loadingResend = false;

  int secondsLeft = 5 * 60;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  @override
  void dispose() {
    timer?.cancel();
    otpController.dispose();
    super.dispose();
  }

  void startTimer() {
    timer?.cancel();

    setState(() {
      secondsLeft = 5 * 60;
    });

    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;

      if (secondsLeft <= 1) {
        timer?.cancel();
        setState(() {
          secondsLeft = 0;
        });
        return;
      }

      setState(() {
        secondsLeft--;
      });
    });
  }

  String get timeText {
    final minutes = secondsLeft ~/ 60;
    final seconds = secondsLeft % 60;

    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> confirmOtp() async {
    final otp = otpController.text.trim();

    if (secondsLeft <= 0) {
      showError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
      return;
    }

    if (otp.isEmpty) {
      showError('Vui lòng nhập mã OTP');
      return;
    }

    if (otp.length != 6) {
      showError('Mã OTP phải gồm đủ 6 số');
      return;
    }

    setState(() => loadingConfirm = true);

    try {
      await authService.confirmRegister(
        email: widget.email,
        otp: otp,
      );

      if (!mounted) return;

      showSuccess('Đăng ký tài khoản thành công');

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => const LoginScreen(),
        ),
            (route) => false,
      );
    } catch (e) {
      if (!mounted) return;

      showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => loadingConfirm = false);
      }
    }
  }

  Future<void> resendOtp() async {
    if (loadingResend) return;

    setState(() => loadingResend = true);

    try {
      await authService.resendRegisterOtp(widget.email);

      if (!mounted) return;

      otpController.clear();
      showSuccess('Mã OTP mới đã được gửi tới email của bạn');

      startTimer();
    } catch (e) {
      if (!mounted) return;

      showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => loadingResend = false);
      }
    }
  }

  void goBack() {
    Navigator.pop(context);
  }

  void showError(String message) {
    ScaffoldMessenger.of(context).clearSnackBars();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  void showSuccess(String message) {
    ScaffoldMessenger.of(context).clearSnackBars();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final expired = secondsLeft <= 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F6FF),
      appBar: AppBar(
        title: const Text('Xác thực OTP'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),

                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mark_email_read_outlined,
                    size: 52,
                    color: primaryColor,
                  ),
                ),

                const SizedBox(height: 24),

                const Text(
                  'Kiểm tra email của bạn',
                  style: TextStyle(
                    fontSize: 23,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 10),

                Text(
                  'Nhập mã OTP 6 số đã gửi tới',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontSize: 15,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  widget.email,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: primaryColor,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 28),

                TextField(
                  controller: otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  enabled: !loadingConfirm,
                  style: const TextStyle(
                    fontSize: 26,
                    letterSpacing: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '------',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(
                        color: primaryColor,
                        width: 1.5,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: expired
                        ? const Color(0xFFFFEBEE)
                        : const Color(0xFFF4EEFF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: expired
                          ? Colors.red.shade200
                          : primaryColor.withOpacity(0.25),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 19,
                        color: expired ? Colors.red : primaryColor,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        expired
                            ? 'OTP đã hết hạn'
                            : 'OTP còn hiệu lực: $timeText',
                        style: TextStyle(
                          color: expired ? Colors.red : primaryColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed:
                    loadingConfirm || expired ? null : confirmOtp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: loadingConfirm
                        ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                        : const Text(
                      'Xác thực',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 14),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: loadingResend ? null : resendOtp,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: primaryColor,
                      side: const BorderSide(color: primaryColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: loadingResend
                        ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                      ),
                    )
                        : Text(
                      expired ? 'Gửi lại mã OTP' : 'Gửi lại mã mới',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFFDBA74),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 20,
                        color: Color(0xFFEA580C),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Mã OTP có hiệu lực trong 5 phút. Nếu không thấy email, hãy kiểm tra mục Spam hoặc Thư rác.',
                          style: TextStyle(
                            color: Colors.orange.shade800,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                TextButton(
                  onPressed: loadingConfirm ? null : goBack,
                  child: const Text('Quay lại đăng ký'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}