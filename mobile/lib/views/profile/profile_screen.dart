import 'package:flutter/material.dart';
import 'package:mobile/views/main_screen.dart';
import 'package:mobile/views/profile/achievement/achievement_screen.dart';
import 'package:mobile/views/profile/achievement/achievement_showcase_screen.dart';
import 'package:provider/provider.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/views/login/login_screen.dart';
import 'package:mobile/views/profile/profile_edit_screen.dart';
import 'package:top_snackbar_flutter/top_snack_bar.dart';
import 'package:top_snackbar_flutter/custom_snack_bar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const Color primaryGreen = Color(0xFF9156F1);
  static const Color bgColor = Colors.white;
  static const Color textGray = Colors.black;

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoggedIn = authProvider.isLoggedIn;
    final currentUser = authProvider.user;

    final activityItems = [
      ProfileMenuItemData(
        title: 'Trận đấu của tôi',
        icon: Icons.groups_outlined,
        onTap: () {
          if (!authProvider.isLoggedIn) {
            showTopSnackBar(
              Overlay.of(context),
              const CustomSnackBar.info(
                message: "Vui lòng đăng nhập để xem thêm",
              ),
            );
            return;
          }

          final userId = authProvider.userId;

          if (userId == null || userId.isEmpty) {
            showTopSnackBar(
              Overlay.of(context),
              const CustomSnackBar.error(message: "Không tìm thấy userId"),
            );
            return;
          }

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => AchievementScreen(userId: userId),
            ),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Lịch sử đặt lịch',
        icon: Icons.history,
        onTap: () {},
      ),
      ProfileMenuItemData(
        title: 'Xếp hạng của tôi',
        icon: Icons.workspace_premium_outlined,
        onTap: () {},
      ),
      ProfileMenuItemData(
        title: 'Tủ kính thành tựu',
        icon: Icons.emoji_events,
        onTap: () {
          if (!authProvider.isLoggedIn) {
            showTopSnackBar(
              Overlay.of(context),
              const CustomSnackBar.info(
                message: "Vui lòng đăng nhập để xem thêm",
              ),
            );
            return;
          }
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const AchievementShowcaseScreen(),
            ),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Gói hội viên',
        icon: Icons.card_membership,
        onTap: () {},
      ),
    ];

    final systemItems = [
      ProfileMenuItemData(
        title: 'Cài đặt',
        icon: Icons.settings_outlined,
        onTap: () {},
      ),
      ProfileMenuItemData(
        title: 'Thông tin cá nhân',
        icon: Icons.info_outline,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfileEditPage()),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Điều khoản và chính sách',
        icon: Icons.verified_user_outlined,
        onTap: () {},
      ),
      if (isLoggedIn)
        ProfileMenuItemData(
          title: 'Đăng xuất',
          icon: Icons.logout,
          onTap: () async {
            await authProvider.logout();

            if (!context.mounted) return;
            showTopSnackBar(
              Overlay.of(context),
              const CustomSnackBar.success(message: "Đăng xuất thành công"),
            );
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const MyApp()),
              (route) => false,
            );
          },
        )
      else
        ProfileMenuItemData(
          title: 'Đăng nhập',
          icon: Icons.login,
          onTap: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
          },
        ),
    ];

    return Scaffold(
      backgroundColor: ProfileScreen.bgColor,
      body: SafeArea(
        child: authProvider.loading
            ? const Center(
                child: CircularProgressIndicator(color: primaryGreen),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (isLoggedIn)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 28),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF9156F1),
                          borderRadius: BorderRadius.circular(22),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              child: const Icon(
                                Icons.person,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    authProvider.userName ?? 'Người dùng',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    currentUser?['email'] ?? '',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ProfileSection(title: 'Hoạt động', items: activityItems),
                    const SizedBox(height: 34),
                    ProfileSection(title: 'Hệ thống', items: systemItems),
                  ],
                ),
              ),
      ),
    );
  }
}

class ProfileMenuItemData {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const ProfileMenuItemData({
    required this.title,
    required this.icon,
    required this.onTap,
  });
}

class ProfileSection extends StatelessWidget {
  final String title;
  final List<ProfileMenuItemData> items;

  const ProfileSection({super.key, required this.title, required this.items});

  static const Color primaryGreen = ProfileScreen.primaryGreen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: primaryGreen,
            fontSize: 24,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 34),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: Colors.white,
            child: Column(
              children: List.generate(items.length, (index) {
                final item = items[index];
                return ProfileMenuTile(
                  item: item,
                  showDivider: index != items.length - 1,
                );
              }),
            ),
          ),
        ),
      ],
    );
  }
}

class ProfileMenuTile extends StatelessWidget {
  final ProfileMenuItemData item;
  final bool showDivider;

  const ProfileMenuTile({
    super.key,
    required this.item,
    required this.showDivider,
  });

  static const Color primaryGreen = ProfileScreen.primaryGreen;
  static const Color textGray = ProfileScreen.textGray;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: item.onTap,
      child: Container(
        height: 76,
        decoration: BoxDecoration(
          border: showDivider
              ? const Border(
                  bottom: BorderSide(color: Color(0xFFE5E5E5), width: 1),
                )
              : null,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Row(
          children: [
            Icon(item.icon, color: primaryGreen, size: 32),
            const SizedBox(width: 18),
            Expanded(
              child: Text(
                item.title,
                style: const TextStyle(
                  color: textGray,
                  fontSize: 22,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF555555), size: 34),
          ],
        ),
      ),
    );
  }
}
