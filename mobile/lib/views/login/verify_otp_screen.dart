import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile/widgets/main_navigation.dart';
import '../../services/auth_service.dart';

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
  final otpController = TextEditingController();

  bool loading = false;
  int secondsLeft = 15 * 60;
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
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (secondsLeft <= 0) {
        timer?.cancel();
        setState(() {});
        return;
      }

      setState(() => secondsLeft--);
    });
  }

  String get timeText {
    final minutes = secondsLeft ~/ 60;
    final seconds = secondsLeft % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> confirmOtp() async {
    final otp = otpController.text.trim();

    if (otp.length != 6) {
      showError('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    if (secondsLeft <= 0) {
      showError('OTP đã hết hạn, vui lòng đăng ký lại');
      goRegisterAgain();
      return;
    }

    setState(() => loading = true);

    try {
      await authService.confirmRegister(
        email: widget.email,
        otp: otp,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đăng ký thành công'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainNavigation()),
            (route) => false,
      );
    } catch (e) {
      showError('Xác thực thất bại, vui lòng đăng ký lại');
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;
      goRegisterAgain();
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void goRegisterAgain() {
    Navigator.pop(context);
  }

  void showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final expired = secondsLeft <= 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác thực OTP'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 32),

              const Icon(
                Icons.mark_email_read_outlined,
                size: 80,
                color: Color(0xFF9156F1),
              ),

              const SizedBox(height: 24),

              const Text(
                'Kiểm tra email của bạn',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 8),

              Text(
                'Nhập mã OTP 6 số đã gửi tới\n${widget.email}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.black54,
                  fontSize: 15,
                ),
              ),

              const SizedBox(height: 28),

              TextField(
                controller: otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 26,
                  letterSpacing: 10,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  counterText: '',
                  hintText: '------',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              Text(
                expired ? 'OTP đã hết hạn' : 'OTP hết hạn sau $timeText',
                style: TextStyle(
                  color: expired ? Colors.red : const Color(0xFF9156F1),
                  fontWeight: FontWeight.w700,
                ),
              ),

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: loading || expired ? null : confirmOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9156F1),
                    foregroundColor: Colors.white,
                  ),
                  child: loading
                      ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                      : const Text('Xác thực'),
                ),
              ),

              const SizedBox(height: 12),

              TextButton(
                onPressed: goRegisterAgain,
                child: const Text('Đăng ký lại'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}