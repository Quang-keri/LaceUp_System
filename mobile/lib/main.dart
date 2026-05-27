import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'package:mobile/widgets/main_navigation.dart';
import 'package:mobile/providers/auth_provider.dart';

Future<void> main() async {
  // 1. Đảm bảo các dịch vụ hệ thống của Flutter được khởi tạo trước
  WidgetsFlutterBinding.ensureInitialized();

  // 2. Load file cấu hình môi trường .env
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Error loading .env file: $e");
  }

  // 3. Bọc AuthProvider ở bậc cao nhất (NGOÀI MyApp) để toàn bộ các Route/Màn hình đều dùng được
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider()..loadUser(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LaceUp',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MainNavigation(),
    );
  }
}