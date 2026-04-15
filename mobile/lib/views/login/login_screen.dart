import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../services/user_service.dart';
import '../main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final AuthService _authService = AuthService(); // Khởi tạo Service

  bool _isPasswordVisible = false;
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);

    // 1. Gọi API Login
    final loginResult = await _authService.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (loginResult['success']) {
      // 2. Nếu login OK, gọi tiếp API lấy thông tin cá nhân
      final UserService userService = UserService();
      final infoResult = await userService.getMyInfo();

      setState(() => _isLoading = false);

      if (infoResult['success']) {
        if (!mounted) return;

        // Lưu thông tin user vào bộ nhớ tạm hoặc Provider/Bloc nếu cần
        // Ví dụ: chuyển sang MainScreen và truyền dữ liệu user
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => MainScreen(userData: infoResult['data']),
          ),
        );
      } else {
        _showErrorSnackBar(infoResult['message']);
      }
    } else {
      setState(() => _isLoading = false);
      _showErrorSnackBar(loginResult['message']);
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
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
    // Giữ nguyên phần UI Build cũ của bạn ở đây...
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
                      ? const CircularProgressIndicator(color: Colors.white)
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