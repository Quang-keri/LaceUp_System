import 'package:flutter/material.dart';

import '../views/profile/profile_main_screen.dart';

class CustomHeader extends StatelessWidget implements PreferredSizeWidget {
  const CustomHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      // Để header phẳng, giống giao diện web
      title: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Thay Icon này bằng Image.asset nếu bạn có file logo
          Icon(Icons.sports_volleyball, color: Colors.deepPurpleAccent),
          SizedBox(width: 8),
          Text(
            'LaceUp',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              fontSize: 22,
            ),
          ),
        ],
      ),
      centerTitle: true,

      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 16.0),
          child: GestureDetector(
            onTap: () {
              // Điều hướng sang trang Profile khi bấm vào Avatar
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ProfilePage(),
                ),
              );
            },
            child: const CircleAvatar(
              radius: 18,
              backgroundColor: Colors.deepPurpleAccent,
              // Tạm thời dùng icon, sau này bạn thay bằng NetworkImage(url)
              child: Icon(Icons.person, size: 24, color: Colors.white),
            ),
          ),
        ),
      ],

      // TabBar nằm ở bottom của AppBar
      bottom: const TabBar(
        indicatorColor: Colors.deepPurpleAccent,
        labelColor: Colors.deepPurpleAccent,
        unselectedLabelColor: Colors.grey,
        tabs: [
          Tab(text: 'Sân'),
          Tab(text: 'Cộng đồng'),
        ],
      ),
    );
  }

  // Bắt buộc phải override preferredSize để Scaffold biết chiều cao của AppBar
  @override
  Size get preferredSize =>
      const Size.fromHeight(kToolbarHeight + kTextTabBarHeight);
}
