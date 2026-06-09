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

  @override
  Widget build(BuildContext context) {
    final bottomSafeArea = MediaQuery.paddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: _primaryColor,
        systemNavigationBarDividerColor: _primaryColor,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarContrastEnforced: false,
      ),
      child: Scaffold(
        extendBody: true,
        body: IndexedStack(
          index: _selectedIndex,
          children: _pages,
        ),
        floatingActionButton: Padding(
          padding: EdgeInsets.only(
            bottom: bottomSafeArea + 76,
          ),
          child: const ChatbotBubble(),
        ),
        floatingActionButtonLocation:
        FloatingActionButtonLocation.endFloat,
        bottomNavigationBar: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CurvedNavigationBar(
              index: _selectedIndex,
              backgroundColor: Colors.transparent,
              color: _primaryColor,
              buttonBackgroundColor: _primaryColor,
              height: 68,
              animationDuration:
              const Duration(milliseconds: 250),
              letIndexChange: (index) => true,
              onTap: (index) {
                if (_selectedIndex == index) {
                  return;
                }

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
                      color: _primaryColor,
                    ),
    return Scaffold(
      extendBody: true,

      body: IndexedStack(index: _selectedIndex, children: _pages),

      floatingActionButton: Padding(
        padding: EdgeInsets.only(bottom: bottomSafeArea + 50),
        child: const ChatbotBubble(),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,

      bottomNavigationBar: Container(
        color: Colors.transparent,
        child: SafeArea(
          bottom: true,
          child: CurvedNavigationBar(
            index: _selectedIndex,
            backgroundColor: Colors.transparent,
            color: const Color(0xFF9156F1),
            buttonBackgroundColor: const Color(0xFF9156F1),
            height: 75,
            animationDuration: const Duration(milliseconds: 250),
            letIndexChange: (index) => true,
            onTap: (index) {
              setState(() {
                _selectedIndex = index;
              });
            },
            items: [
              const Icon(Icons.home_rounded, size: 26, color: Colors.white),
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
              const Icon(Icons.article_rounded, size: 26, color: Colors.white),
              const Icon(Icons.person_rounded, size: 26, color: Colors.white),
            ],
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


            if (bottomSafeArea > 0)
              Container(
                height: bottomSafeArea,
                // color: _primaryColor,
              ),
          ],
        ),
      ),
    );
  }
}
