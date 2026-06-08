import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/views/login/login_screen.dart';
import 'package:mobile/views/login/register_screen.dart';

class AreaHeader extends StatelessWidget {
  const AreaHeader({super.key});

  static const Color _primaryColor = Color(0xFF9156F1);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Image.asset(
              'assets/logo_lace_up.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) {
                return const CircleAvatar(
                  backgroundColor: _primaryColor,
                  child: Text(
                    'L',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(width: 9),
          Expanded(
            child: Text(
              auth.isLoggedIn
                  ? "Xin chào ${auth.userName ?? 'Người dùng'}"
                  : 'LACE UP',

              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: auth.isLoggedIn
                    ? const Color(0xFF1F2937)
                    : _primaryColor,
                fontWeight: FontWeight.w700,
                fontSize: auth.isLoggedIn ? 16 : 17,
              ),
            ),
          ),

          if (auth.loading)
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: _primaryColor,
              ),
            )
          else if (auth.isLoggedIn)
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: _primaryColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_outlined,
                color: _primaryColor,
                size: 21,
              ),
            )
          else
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: _primaryColor,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  child: const Text(
                    'Đăng nhập',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),

                const SizedBox(width: 4),

                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    );
                  },
                  child: const Text(
                    'Đăng ký',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
