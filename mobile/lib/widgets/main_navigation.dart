import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:mobile/views/area/area_list_screen.dart';
import 'package:mobile/views/area/community_screen.dart';
import 'package:mobile/views/area/news_screen.dart';
import 'package:mobile/views/profile/profile_screen.dart';



class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const AreaListScreen(),
    CommunityScreen(),
    NewsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: CurvedNavigationBar(
        index: _selectedIndex,
        backgroundColor: Colors.transparent,
        color: const Color(0xFF9156F1),
        buttonBackgroundColor:const Color(0xFF9156F1),
        height: 65,
        animationDuration: const Duration(milliseconds: 300),
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          Icon(Icons.home, size: 28, color: Colors.white),
          Icon(Icons.groups, size: 28, color: Colors.white),
          Icon(Icons.article, size: 28, color: Colors.white),
          Icon(Icons.person, size: 28, color: Colors.white),
        ],
      ),
    );
  }
}