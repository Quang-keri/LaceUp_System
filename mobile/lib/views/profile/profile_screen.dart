import 'package:flutter/material.dart';
import 'package:mobile/services/account_deletion_service.dart';
import 'package:mobile/views/profile/bank_account/user_bank_account_screen.dart';
import 'package:provider/provider.dart';
import 'package:top_snackbar_flutter/custom_snack_bar.dart';
import 'package:top_snackbar_flutter/top_snack_bar.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/views/login/login_screen.dart';
import 'package:mobile/views/login/register_screen.dart';
import 'package:mobile/views/profile/achievement/achievement_showcase_screen.dart';
import 'package:mobile/views/profile/history/booking_history_screen.dart';
import 'package:mobile/views/profile/profile_edit_screen.dart';
import 'package:mobile/views/profile/terms/terms_policy_screen.dart';
import '../../theme/app_colors.dart';
import '../../widgets/main_navigation.dart';
import '../match/in_profile_page/my_match_screen.dart';
import 'delete_account/delete_account_flow.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const Color primaryPurple = Color(0xFF9156F1);
  static const Color darkPurple = Color(0xFF7443D8);
  static const Color lightPurple = Color(0xFFF3EDFF);

  static const Color backgroundColor = Color(0xFFF8F7FA);
  static const Color textColor = Color(0xFF24212B);
  static const Color secondaryTextColor = Color(0xFF77717F);

  static const Color dangerColor = Color(0xFFD92D20);
  static const Color dangerBackground = Color(0xFFFFF1F0);

  @override
  Widget build(BuildContext context) {
    final AuthProvider authProvider = context.watch<AuthProvider>();

    final bool isLoggedIn = authProvider.isLoggedIn;
    final Map<String, dynamic>? currentUser = authProvider.user;

    final List<ProfileMenuItemData> activityItems = [
      ProfileMenuItemData(
        title: 'Trận đấu của tôi',
        icon: Icons.groups_outlined,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MyMatchScreen()),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Lịch sử đặt lịch',
        icon: Icons.history_rounded,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const BookingHistoryScreen()),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Xếp hạng của tôi',
        icon: Icons.workspace_premium_outlined,
        isComingSoon: true,
        onTap: () {
          showComingSoon(context);
        },
      ),
      ProfileMenuItemData(
        title: 'Tủ kính thành tựu',

        icon: Icons.emoji_events_outlined,
        onTap: () {
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
        icon: Icons.card_membership_outlined,
        isComingSoon: true,
        onTap: () {
          showComingSoon(context);
        },
      ),
    ];
    final List<ProfileMenuItemData> accountItems = [
      ProfileMenuItemData(
        title: 'Thông tin cá nhân',
        icon: Icons.person_outline_rounded,
        onTap: () async {
          final bool? updated = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const ProfileEditPage()),
          );

          if (updated == true && context.mounted) {
            showTopSnackBar(
              Overlay.of(context),
              const CustomSnackBar.success(
                message: 'Thông tin cá nhân đã được cập nhật',
              ),
            );
          }
        },
      ),
      ProfileMenuItemData(
        title: 'Tài khoản ngân hàng',
        icon: Icons.account_balance_outlined,
        isComingSoon: false,
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const UserBankAccountScreen(),
            ),
          );
        },
      ),
    ];

    final List<ProfileMenuItemData> systemItems = [
      ProfileMenuItemData(
        title: 'Cài đặt',
        icon: Icons.settings_outlined,
        isComingSoon: true,
        onTap: () {
          showComingSoon(context);
        },
      ),
      ProfileMenuItemData(
        title: 'Điều khoản và chính sách',
        icon: Icons.verified_user_outlined,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const TermsPolicyScreen()),
          );
        },
      ),
      ProfileMenuItemData(
        title: 'Đăng xuất',
        icon: Icons.logout_rounded,
        onTap: () async {
          await handleLogout(context: context, authProvider: authProvider);
        },
      ),
      ProfileMenuItemData(
        title: 'Xóa tài khoản',
        icon: Icons.delete_forever_outlined,
        isDanger: true,
        isComingSoon: false,
        onTap: () async {
          final authProvider = context.read<AuthProvider>();

          if (!authProvider.isLoggedIn) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Vui lòng đăng nhập để xóa tài khoản'),
              ),
            );

            return;
          }

          await openDeleteAccountFlow(
            context,
            service: AccountDeletionService(),
          );
        },
      ),
    ];

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: authProvider.loading
            ? const Center(
                child: CircularProgressIndicator(color: primaryPurple),
              )
            : isLoggedIn
            ? _buildLoggedInContent(
                context: context,
                authProvider: authProvider,
                currentUser: currentUser,
                activityItems: activityItems,
                accountItems: accountItems,
                systemItems: systemItems,
              )
            : _buildGuestContent(context),
      ),
    );
  }

  Widget _buildLoggedInContent({
    required BuildContext context,
    required AuthProvider authProvider,
    required Map<String, dynamic>? currentUser,
    required List<ProfileMenuItemData> activityItems,
    required List<ProfileMenuItemData> accountItems,
    required List<ProfileMenuItemData> systemItems,
  }) {
    return SingleChildScrollView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProfileHeader(
            authProvider: authProvider,
            currentUser: currentUser,
          ),
          const SizedBox(height: 26),

          ProfileSection(
            title: 'Hoạt động',
            icon: Icons.sports_bar,
            items: activityItems,
          ),

          const SizedBox(height: 28),

          ProfileSection(
            title: 'Tài khoản của tôi',
            icon: Icons.manage_accounts_outlined,
            items: accountItems,
          ),

          const SizedBox(height: 28),

          ProfileSection(
            title: 'Hệ thống',
            icon: Icons.tune_rounded,
            items: systemItems,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader({
    required AuthProvider authProvider,
    required Map<String, dynamic>? currentUser,
  }) {
    final String userName = authProvider.userName?.trim().isNotEmpty == true
        ? authProvider.userName!.trim()
        : 'Người dùng LaceUp';

    final String email = currentUser?['email']?.toString() ?? '';

    final String initials = _getInitials(userName);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [primaryPurple, darkPurple],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryPurple.withOpacity(0.25),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 66,
            height: 66,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.5),
                width: 2,
              ),
            ),
            child: Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 23,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),

          const SizedBox(width: 16),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),

                if (email.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.email_outlined,
                        color: Colors.white.withOpacity(0.8),
                        size: 15,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.82),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 8),

                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.16),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.verified_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'Thành viên LaceUp',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestContent(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 120),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: lightPurple,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: primaryPurple.withOpacity(0.25)),
            ),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: primaryPurple.withOpacity(0.13),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person_off_outlined,
                    color: primaryPurple,
                    size: 35,
                  ),
                ),

                const SizedBox(height: 16),

                const Text(
                  'Chưa đăng nhập',
                  style: TextStyle(
                    color: textColor,
                    fontSize: 21,
                    fontWeight: FontWeight.w800,
                  ),
                ),

                const SizedBox(height: 7),

                const Text(
                  'Đăng nhập để quản lý tài khoản, lịch đặt sân và các hoạt động của bạn.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: secondaryTextColor,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryPurple,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Đăng nhập',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ),
          ),

          const SizedBox(height: 14),

          SizedBox(
            width: double.infinity,
            height: 54,
            child: OutlinedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: primaryPurple,
                side: const BorderSide(color: primaryPurple, width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Đăng ký tài khoản',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static String _getInitials(String name) {
    final List<String> parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();

    if (parts.isEmpty) {
      return 'LU';
    }

    if (parts.length == 1) {
      final String text = parts.first;

      if (text.length == 1) {
        return text.toUpperCase();
      }

      return text.substring(0, 2).toUpperCase();
    }

    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }
}

class ProfileMenuItemData {
  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onTap;

  final bool isDanger;
  final bool isComingSoon;

  const ProfileMenuItemData({
    required this.title,
    required this.icon,
    required this.onTap,
    this.subtitle,
    this.isDanger = false,
    this.isComingSoon = false,
  });
}

class ProfileSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<ProfileMenuItemData> items;

  const ProfileSection({
    super.key,
    required this.title,
    required this.icon,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: ProfileScreen.lightPurple,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: ProfileScreen.primaryPurple, size: 19),
            ),

            const SizedBox(width: 10),

            Text(
              title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),

        const SizedBox(height: 14),

        Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFEDE9F2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.035),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: List.generate(items.length, (index) {
              return ProfileMenuTile(
                item: items[index],
                showDivider: index != items.length - 1,
              );
            }),
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

  @override
  Widget build(BuildContext context) {
    final Color itemColor = item.isDanger
        ? ProfileScreen.dangerColor
        : ProfileScreen.primaryPurple;

    final Color itemBackground = item.isDanger
        ? ProfileScreen.dangerBackground
        : Colors.white;

    return Material(
      color: itemBackground,
      child: InkWell(
        onTap: item.onTap,
        splashColor: itemColor.withOpacity(0.08),
        highlightColor: itemColor.withOpacity(0.04),
        child: Container(
          constraints: const BoxConstraints(minHeight: 72),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            border: showDivider
                ? const Border(bottom: BorderSide(color: Color(0xFFEDE9F2)))
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: itemColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(item.icon, color: itemColor, size: 23),
              ),

              const SizedBox(width: 13),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: item.isDanger
                                  ? ProfileScreen.dangerColor
                                  : ProfileScreen.textColor,
                              fontSize: 15,
                              fontWeight: item.isDanger
                                  ? FontWeight.w800
                                  : FontWeight.w700,
                            ),
                          ),
                        ),

                        if (item.isComingSoon) ...[
                          const SizedBox(width: 7),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: item.isDanger
                                  ? ProfileScreen.dangerColor.withOpacity(0.1)
                                  : ProfileScreen.lightPurple,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Sắp có',
                              style: TextStyle(
                                color: itemColor,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),

                    if (item.subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.subtitle!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: item.isDanger
                              ? ProfileScreen.dangerColor.withOpacity(0.72)
                              : AppColors.orange,
                          fontSize: 11.5,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(width: 8),

              Icon(
                Icons.chevron_right_rounded,
                color: item.isDanger
                    ? ProfileScreen.dangerColor
                    : const Color(0xFFA39DAA),
                size: 25,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> handleLogout({
  required BuildContext context,
  required AuthProvider authProvider,
}) async {
  try {
    await authProvider.logout();

    if (!context.mounted) return;

    showTopSnackBar(
      Overlay.of(context),
      const CustomSnackBar.success(message: 'Đăng xuất thành công'),
    );

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const MainNavigation()),
      (route) => false,
    );
  } catch (e) {
    if (!context.mounted) return;

    showTopSnackBar(
      Overlay.of(context),
      CustomSnackBar.error(
        message: e.toString().replaceFirst('Exception: ', ''),
      ),
    );
  }
}

void showComingSoon(
  BuildContext context, {
  String message = 'Chức năng đang được phát triển',
  bool isDanger = false,
}) {
  showTopSnackBar(
    Overlay.of(context),
    isDanger
        ? CustomSnackBar.error(message: message)
        : CustomSnackBar.info(message: message),
  );
}
