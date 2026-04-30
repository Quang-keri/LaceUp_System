import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/views/login/login_screen.dart';

Future<void> main() async {
  // 1. Đảm bảo các dịch vụ của Flutter đã sẵn sàng trước khi nạp Env
  WidgetsFlutterBinding.ensureInitialized();

  // 2. Nạp file .env từ thư mục gốc
  // Đảm bảo bạn đã khai báo - .env trong pubspec.yaml
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    print("Error loading .env file: $e");
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LaceUP App', // Đổi tên app cho chuyên nghiệp
      debugShowCheckedModeBanner: false, // Tắt cái banner "DEBUG" ở góc màn hình
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true, // Sử dụng giao diện Material 3 mới nhất
      ),
      home: const LoginScreen(),
    );
  }
}