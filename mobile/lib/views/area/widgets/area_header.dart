import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/views/login/login_screen.dart';
import 'package:mobile/views/login/register_screen.dart';

class AreaHeader extends StatelessWidget {
  const AreaHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(shape: BoxShape.circle),
            clipBehavior: Clip.antiAlias,
            child: Image.asset(
              'assets/logo.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const CircleAvatar(
                radius: 17,
                backgroundColor: Color(0xFF9156F1),
                child: Text('L', style: TextStyle(color: Colors.white)),
              ),
            ),
          ),

          const SizedBox(width: 8),

          Expanded(
            child: Text(
              auth.isLoggedIn ? (auth.userName ?? 'Người dùng') : 'LACE UP',
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF1F2937),
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                fontSize: 16,
              ),
            ),
          ),

          if (auth.loading)
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else if (auth.isLoggedIn)
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF9156F1).withOpacity(0.12),
              child: const Icon(
                Icons.notifications,
                color: Color(0xFF9156F1),
                size: 20,
              ),
            )
          else
            Row(
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                    );
                  },
                  child: const Text('Đăng nhập'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (context) => const RegisterScreen()),
                    );
                  },
                  child: const Text('Đăng ký'),
                ),
              ],
            ),
        ],
      ),
    );
  }
}