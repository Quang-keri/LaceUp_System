import 'package:flutter/material.dart';
import 'package:mobile/views/profile/profile_screen.dart';


class CustomHeader extends StatelessWidget implements PreferredSizeWidget {
  const CustomHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      title: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
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
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ProfileScreen(),
                ),
              );
            },
            child: const CircleAvatar(
              radius: 18,
              backgroundColor: Colors.deepPurpleAccent,
              child: Icon(Icons.person, size: 24, color: Colors.white),
            ),
          ),
        ),
      ],

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

  @override
  Size get preferredSize =>
      const Size.fromHeight(kToolbarHeight + kTextTabBarHeight);
}
