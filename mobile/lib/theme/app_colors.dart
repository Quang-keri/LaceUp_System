import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF9156F1);
  static const Color primaryLight = Color(0xFFF4EEFF);
  static const Color primaryDark = Color(0xFF7440D9);

  static const Color orange = Color(0xFFEA580C);
  static const Color orangeLight = Color(0xFFFFF3E8);
  static const Color orangeDark = Color(0xFFC2410C);

  static const Color background = Color(0xFFF8F9FC);
  static const Color card = Colors.white;
  static const Color border = Color(0xFFE8DDF4);

  static const Color textPrimary = Color(0xFF9A3412);
  static const Color textSecondary = Color(0xFFB56B42);

  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      primary,
      orange,
    ],
  );

  static const LinearGradient softGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      primaryLight,
      orangeLight,
    ],
  );
}