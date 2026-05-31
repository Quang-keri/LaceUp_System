import 'package:flutter/material.dart';
import '../../../models/match.dart';
import '../../../services/match_service.dart';
import 'approve_result_dialog.dart';
import 'match_detail_bottom_sheet.dart';

const Color kAppOrange = Colors.orange;
const Color kAppPurple = Colors.purple;
const LinearGradient kAppGradient = LinearGradient(
  colors: [kAppOrange, kAppPurple],
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
);

class MyMatchScreen extends StatefulWidget {
  const MyMatchScreen({Key? key}) : super(key: key);

  @override
  State<MyMatchScreen> createState() => _MyMatchScreenState();
}

class _MyMatchScreenState extends State<MyMatchScreen>
    with SingleTickerProviderStateMixin {
  bool isLoading = false;
  List<MatchResponse> matches = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchMyMatches();
  }

  Future<void> _fetchMyMatches() async {
    setState(() => isLoading = true);
    try {
      final res = await matchService.getMyMatches(1, 50);
      setState(() {
        matches = res.data;
      });
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu: $e')));
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _openDetailBottomSheet(MatchResponse match) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) =>
          MatchDetailBottomSheet(match: match, onSuccess: _fetchMyMatches),
    );
  }

  void _openApproveDialog(MatchResponse match) {
    showDialog(
      context: context,
      builder: (context) =>
          ApproveResultDialog(match: match, onSuccess: _fetchMyMatches),
    );
  }

  String _formatDate(String isoString) {
    try {
      final DateTime dt = DateTime.parse(isoString);
      final hour = dt.hour.toString().padLeft(2, '0');
      final minute = dt.minute.toString().padLeft(2, '0');
      return "$hour:$minute ${dt.day}/${dt.month}/${dt.year}";
    } catch (e) {
      return isoString;
    }
  }

  Widget _buildStatusTag(String status) {
    Color bgColor;
    Color textColor;
    String text;

    switch (status) {
      case 'OPEN':
        bgColor = Colors.blue.shade50;
        textColor = Colors.blue;
        text = "Đang chờ người";
        break;
      case 'READY':
        bgColor = Colors.green.shade50;
        textColor = Colors.green;
        text = "Sẵn sàng chiến";
        break;
      case 'PLAYING':
        bgColor = kAppPurple.withOpacity(0.1);
        textColor = kAppPurple;
        text = "Đang chiến";
        break;
      case 'WAITING_RESULT_APPROVAL':
        bgColor = kAppOrange.withOpacity(0.1);
        textColor = kAppOrange;
        text = "Chờ duyệt KQ";
        break;
      case 'DISPUTED':
        bgColor = Colors.red.shade50;
        textColor = Colors.red;
        text = "Tranh chấp";
        break;
      case 'COMPLETED':
        bgColor = Colors.grey.shade200;
        textColor = Colors.grey.shade700;
        text = "Đã hoàn thành";
        break;
      case 'CANCELLED':
        bgColor = Colors.red.shade50;
        textColor = Colors.red;
        text = "Đã hủy";
        break;
      default:
        bgColor = Colors.grey.shade200;
        textColor = Colors.black;
        text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildMatchTypeTag(MatchResponse match) {
    Color bgColor;
    Color textColor;
    String text;
    IconData? icon;

    switch (match.matchType) {
      case 'RANKED':
        bgColor = Colors.purple.shade50;
        textColor = Colors.purple;
        text = "Rank (${match.minRank ?? 0}-${match.maxRank ?? 0})";
        icon = Icons.emoji_events;
        break;
      case 'BET':
        bgColor = Colors.orange.shade50;
        textColor = Colors.orange;
        text = match.note?.isNotEmpty == true ? "Kèo: ${match.note}" : "Kèo";
        icon = Icons.local_fire_department;
        break;
      case 'NORMAL':
      default:
        bgColor = Colors.blue.shade50;
        textColor = Colors.blue;
        text = "Giao lưu";
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(MatchResponse match) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  match.title.isNotEmpty
                      ? match.title
                      : 'Giao lưu ${match.categoryName}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildStatusTag(match.status),
                _buildMatchTypeTag(match),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: kAppOrange),
                const SizedBox(width: 6),
                Text(
                  _formatDate(match.startTime),
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.location_on, size: 16, color: kAppPurple),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    match.courtName.isNotEmpty
                        ? match.courtName
                        : "Tự thỏa thuận",
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: match.status == 'WAITING_RESULT_APPROVAL'
                  ? ElevatedButton(
                      onPressed: () => _openApproveDialog(match),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kAppOrange,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Xử lý kết quả',
                        style: TextStyle(color: Colors.white),
                      ),
                    )
                  : ['READY', 'PLAYING', 'DISPUTED'].contains(match.status)
                  ? Container(
                      decoration: BoxDecoration(
                        gradient: kAppGradient,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ElevatedButton(
                        onPressed: () => _openDetailBottomSheet(match),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Đội hình / Báo KQ',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    )
                  : ElevatedButton(
                      onPressed: () => _openDetailBottomSheet(match),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey.shade200,
                        foregroundColor: Colors.black87,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Xem chi tiết'),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeStatuses = [
      'OPEN',
      'READY',
      'PLAYING',
      'WAITING_RESULT_APPROVAL',
      'DISPUTED',
    ];
    final activeMatches = matches
        .where((m) => activeStatuses.contains(m.status))
        .toList();
    final historyMatches = matches
        .where((m) => ['COMPLETED', 'CANCELLED'].contains(m.status))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Trận đấu của tôi',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: kAppPurple,
          unselectedLabelColor: Colors.grey,
          indicatorColor: kAppOrange,
          tabs: const [
            Tab(text: "Đang diễn ra & Chờ"),
            Tab(text: "Hoàn thành & Đã hủy"),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: kAppPurple))
          : TabBarView(
              controller: _tabController,
              children: [
                ListView.builder(
                  itemCount: activeMatches.length,
                  itemBuilder: (context, index) =>
                      _buildMatchCard(activeMatches[index]),
                ),
                ListView.builder(
                  itemCount: historyMatches.length,
                  itemBuilder: (context, index) =>
                      _buildMatchCard(historyMatches[index]),
                ),
              ],
            ),
    );
  }
}
