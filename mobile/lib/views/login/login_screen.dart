// lib/views/login/login_screen.dart

import 'package:flutter/material.dart';
import '../../services/auth_service.dart'; // Nơi chứa singleton authService
import '../../services/user_service.dart'; // Nơi chứa singleton userService
// Nhớ import model UserResponse của bạn
// import '../../models/user.dart';
import '../main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    // Ẩn bàn phím khi bấm đăng nhập
    FocusScope.of(context).unfocus();

    setState(() => _isLoading = true);

    try {
      // 1. Gọi API Login (Dùng biến authService toàn cục)
      // Nếu lỗi (sai pass, mất mạng), nó sẽ tự động văng xuống khối catch
      await authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      // 2. Lấy thông tin cá nhân (Dùng biến userService toàn cục)
      // Hàm này giờ sẽ trả thẳng về model UserResponse (nếu bạn đã áp dụng Model)
      final userInfo = await userService.getMyInfo();

      if (!mounted) return;

      // 3. Chuyển sang MainScreen và truyền dữ liệu
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => MainScreen(userData: userInfo),
        ),
      );
    } catch (e) {
      // 4. Bắt mọi lỗi từ Service ném ra và hiển thị lên UI
      // Hàm replaceAll để xóa chữ "Exception: " mặc định của Dart
      _showErrorSnackBar(e.toString().replaceAll('Exception: ', ''));
    } finally {
      // 5. Khối finally luôn chạy dù thành công hay thất bại để tắt Loading
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating, // Gợi ý: Dùng floating nhìn hiện đại hơn
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng nhập'), centerTitle: true),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 40),
              const Icon(Icons.lock_outline, size: 80, color: Colors.blue),
              const SizedBox(height: 40),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Tài khoản',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _passwordController,
                obscureText: !_isPasswordVisible,
                decoration: InputDecoration(
                  labelText: 'Mật khẩu',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(_isPasswordVisible ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading
                      ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                      : const Text('Đăng nhập'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}