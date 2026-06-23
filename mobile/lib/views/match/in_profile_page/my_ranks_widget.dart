import 'package:flutter/material.dart';
import '../../../models/user.dart';
import '../../../models/leaderboard_model.dart';
import '../../../models/category.dart'; // Đảm bảo đã import model Category
import '../../../services/user_service.dart';
import '../../../services/leaderboard_service.dart';
import '../../../services/category_service.dart'; // Cần import CategoryService

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
  List<CategoryResponse> allCategories = []; // Thêm biến lưu TẤT CẢ bộ môn

  int? selectedCategoryId;
  List<LeaderboardEntryResponse> top100 = [];
  MyLeaderboardStatsResponse? myStats;
  bool isLoadingLeaderboard = false;

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    try {
      // 1. Lấy toàn bộ danh sách Category vì trên App không có state global
      final catPage = await categoryService.getAllCategories(size: 50);

      // 2. Lấy thống kê cá nhân
      final rawData = await userService.getUserDashboard(widget.userId);

      if (!mounted) return;

      setState(() {
        // Lưu ý: Nếu PageResponse của ông định nghĩa biến chứa list là 'items' hay 'result' thì sửa lại chữ .data cho đúng nhé
        allCategories = catPage.data ?? [];
        dashboardData = UserDashboardResponse.fromJson(rawData);

        // Mặc định chọn bộ môn đầu tiên trong list TẤT CẢ bộ môn
        if (allCategories.isNotEmpty) {
          selectedCategoryId = allCategories.first.categoryId;
          _fetchLeaderboardData();
        }
      });
    } catch (e) {
      debugPrint('Error fetching init data: $e');
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _fetchLeaderboardData() async {
    if (selectedCategoryId == null) return;

    setState(() => isLoadingLeaderboard = true);

    List<LeaderboardEntryResponse> topRes = [];
    MyLeaderboardStatsResponse? statsRes;

    try {
      topRes = await leaderboardService.getTop100ByCategory(
        selectedCategoryId!,
      );
    } catch (e) {
      debugPrint('Lỗi tải Top 100: $e');
    }

    try {
      statsRes = await leaderboardService.getMyLeaderboardStats(
        selectedCategoryId!,
      );
    } catch (e) {
      debugPrint('Bỏ qua lỗi tải My Stats (User chưa phân hạng): $e');
    }

    if (!mounted) return;

    setState(() {
      top100 = topRes;
      myStats = statsRes;
      isLoadingLeaderboard = false;
    });
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
    List<LeaderboardEntryResponse> displayList = top100.take(10).toList();
    bool amIInTop10 = displayList.any((e) => e.userId == widget.userId);
    LeaderboardEntryResponse? appendedMe;

    if (!amIInTop10 && myStats?.myStats != null) {
      appendedMe = myStats!.myStats;
    }

    int totalItems = displayList.length + (appendedMe != null ? 1 : 0);

    return Column(
      children: [
        // Thanh cuộn ngang chọn bộ môn (thay thế Dropdown)
        Container(
          height: 45,
          margin: const EdgeInsets.only(top: 16, bottom: 8),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: allCategories.length,
            itemBuilder: (context, index) {
              final cat = allCategories[index];
              final isSelected = cat.categoryId == selectedCategoryId;

              // Format lại tên cho ngắn gọn (VD: "Sân cầu lông" -> "Cầu lông")
              String displayName = cat.categoryName
                  .replaceAll(RegExp(r'^Sân\s+', caseSensitive: false), '')
                  .trim();
              if (displayName.isNotEmpty) {
                displayName =
                    displayName[0].toUpperCase() + displayName.substring(1);
              }

              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () {
                    if (!isSelected) {
                      setState(() {
                        selectedCategoryId = cat.categoryId;
                      });
                      _fetchLeaderboardData();
                    }
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: isSelected ? kAppPurple : Colors.white,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: isSelected
                            ? kAppPurple
                            : kAppPurple.withOpacity(0.3),
                        width: 1.5,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: kAppPurple.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : [],
                    ),
                    child: Center(
                      child: Text(
                        displayName,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: isSelected ? Colors.white : kAppPurple,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

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
