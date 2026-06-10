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
const Color _orangeColor = Color(0xFFEA580C);

class MainNavigation extends StatefulWidget {
  const MainNavigation({
    super.key,
  });

  @override
  State<MainNavigation> createState() =>
      _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  static const int _centerTabIndex = 2;

  int _selectedIndex = 0;

  final List<Widget> _pages = [
    AreaListScreen(),
    const MapScreen(),
    const MatchPage(),
    const NewsScreen(),
    const ProfileScreen(),
  ];

  static const List<IconData> _icons = [
    Icons.home_rounded,
    Icons.location_on_rounded,
    Icons.groups_rounded,
    Icons.article_rounded,
    Icons.person_rounded,
  ];

  static const List<String> _labels = [
    'Trang chủ',
    'Bản đồ',
    'Trận đấu',
    'Tin tức',
    'Tài khoản',
  ];

  void _onNavigationTap(int index) {
    if (_selectedIndex == index) {
      return;
    }

    HapticFeedback.selectionClick();

    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _buildNavigationItem(int index) {
    if (index == _centerTabIndex) {
      return _buildCenterNavigationItem();
    }

    return _buildOuterNavigationItem(index);
  }

  /// Bốn nút bên ngoài:
  /// - Chưa chọn: icon trắng
  /// - Đang chọn: vòng tròn trắng + icon tím + chấm cam
  Widget _buildOuterNavigationItem(int index) {
    final bool isSelected = _selectedIndex == index;

    return Semantics(
      label: _labels[index],
      selected: isSelected,
      button: true,
      child: AnimatedContainer(
        duration: const Duration(
          milliseconds: 260,
        ),
        curve: Curves.easeOutCubic,
        width: 50,
        height: 50,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.white
              : Colors.transparent,
          shape: BoxShape.circle,
          border: isSelected
              ? Border.all(
            color: Colors.white,
            width: 2,
          )
              : null,
          boxShadow: isSelected
              ? [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
            BoxShadow(
              color: _primaryColor.withOpacity(0.18),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ]
              : null,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            AnimatedScale(
              duration: const Duration(
                milliseconds: 260,
              ),
              curve: Curves.easeOutBack,
              scale: isSelected ? 1.08 : 1,
              child: Icon(
                _icons[index],
                size: isSelected ? 29 : 27,
                color: isSelected
                    ? _primaryColor
                    : Colors.white,
              ),
            ),

            if (isSelected)
              Positioned(
                top: 3,
                right: 3,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _orangeColor,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: _orangeColor.withOpacity(0.35),
                        blurRadius: 5,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Nút giữa luôn giữ vòng tròn trắng.
  Widget _buildCenterNavigationItem() {
    final bool isSelected =
        _selectedIndex == _centerTabIndex;

    return Semantics(
      label: _labels[_centerTabIndex],
      selected: isSelected,
      button: true,
      child: AnimatedScale(
        duration: const Duration(
          milliseconds: 260,
        ),
        curve: Curves.easeOutBack,
        scale: isSelected ? 1.1 : 1,
        child: AnimatedContainer(
          duration: const Duration(
            milliseconds: 260,
          ),
          curve: Curves.easeOutCubic,
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: isSelected
                  ? _orangeColor
                  : Colors.white,
              width: isSelected ? 2.5 : 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(
                  isSelected ? 0.22 : 0.15,
                ),
                blurRadius: isSelected ? 14 : 8,
                offset: const Offset(0, 4),
              ),
              if (isSelected)
                BoxShadow(
                  color: _orangeColor.withOpacity(0.25),
                  blurRadius: 14,
                  spreadRadius: 2,
                ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              const Icon(
                Icons.groups_rounded,
                size: 30,
                color: _primaryColor,
              ),

              if (isSelected)
                Positioned(
                  top: 3,
                  right: 3,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _orangeColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white,
                        width: 2,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final double bottomSafeArea =
        MediaQuery.paddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
        Brightness.dark,
        statusBarBrightness:
        Brightness.light,
        systemNavigationBarColor:
        _primaryColor,
        systemNavigationBarDividerColor:
        _primaryColor,
        systemNavigationBarIconBrightness:
        Brightness.light,
        systemNavigationBarContrastEnforced:
        false,
      ),
      child: Scaffold(
        extendBody: true,

        body: IndexedStack(
          index: _selectedIndex,
          children: _pages,
        ),

        floatingActionButton: Padding(
          padding: EdgeInsets.only(
            bottom: bottomSafeArea + 78,
          ),
          child: const ChatbotBubble(),
        ),

        floatingActionButtonLocation:
        FloatingActionButtonLocation.endFloat,

        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: _primaryColor,
            boxShadow: [
              BoxShadow(
                color: Color(0x26000000),
                blurRadius: 14,
                offset: Offset(0, -3),
              ),
            ],
          ),
          padding: EdgeInsets.only(
            bottom: bottomSafeArea,
          ),
          child: CurvedNavigationBar(
            index: _selectedIndex,

            backgroundColor:
            Colors.transparent,

            color: _primaryColor,

            buttonBackgroundColor:
            Colors.transparent,

            height: 60,

            animationDuration:
            const Duration(
              milliseconds: 320,
            ),

            animationCurve:
            Curves.easeOutCubic,

            letIndexChange: (int index) {
              return true;
            },

            onTap: _onNavigationTap,

            items: List<Widget>.generate(
              _icons.length,
                  (int index) {
                return _buildNavigationItem(
                  index,
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}