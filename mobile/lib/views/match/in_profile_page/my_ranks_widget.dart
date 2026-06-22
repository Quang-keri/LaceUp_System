import 'package:flutter/material.dart';
import '../../../models/user.dart';
import '../../../models/leaderboard_model.dart';
import '../../../services/user_service.dart';
import '../../../services/leaderboard_service.dart';

const Color kAppOrange = Colors.orange;
const Color kAppPurple = Colors.purple;

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

  int? selectedCategoryId;
  List<LeaderboardEntryResponse> top100 = [];
  MyLeaderboardStatsResponse? myStats;
  bool isLoadingLeaderboard = false;

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
        if (dashboardData?.categoryRanks != null &&
            dashboardData!.categoryRanks!.isNotEmpty) {
          selectedCategoryId = dashboardData!.categoryRanks!.first.categoryId;
          _fetchLeaderboardData();
        }
      });
    } catch (e) {
      debugPrint('Error fetching ranks: $e');
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _fetchLeaderboardData() async {
    if (selectedCategoryId == null) return;

    setState(() => isLoadingLeaderboard = true);
    try {
      final topRes = await leaderboardService.getTop100ByCategory(
        selectedCategoryId!,
      );
      final statsRes = await leaderboardService.getMyLeaderboardStats(
        selectedCategoryId!,
      );

      if (!mounted) return;
      setState(() {
        top100 = topRes;
        myStats = statsRes;
      });
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
    } finally {
      if (mounted) {
        setState(() => isLoadingLeaderboard = false);
      }
    }
  }

  RankInfo getRankInfo(double pointsData) {
    int points = pointsData.toInt();
    if (points >= 3000)
      return RankInfo("Cao Thủ", Colors.purple, "assets/images/master.png");
    if (points >= 2500)
      return RankInfo(
        "Kim Cương ${5 - ((points % 500) ~/ 100)}",
        Colors.blue,
        "assets/images/diamond.png",
      );
    if (points >= 2000)
      return RankInfo(
        "Bạch Kim ${5 - ((points % 500) ~/ 100)}",
        Colors.cyan,
        "assets/images/platinum.png",
      );
    if (points >= 1500)
      return RankInfo(
        "Vàng ${5 - ((points % 500) ~/ 100)}",
        Colors.amber,
        "assets/images/gold.png",
      );
    if (points >= 1000)
      return RankInfo(
        "Bạc ${5 - ((points % 500) ~/ 100)}",
        Colors.grey,
        "assets/images/silver.png",
      );
    if (points >= 500)
      return RankInfo(
        "Đồng ${5 - ((points % 500) ~/ 100)}",
        Colors.orange,
        "assets/images/bronze.png",
      );
    return RankInfo(
      "Sắt ${5 - (points ~/ 100)}",
      Colors.blueGrey,
      "assets/images/iron.png",
    );
  }

  Widget _buildPersonalStatsTab() {
    final ranks = dashboardData?.categoryRanks ?? [];

    if (ranks.isEmpty) {
      return Center(
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
      );
    }

    return ListView.builder(
      itemCount: ranks.length,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemBuilder: (context, index) {
        final item = ranks[index];
        final rankInfo = getRankInfo(item.rankPoint.toDouble());

        String displayName = item.categoryName
            .replaceAll(RegExp(r'^Sân\s+', caseSensitive: false), '')
            .trim();
        if (displayName.isNotEmpty)
          displayName = displayName[0].toUpperCase() + displayName.substring(1);

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: kAppPurple.withOpacity(0.2)),
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
                  errorBuilder: (context, error, stackTrace) => CircleAvatar(
                    radius: 35,
                    backgroundColor: kAppPurple.withOpacity(0.1),
                    child: const Icon(
                      Icons.emoji_events,
                      size: 40,
                      color: kAppPurple,
                    ),
                  ),
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
                          color: kAppPurple,
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
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            'Tỉ lệ thắng: ${item.winRate.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: item.totalMatches > 0
                              ? (item.winRate / 100.0)
                              : 0,
                          backgroundColor: Colors.grey.shade200,
                          color: kAppOrange,
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

  Widget _buildLeaderboardTab() {
    final ranks = dashboardData?.categoryRanks ?? [];

    if (ranks.isEmpty) {
      return Center(
        child: Text(
          "Cần tham gia thi đấu để xem bảng xếp hạng.",
          style: TextStyle(color: Colors.grey.shade600),
        ),
      );
    }

    // 1. Cắt lấy Top 10
    List<LeaderboardEntryResponse> displayList = top100.take(10).toList();

    // 2. Kiểm tra xem user hiện tại có trong Top 10 chưa
    bool amIInTop10 = displayList.any((e) => e.userId == widget.userId);
    LeaderboardEntryResponse? appendedMe;

    // 3. Nếu chưa, nối thêm user vào cuối
    if (!amIInTop10 && myStats?.myStats != null) {
      appendedMe = myStats!.myStats;
    }

    int totalItems = displayList.length + (appendedMe != null ? 1 : 0);

    return Column(
      children: [
        // Dropdown chọn bộ môn
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kAppPurple.withOpacity(0.3)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: selectedCategoryId,
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down, color: kAppPurple),
                items: ranks.map((rank) {
                  return DropdownMenuItem<int>(
                    value: rank.categoryId,
                    child: Text(
                      rank.categoryName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: kAppPurple,
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null && val != selectedCategoryId) {
                    setState(() {
                      selectedCategoryId = val;
                    });
                    _fetchLeaderboardData();
                  }
                },
              ),
            ),
          ),
        ),

        // Thống kê hạng của tôi
        if (myStats != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    kAppPurple.withOpacity(0.1),
                    kAppOrange.withOpacity(0.1),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kAppOrange.withOpacity(0.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Hạng của bạn:",
                        style: TextStyle(fontSize: 13, color: Colors.black54),
                      ),
                      Text(
                        "Hạng ${myStats!.currentRankPosition}",
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: kAppPurple,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: kAppOrange,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "Top ${myStats!.topPercentage}%",
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // List Top 10 + Current User (nếu có)
        Expanded(
          child: isLoadingLeaderboard
              ? const Center(
                  child: CircularProgressIndicator(color: kAppOrange),
                )
              : displayList.isEmpty
              ? const Center(child: Text("Chưa có dữ liệu Bảng xếp hạng"))
              : ListView.builder(
                  itemCount: totalItems,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemBuilder: (context, index) {
                    final bool isAppended = index == displayList.length;
                    final userStat = isAppended
                        ? appendedMe!
                        : displayList[index];
                    final int stt = isAppended
                        ? myStats!.currentRankPosition
                        : index + 1;

                    final rankInfo = getRankInfo(userStat.rankPoint.toDouble());
                    final isMe = userStat.userId == widget.userId;

                    Widget rankIcon;
                    if (stt == 1) {
                      rankIcon = CircleAvatar(
                        backgroundColor: Colors.amber.shade600,
                        radius: 15,
                        child: const Text(
                          '1',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      );
                    } else if (stt == 2) {
                      rankIcon = CircleAvatar(
                        backgroundColor: Colors.blueGrey.shade300,
                        radius: 15,
                        child: const Text(
                          '2',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      );
                    } else if (stt == 3) {
                      rankIcon = CircleAvatar(
                        backgroundColor: Colors.deepOrange.shade400,
                        radius: 15,
                        child: const Text(
                          '3',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      );
                    } else {
                      rankIcon = CircleAvatar(
                        backgroundColor: Colors.grey.shade200,
                        radius: 15,
                        child: Text(
                          '$stt',
                          style: const TextStyle(
                            color: Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      );
                    }

                    return Column(
                      children: [
                        // Thêm dải phân cách nếu là item chèn thêm ở dưới cùng
                        if (isAppended) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(
                                child: Divider(
                                  color: kAppOrange.withOpacity(0.5),
                                  thickness: 1,
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                ),
                                child: Icon(
                                  Icons.keyboard_double_arrow_down,
                                  size: 16,
                                  color: kAppOrange.withOpacity(0.8),
                                ),
                              ),
                              Expanded(
                                child: Divider(
                                  color: kAppOrange.withOpacity(0.5),
                                  thickness: 1,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                        ],
                        Card(
                          color: isMe
                              ? kAppOrange.withOpacity(0.05)
                              : Colors.white,
                          margin: const EdgeInsets.only(bottom: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: isMe ? kAppOrange : Colors.transparent,
                              width: isAppended ? 1.5 : 1.0,
                            ),
                          ),
                          elevation: isAppended ? 2 : 0.5,
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                            leading: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SizedBox(
                                  width: 32,
                                  child: Center(child: rankIcon),
                                ),
                                const SizedBox(width: 8),
                                CircleAvatar(
                                  backgroundImage: userStat.avatar != null
                                      ? NetworkImage(userStat.avatar!)
                                      : null,
                                  backgroundColor: kAppPurple.withOpacity(0.2),
                                  child: userStat.avatar == null
                                      ? const Icon(
                                          Icons.person,
                                          color: kAppPurple,
                                        )
                                      : null,
                                ),
                              ],
                            ),
                            title: Text(
                              userStat.userName,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isMe ? kAppOrange : Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Row(
                              children: [
                                Image.asset(
                                  rankInfo.imagePath,
                                  width: 20,
                                  height: 20,
                                  errorBuilder: (_, __, ___) =>
                                      const Icon(Icons.star, size: 16),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${userStat.rankPoint} Đ',
                                  style: TextStyle(
                                    color: rankInfo.color,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${userStat.winRate}% Win',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: kAppPurple,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  '${userStat.totalMatches} trận',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(color: kAppPurple));
    }

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: const TabBar(
              labelColor: kAppOrange,
              unselectedLabelColor: Colors.grey,
              indicatorColor: kAppOrange,
              labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              tabs: [
                Tab(text: "Thống kê"),
                Tab(text: "Bảng xếp hạng"),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [_buildPersonalStatsTab(), _buildLeaderboardTab()],
            ),
          ),
        ],
      ),
    );
  }
}
