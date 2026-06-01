import 'package:flutter/material.dart';
import '../../../models/achievement.dart';
import '../../../services/achievement_service.dart';

class AchievementScreen extends StatefulWidget {
  final String userId;

  const AchievementScreen({
    super.key,
    required this.userId,
  });

  @override
  State<AchievementScreen> createState() => _AchievementScreenState();
}

class _AchievementScreenState extends State<AchievementScreen> {
  bool isLoading = true;
  UserDashboardResponse? dashboard;
  List<UserAchievementResponse> achievements = [];

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    try {
      final dashboardData =
      await achievementService.getUserDashboard(widget.userId);

      final achievementData =
      await achievementService.getUserAchievements(widget.userId);

      achievementData.sort(
            (a, b) => DateTime.parse(b.achievedAt)
            .compareTo(DateTime.parse(a.achievedAt)),
      );

      setState(() {
        dashboard = dashboardData;
        achievements = achievementData;
      });
    } catch (e) {
      debugPrint('Achievement screen error: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  BadgeConfig getBadgeConfig(String code) {
    switch (code) {
      case 'FIRST_BLOOD':
        return BadgeConfig('Đệ Nhất Máu', Icons.star, Colors.orange,
            const Color(0xFFFFF3E0));
      case 'ON_FIRE':
        return BadgeConfig('Đang Trên Đà', Icons.local_fire_department,
            Colors.deepPurple, const Color(0xFFF3E5F5));
      case 'UNSTOPPABLE':
        return BadgeConfig('Không Thể Cản Phá', Icons.rocket_launch,
            Colors.deepOrange, const Color(0xFFFFE0B2));
      case 'VETERAN':
        return BadgeConfig(
            'Lão Tướng', Icons.verified, Colors.purple, const Color(0xFFEDE7F6));
      case 'CENTURION':
        return BadgeConfig('Kẻ Chinh Phục', Icons.emoji_events, Colors.amber,
            const Color(0xFFFFF8E1));
      case 'LEGEND':
        return BadgeConfig('Huyền Thoại', Icons.workspace_premium,
            Colors.deepPurple, const Color(0xFFEDE7F6));
      default:
        return BadgeConfig('Huy hiệu bí ẩn', Icons.help_outline, Colors.grey,
            const Color(0xFFF5F5F5));
    }
  }

  String formatDate(String date) {
    final d = DateTime.parse(date);
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7FA),
      appBar: AppBar(
        title: const Text('Thống kê người chơi'),
        backgroundColor: const Color(0xFF9156F1),
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildOverview(),
            const SizedBox(height: 20),
            _buildCategoryRanks(),
            const SizedBox(height: 20),
            _buildAchievements(),
          ],
        ),
      ),
    );
  }

  Widget _buildOverview() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              dashboard?.userName ?? 'Người chơi',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _statBox('Trận', dashboard?.totalMatches ?? 0, Icons.sports),
                _statBox('Thắng', dashboard?.totalWins ?? 0, Icons.emoji_events),
                _statBox('Win rate', '${dashboard?.winRate ?? 0}%',
                    Icons.trending_up),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statBox(String title, dynamic value, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF9156F1), size: 30),
          const SizedBox(height: 6),
          Text(
            value.toString(),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          Text(title, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildCategoryRanks() {
    final ranks = dashboard?.categoryRanks ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Xếp hạng theo môn',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...ranks.map((rank) {
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFEDE7F6),
                child: Icon(Icons.military_tech, color: Color(0xFF9156F1)),
              ),
              title: Text(
                rank.categoryName,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                '${rank.displayRank} • ${rank.rankPoint} điểm\n'
                    '${rank.totalMatches} trận • ${rank.totalWins} thắng • Streak ${rank.currentWinStreak}',
              ),
              trailing: Text(
                '${rank.winRate}%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildAchievements() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Thành tựu mới nhất',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        achievements.isEmpty
            ? const Center(child: Text('Bạn chưa có thành tựu nào'))
            : GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: achievements.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 0.9,
          ),
          itemBuilder: (context, index) {
            final item = achievements[index];
            final config = getBadgeConfig(item.achievementCode);

            return Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => _showAchievementDialog(item),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: config.bgColor,
                      child: Icon(
                        config.icon,
                        color: config.color,
                        size: 42,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      config.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      formatDate(item.achievedAt),
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _showAchievementDialog(UserAchievementResponse item) {
    final config = getBadgeConfig(item.achievementCode);

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(config.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 45,
              backgroundColor: config.bgColor,
              child: Icon(config.icon, size: 50, color: config.color),
            ),
            const SizedBox(height: 16),
            Text(item.description, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Text(
              'Đạt được: ${formatDate(item.achievedAt)}',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

class BadgeConfig {
  final String name;
  final IconData icon;
  final Color color;
  final Color bgColor;

  BadgeConfig(this.name, this.icon, this.color, this.bgColor);
}