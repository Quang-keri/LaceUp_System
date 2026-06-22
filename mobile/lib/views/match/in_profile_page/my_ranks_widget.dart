import 'package:flutter/material.dart';
import '../../../models/user.dart';
import '../../../services/user_service.dart';

class RankInfo {
  final String name;
  final Color color;
  final String imagePath;

  RankInfo(this.name, this.color, this.imagePath);
}

class MyRanksWidget extends StatefulWidget {
  final String userId;

  const MyRanksWidget({Key? key, required this.userId}) : super(key: key);

  @override
  State<MyRanksWidget> createState() => _MyRanksWidgetState();
}

class _MyRanksWidgetState extends State<MyRanksWidget> {
  bool isLoading = true;
  UserDashboardResponse? dashboardData;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    try {
      final rawData = await userService.getUserDashboard(widget.userId);
      if (!mounted) return;

      setState(() {
        dashboardData = UserDashboardResponse.fromJson(rawData);
      });
    } catch (e) {
      debugPrint('Error fetching ranks: $e');
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  RankInfo getRankInfo(double pointsData) {
    int points = pointsData.toInt();

    if (points >= 3000) {
      return RankInfo("Cao Thủ", Colors.purple, "assets/images/master.png");
    }
    if (points >= 2500) {
      return RankInfo(
        "Kim Cương ${5 - ((points % 500) ~/ 100)}",
        Colors.blue,
        "assets/images/diamond.png",
      );
    }
    if (points >= 2000) {
      return RankInfo(
        "Bạch Kim ${5 - ((points % 500) ~/ 100)}",
        Colors.cyan,
        "assets/images/platinum.png",
      );
    }
    if (points >= 1500) {
      return RankInfo(
        "Vàng ${5 - ((points % 500) ~/ 100)}",
        Colors.amber,
        "assets/images/gold.png",
      );
    }
    if (points >= 1000) {
      return RankInfo(
        "Bạc ${5 - ((points % 500) ~/ 100)}",
        Colors.grey,
        "assets/images/silver.png",
      );
    }
    if (points >= 500) {
      return RankInfo(
        "Đồng ${5 - ((points % 500) ~/ 100)}",
        Colors.orange,
        "assets/images/bronze.png",
      );
    }

    return RankInfo(
      "Sắt ${5 - (points ~/ 100)}",
      Colors.blueGrey,
      "assets/images/iron.png",
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    final ranks = dashboardData?.categoryRanks ?? [];

    if (ranks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.sports_esports_outlined,
                size: 64,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                "Bạn chưa tham gia trận xếp hạng nào.",
                style: TextStyle(color: Colors.grey.shade600, fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: ranks.length,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemBuilder: (context, index) {
        final item = ranks[index];
        final rankInfo = getRankInfo(item.rankPoint);

        String displayName = item.categoryName.replaceAll(RegExp(r'^Sân\s+', caseSensitive: false), '').trim();
        if (displayName.isNotEmpty) {
          displayName = displayName[0].toUpperCase() + displayName.substring(1);
        }

        return Card(
          elevation: 1,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Image.asset(
                  rankInfo.imagePath,
                  width: 70,
                  height: 70,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return CircleAvatar(
                      radius: 35,
                      backgroundColor: rankInfo.color.withOpacity(0.1),
                      child: Icon(Icons.emoji_events, size: 40, color: rankInfo.color),
                    );
                  },
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueAccent,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${rankInfo.name} - ${item.rankPoint.toInt()} Đ',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Số trận: ${item.totalMatches}',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                          Text(
                            'Tỉ lệ thắng: ${item.winRate.toStringAsFixed(1)}%',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: item.winRate / 100.0,
                          backgroundColor: Colors.grey.shade200,
                          color: const Color(0xFF52C41A),
                          minHeight: 6,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
