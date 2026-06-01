import 'package:flutter/material.dart';
import '../../../models/match.dart';
import '../../../models/match_result.dart';
import '../../../services/match_result_service.dart';
import 'match_lineup_dialog.dart';
import 'submit_result_dialog.dart';
import 'report_dialog.dart';

class MatchDetailBottomSheet extends StatefulWidget {
  final MatchResponse match;
  final VoidCallback onSuccess;

  const MatchDetailBottomSheet({
    Key? key,
    required this.match,
    required this.onSuccess,
  }) : super(key: key);

  @override
  State<MatchDetailBottomSheet> createState() => _MatchDetailBottomSheetState();
}

class _MatchDetailBottomSheetState extends State<MatchDetailBottomSheet> {
  MatchResultResponse? matchResultData;
  bool isLoadingResult = false;

  @override
  void initState() {
    super.initState();
    if (widget.match.status == 'COMPLETED') {
      _fetchResult();
    }
  }

  Future<void> _fetchResult() async {
    setState(() => isLoadingResult = true);
    try {
      final results = await matchResultService.getResultsByMatch(
        widget.match.matchId,
      );
      if (results.isNotEmpty) {
        setState(() => matchResultData = results.first);
      }
    } catch (e) {
      debugPrint("Lỗi tải kết quả: $e");
    } finally {
      setState(() => isLoadingResult = false);
    }
  }

  void _openSubmitDialog() {
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (context) =>
          SubmitResultDialog(match: widget.match, onSuccess: widget.onSuccess),
    );
  }

  void _openReportDialog() {
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (context) => ReportDialog(
        matchId: widget.match.matchId,
        allPlayers: widget.match.participants,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isCompleted = widget.match.status == 'COMPLETED';

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Chi tiết trận đấu",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (isCompleted && matchResultData != null) ...[
            _buildResultBanner(),
            const SizedBox(height: 16),
          ],

          _buildInfoCard(),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => MatchLineupDialog(
                    match: widget.match,
                    matchResultData: matchResultData,
                    onSuccess: widget.onSuccess,
                  ),
                );
              },
              icon: const Icon(Icons.groups_outlined),
              label: const Text(
                "XEM ĐỘI HÌNH & CHIẾN THUẬT",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple.shade50,
                foregroundColor: Colors.purple,
                elevation: 0,
                side: BorderSide(color: Colors.purple.shade100),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),
          _buildBottomActions(context),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.match.categoryName.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          Text(
            widget.match.title.isNotEmpty
                ? widget.match.title
                : "Giao lưu ${widget.match.categoryName}",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            Icons.access_time,
            "Thời gian bắt đầu",
            widget.match.startTime,
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.location_on_outlined,
            widget.match.courtName,
            widget.match.address != null
                ? "${widget.match.address!.street}, ${widget.match.address!.ward}"
                : "Chưa có địa chỉ",
          ),
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Giá sân tham khảo:",
                style: TextStyle(color: Colors.grey),
              ),
              Text(
                "${widget.match.courtPrice} đ",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String sub) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Text(
                sub,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.emoji_events, color: Colors.green.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(color: Colors.green.shade800, fontSize: 13),
                children: [
                  const TextSpan(
                    text: "Trận đấu đã kết thúc. Kết quả chung cuộc: ",
                  ),
                  TextSpan(
                    text:
                        "Đội ${matchResultData?.winningTeamNumber ?? '?'} chiến thắng.",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions(BuildContext context) {
    bool isCompleted = widget.match.status == 'COMPLETED';
    bool isNeedSubmit = [
      'READY',
      'PLAYING',
      'DISPUTED',
    ].contains(widget.match.status);

    return Row(
      children: [
        TextButton.icon(
          onPressed: _openReportDialog,
          icon: const Icon(Icons.flag_outlined, color: Colors.red),
          label: const Text("Báo cáo", style: TextStyle(color: Colors.red)),
        ),
        const Spacer(),
        if (!isCompleted &&
            widget.match.status != 'CANCELLED' &&
            isNeedSubmit) ...[
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Colors.orange, Colors.purple],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: ElevatedButton(
              onPressed: _openSubmitDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
              child: const Text(
                'Báo KQ',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ] else ...[
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.grey.shade700,
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: const Text("Đóng"),
          ),
        ],
      ],
    );
  }
}
