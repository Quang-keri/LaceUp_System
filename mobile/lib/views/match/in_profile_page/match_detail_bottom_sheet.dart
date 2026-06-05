import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import '../../../providers/auth_provider.dart';
import '../../../models/match.dart';
import '../../../models/match_result.dart';
import '../../../services/match_result_service.dart';
import '../../../services/match_service.dart';
import 'match_lineup_dialog.dart';
import 'submit_result_dialog.dart';
import 'report_dialog.dart';
import 'match_payment_screen.dart';

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

  Future<void> _handleLeaveMatch() async {
    try {
      await matchService.leaveMatch(widget.match.matchId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã rút lui khỏi trận đấu thành công!'),
          backgroundColor: Colors.green,
        ),
      );
      widget.onSuccess();
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;

      String errorMessage = 'Có lỗi xảy ra';
      if (e is DioException && e.response?.data != null) {
        errorMessage = e.response?.data['message'] ?? e.message;
      } else {
        errorMessage = e.toString();
      }

      if (errorMessage.contains('đã rời') ||
          errorMessage.contains('chưa tham gia')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bạn đã rời trận đấu này rồi!'),
            backgroundColor: Colors.orange,
          ),
        );
        widget.onSuccess();
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
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

  void _showLeaveConfirmDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Xác nhận rời trận',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text.rich(
          TextSpan(
            text: 'Bạn có chắc muốn rút khỏi trận này?\n\n',
            children: [
              TextSpan(
                text:
                    'Lưu ý: Rời trận dưới 24h sẽ mất phí đã đóng và bị trừ 10 điểm uy tín.',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade50,
              elevation: 0,
            ),
            onPressed: () {
              Navigator.pop(context);
              _handleLeaveMatch();
            },
            child: const Text(
              'Đồng ý rời',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimeRange(String start, String end) {
    try {
      final DateTime dtStart = DateTime.parse(start);
      final DateTime dtEnd = DateTime.parse(end);
      final String date = DateFormat('dd/MM/yyyy').format(dtStart);
      final String sTime = DateFormat('HH:mm').format(dtStart);
      final String eTime = DateFormat('HH:mm').format(dtEnd);
      return "$sTime - $eTime,  $date";
    } catch (e) {
      return start;
    }
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

          _buildInfoCard(context),
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

  Widget _buildInfoCard(BuildContext context) {
    final myUserId = context.read<AuthProvider>().user?['userId'];
    var myInfo = widget.match.participants
        .where((p) => p.userId == myUserId)
        .firstOrNull;

    double amountToPay = myInfo?.amountDue ?? 0.0;
    bool isPaid = myInfo?.isPaid ?? false;

    String addressStr = "Chưa có địa chỉ chi tiết";
    if (widget.match.address != null) {
      addressStr =
          "${widget.match.address!.street ?? ''}, ${widget.match.address!.ward ?? ''}";
    }

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.match.categoryName.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
              if (widget.match.roomCode != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    "Mã: ${widget.match.roomCode}",
                    style: TextStyle(
                      color: Colors.orange.shade800,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            widget.match.title.isNotEmpty
                ? widget.match.title
                : "Giao lưu ${widget.match.categoryName}",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),

          if (widget.match.note != null && widget.match.note!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                "Ghi chú: ${widget.match.note}",
                style: const TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: Colors.black54,
                ),
              ),
            ),

          const SizedBox(height: 16),
          _buildInfoRow(
            Icons.access_time,
            "Thời gian",
            _formatTimeRange(widget.match.startTime, widget.match.endTime),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.location_on_outlined,
            widget.match.courtName,
            addressStr,
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.group_outlined,
            "Số lượng tham gia",
            "${widget.match.currentPlayers} / ${widget.match.maxPlayers} người",
          ),

          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Số tiền bạn phải trả:",
                style: TextStyle(
                  color: Colors.black54,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    NumberFormat.currency(
                      locale: 'vi_VN',
                      symbol: 'đ',
                    ).format(amountToPay),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: isPaid ? Colors.green : Colors.orange,
                    ),
                  ),
                  if (isPaid)
                    const Text(
                      "(Đã thanh toán)",
                      style: TextStyle(
                        color: Colors.green,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
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
    final myUserId = context.read<AuthProvider>().user?['userId'];
    var myInfo = widget.match.participants
        .where((p) => p.userId == myUserId)
        .firstOrNull;
    bool isParticipant = myInfo != null && myInfo.isCancelled != true;

    bool needsPayment = false;
    if (myInfo != null) {
      needsPayment = (myInfo.amountDue ?? 0) > 0 && myInfo.isPaid != true;
    }

    bool isCompleted = widget.match.status == 'COMPLETED';
    bool isNeedSubmit = [
      'READY',
      'PLAYING',
      'DISPUTED',
    ].contains(widget.match.status);
    bool canLeave =
        isParticipant &&
        ['OPEN', 'PENDING', 'READY'].contains(widget.match.status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (needsPayment &&
            !['COMPLETED', 'CANCELLED'].contains(widget.match.status))
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      MatchPaymentScreen(matchId: widget.match.matchId),
                ),
              ).then((_) => widget.onSuccess());
            },
            icon: const Icon(Icons.payment, size: 20),
            label: const Text(
              'Thanh toán ngay',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          )
        else if (!isCompleted &&
            widget.match.status != 'CANCELLED' &&
            isNeedSubmit)
          ElevatedButton.icon(
            onPressed: _openSubmitDialog,
            icon: const Icon(Icons.check_circle_outline, size: 20),
            label: const Text(
              'Báo Kết Quả',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: Colors.purple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          )
        else
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: Colors.grey.shade700,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              "Đóng",
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ),

        const SizedBox(height: 12),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton.icon(
              onPressed: _openReportDialog,
              icon: const Icon(
                Icons.flag_outlined,
                color: Colors.red,
                size: 18,
              ),
              label: const Text(
                "Báo cáo vi phạm",
                style: TextStyle(color: Colors.red, fontSize: 13),
              ),
            ),
            if (canLeave) ...[
              const SizedBox(width: 12),
              Container(width: 1, height: 14, color: Colors.grey.shade300),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: _showLeaveConfirmDialog,
                icon: const Icon(
                  Icons.exit_to_app,
                  color: Colors.orange,
                  size: 18,
                ),
                label: const Text(
                  "Rút lui",
                  style: TextStyle(color: Colors.orange, fontSize: 13),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
