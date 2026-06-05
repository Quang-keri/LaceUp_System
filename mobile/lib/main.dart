import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/views/match/in_profile_page/my_match_screen.dart';
import 'package:mobile/widgets/main_navigation.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Error loading .env file: $e");
  }

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

      // Ngôn ngữ mặc định của ứng dụng
      locale: const Locale('vi', 'VN'),

      supportedLocales: const [
        Locale('vi', 'VN'),
        Locale('en', 'US'),
      ],

      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF9156F1),
        ),
        useMaterial3: true,
      ),

      home: const MainNavigation(),

      routes: {
        '/my-matches': (context) => const MyMatchScreen(),
      },
    );
  }
}