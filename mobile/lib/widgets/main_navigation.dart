import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:mobile/views/area/area_list_screen.dart';
import 'package:mobile/views/map/map_screen.dart';
import 'package:mobile/views/match/match_page.dart';
import 'package:mobile/views/news/news_screen.dart';
import 'package:mobile/views/profile/profile_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
     AreaListScreen(),
    const MapScreen(),
    const MatchPage(),
    const NewsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,

      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),

      bottomNavigationBar: CurvedNavigationBar(
        index: _selectedIndex,

        backgroundColor: Colors.transparent,

        color: const Color(0xFF9156F1),

        buttonBackgroundColor: const Color(0xFF9156F1),

        height: 62,

        animationDuration: const Duration(milliseconds: 250),

        letIndexChange: (index) => true,

        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },

        items: [
          const Icon(
            Icons.home_rounded,
            size: 26,
            color: Colors.white,
          ),

          const Icon(
            Icons.location_on_rounded,
            size: 26,
            color: Colors.white,
          ),

          Container(
            height: 46,
            width: 46,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.groups_rounded,
                size: 28,
                color: Color(0xFF9156F1),
              ),
            ),
          ),

          const Icon(
            Icons.article_rounded,
            size: 26,
            color: Colors.white,
          ),

          const Icon(
            Icons.person_rounded,
            size: 26,
            color: Colors.white,
          ),
        ],
      ),
    );
  }
}