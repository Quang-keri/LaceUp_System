import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile/views/area/area_list_screen.dart';
import 'package:mobile/views/map/map_screen.dart';
import 'package:mobile/views/match/match_page.dart';
import 'package:mobile/views/news/news_screen.dart';
import 'package:mobile/views/profile/profile_screen.dart';

import 'chatbot_bubble.dart';

const Color _primaryColor = Color(0xFF9156F1);

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

  void _onNavigationTap(int index) {
    if (_selectedIndex == index) {
      return;
    }

    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final double bottomSafeArea = MediaQuery.paddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,

        systemNavigationBarColor: _primaryColor,
        systemNavigationBarDividerColor: _primaryColor,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarContrastEnforced: false,
      ),
      child: Scaffold(
        extendBody: true,

        body: IndexedStack(index: _selectedIndex, children: _pages),

        floatingActionButton: Padding(
          padding: EdgeInsets.only(bottom: bottomSafeArea + 76),
          child: const ChatbotBubble(),
        ),

        // Chatbot nằm bên phải.
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,

        bottomNavigationBar: Container(
          color: _primaryColor,
          padding: EdgeInsets.only(bottom: bottomSafeArea),
          child: CurvedNavigationBar(
            index: _selectedIndex,
            backgroundColor: Colors.transparent,
            color: _primaryColor,
            buttonBackgroundColor: _primaryColor,
            height: 68,
            animationDuration: const Duration(milliseconds: 250),
            animationCurve: Curves.easeInOut,
            letIndexChange: (index) => true,
            onTap: _onNavigationTap,
            items: [
              const Icon(Icons.home_rounded, size: 26, color: Colors.white),
              const Icon(
                Icons.location_on_rounded,
                size: 26,
                color: Colors.white,
              ),

              // Nút trận đấu ở giữa.
              Container(
                width: 46,
                height: 46,
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
                    color: _primaryColor,
                  ),
                ),
              ),

              const Icon(Icons.article_rounded, size: 26, color: Colors.white),
              const Icon(Icons.person_rounded, size: 26, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
