import 'package:flutter/material.dart';
import '../../../models/achievement.dart';
import '../../../services/achievement_service.dart';

class AchievementShowcaseTab extends StatefulWidget {
  const AchievementShowcaseTab({super.key});

  @override
  State<AchievementShowcaseTab> createState() => _AchievementShowcaseTabState();
}

class _AchievementShowcaseTabState extends State<AchievementShowcaseTab> {
  bool isLoading = true;
  List<UserAchievementResponse> achievements = [];

  final List<BadgeConfig> allBadges = [
    BadgeConfig(
      code: 'FIRST_BLOOD',
      name: 'Đệ Nhất Máu',
      description: 'Thắng trận đầu tiên',
      icon: Icons.star,
      color: Colors.orange,
      bgColor: const Color(0xFFFFF3E0),
    ),
    BadgeConfig(
      code: 'ON_FIRE',
      name: 'Đang Trên Đà',
      description: 'Thắng 5 trận liên tiếp',
      icon: Icons.local_fire_department,
      color: Colors.deepPurple,
      bgColor: const Color(0xFFF3E5F5),
    ),
    BadgeConfig(
      code: 'UNSTOPPABLE',
      name: 'Không Thể Cản Phá',
      description: 'Thắng 10 trận liên tiếp',
      icon: Icons.rocket_launch,
      color: Colors.deepOrange,
      bgColor: const Color(0xFFFFE0B2),
    ),
    BadgeConfig(
      code: 'VETERAN',
      name: 'Lão Tướng',
      description: 'Chơi đủ 100 trận',
      icon: Icons.verified,
      color: Colors.purple,
      bgColor: const Color(0xFFEDE7F6),
    ),
    BadgeConfig(
      code: 'CENTURION',
      name: 'Kẻ Chinh Phục',
      description: 'Đạt mốc 50 trận thắng',
      icon: Icons.emoji_events,
      color: Colors.amber,
      bgColor: const Color(0xFFFFF8E1),
    ),
    BadgeConfig(
      code: 'LEGEND',
      name: 'Huyền Thoại',
      description: 'Chơi tổng cộng 500 trận',
      icon: Icons.workspace_premium,
      color: Colors.deepPurple,
      bgColor: const Color(0xFFEDE7F6),
    ),
    BadgeConfig(
      code: 'PERFECT_ATTENDANCE',
      name: 'Đúng Giờ Là Vàng',
      description: 'Hoàn thành 20 trận không đi muộn',
      icon: Icons.access_time_filled,
      color: Colors.orange,
      bgColor: const Color(0xFFFFF3E0),
    ),
    BadgeConfig(
      code: 'SPORTSMANSHIP',
      name: 'Tinh Thần Thể Thao',
      description: '10 trận liên tiếp không bị report',
      icon: Icons.thumb_up,
      color: Colors.deepPurple,
      bgColor: const Color(0xFFF3E5F5),
    ),
  ];

  @override
  void initState() {
    super.initState();
    fetchMyAchievements();
  }

  Future<void> fetchMyAchievements() async {
    try {
      final data = await achievementService.getMyAchievements();

      if (!mounted) return;

      setState(() {
        achievements = data;
      });
    } catch (e) {
      debugPrint('Get my achievements error: $e');
    } finally {
      if (!mounted) return;

      setState(() {
        isLoading = false;
      });
    }
  }

  UserAchievementResponse? getAchievedItem(String code) {
    try {
      return achievements.firstWhere((e) => e.achievementCode == code);
    } catch (_) {
      return null;
    }
  }

  String formatDate(String? date) {
    if (date == null || date.isEmpty) return '';
    final d = DateTime.tryParse(date);
    if (d == null) return '';

    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  void showBadgeDetail(BadgeConfig badge, UserAchievementResponse? achieved) {
    final isAchieved = achieved != null;

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(badge.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Opacity(
              opacity: isAchieved ? 1 : 0.35,
              child: CircleAvatar(
                radius: 45,
                backgroundColor: badge.bgColor,
                child: Icon(badge.icon, color: badge.color, size: 50),
              ),
            ),
            const SizedBox(height: 16),
            Text(badge.description, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Text(
              isAchieved
                  ? 'Đã mở khóa: ${formatDate(achieved.achievedAt)}'
                  : 'Chưa mở khóa',
              style: TextStyle(
                color: isAchieved ? Colors.green : Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Trả về trực tiếp GridView để dùng làm Tab View
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: allBadges.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.9,
      ),
      itemBuilder: (context, index) {
        final badge = allBadges[index];
        final achieved = getAchievedItem(badge.code);
        final isAchieved = achieved != null;

        return GestureDetector(
          onTap: () => showBadgeDetail(badge, achieved),
          child: Opacity(
            opacity: isAchieved ? 1 : 0.35,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 42,
                    backgroundColor: badge.bgColor,
                    child: Icon(badge.icon, color: badge.color, size: 44),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      badge.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isAchieved ? 'Đã mở khóa' : 'Chưa mở khóa',
                    style: TextStyle(
                      color: isAchieved ? Colors.green : Colors.grey,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class BadgeConfig {
  final String code;
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final Color bgColor;

  BadgeConfig({
    required this.code,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.bgColor,
  });
}
