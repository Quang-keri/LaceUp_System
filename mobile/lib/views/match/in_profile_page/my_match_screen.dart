import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../../../providers/auth_provider.dart';
import '../../../models/match.dart';
import '../../../services/match_service.dart';
import 'approve_result_dialog.dart';
import 'match_detail_bottom_sheet.dart';
import 'match_payment_screen.dart';

const Color kAppOrange = Colors.orange;
const Color kAppPurple = Colors.purple;

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

  final Set<String> _leftMatchIds = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchMyMatches();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchMyMatches() async {
    if (mounted) {
      setState(() => isLoading = true);
    }

    try {
      final res = await matchService.getMyMatches(1, 50);

      if (!mounted) return;

      setState(() {
        matches = res.data;
      });
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải dữ liệu: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _openPaymentScreen(MatchResponse match) async {
    final bool? uploaded = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => MatchPaymentScreen(matchId: match.matchId),
      ),
    );

    if (!mounted || uploaded != true) return;

    await _fetchMyMatches();

    if (!mounted) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _showPaymentProofSuccess();
      }
    });
  }

  void _showPaymentProofSuccess() {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();

    messenger.showSnackBar(
      SnackBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 18),
        duration: const Duration(seconds: 4),
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF3),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF86EFAC)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF16A34A),
                size: 26,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đã gửi ảnh chuyển khoản',
                      style: TextStyle(
                        color: Color(0xFF166534),
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Ảnh đang chờ chủ sân kiểm tra và xác nhận.',
                      style: TextStyle(
                        color: Color(0xFF15803D),
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLeaveMatch(String matchId) async {
    try {
      await matchService.leaveMatch(matchId);
      if (!mounted) return;

      setState(() {
        _leftMatchIds.add(matchId);
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã rút lui khỏi trận đấu thành công!'),
          backgroundColor: Colors.green,
        ),
      );
      _fetchMyMatches();
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
        setState(() {
          _leftMatchIds.add(matchId);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bạn đã rời trận đấu này rồi!'),
            backgroundColor: Colors.orange,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
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

  void _showLeaveConfirmDialog(String matchId) {
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
              _handleLeaveMatch(matchId);
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

  Widget _buildStatusTag(String status, bool hasLeft) {
    if (hasLeft) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          "Đã rút lui",
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

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
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
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
      // case 'BET':
      //   bgColor = Colors.orange.shade50;
      //   textColor = Colors.orange;
      //   text = match.note?.isNotEmpty == true ? "Kèo: ${match.note}" : "Kèo";
      //   icon = Icons.local_fire_department;
      //   break;
      case 'NORMAL':
      default:
        bgColor = Colors.blue.shade50;
        textColor = Colors.blue;
        text = "Giao lưu";
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: textColor),
            const SizedBox(width: 3),
          ],
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactActionButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
    required Color foregroundColor,
    Color? backgroundColor,
    Color? borderColor,
    bool filled = false,
  }) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(9),
    );

    final labelWidget = Text(
      label,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      softWrap: false,
      style: const TextStyle(
        fontSize: 11.5,
        fontWeight: FontWeight.w700,
        height: 1,
      ),
    );

    if (filled) {
      return SizedBox(
        height: 34,
        child: ElevatedButton.icon(
          onPressed: onPressed,
          icon: Icon(icon, size: 14),
          label: labelWidget,
          style: ElevatedButton.styleFrom(
            backgroundColor: backgroundColor ?? foregroundColor,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.grey.shade300,
            disabledForegroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            shape: shape,
            visualDensity: const VisualDensity(horizontal: -2, vertical: -3),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
      );
    }

    return SizedBox(
      height: 34,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 14),
        label: labelWidget,
        style: OutlinedButton.styleFrom(
          foregroundColor: foregroundColor,
          backgroundColor: backgroundColor ?? Colors.white,
          side: BorderSide(color: borderColor ?? foregroundColor, width: 1.1),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          shape: shape,
          visualDensity: const VisualDensity(horizontal: -2, vertical: -3),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ),
    );
  }

  Widget _buildCompactStatus({
    required String label,
    required IconData icon,
    required Color foregroundColor,
    required Color backgroundColor,
    required Color borderColor,
  }) {
    return Container(
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: borderColor, width: 1.1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: foregroundColor),
          const SizedBox(width: 5),
          Text(
            label,
            maxLines: 1,
            style: TextStyle(
              color: foregroundColor,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(MatchResponse match) {
    final authProvider = context.read<AuthProvider>();
    final myUserId = authProvider.user?['userId'];

    var rawInfo = match.participants
        .where((p) => p.userId == myUserId)
        .firstOrNull;

    bool hasLeft =
        (rawInfo?.isCancelled == true) || _leftMatchIds.contains(match.matchId);

    var myInfo = hasLeft ? null : rawInfo;

    final bool isPaid = myInfo?.isPaid == true;

    final bool isWaitingApproval =
        myInfo != null && myInfo.paymentStatus == 'PENDING';

    final bool needsPayment =
        myInfo != null &&
        (myInfo.amountDue ?? 0) > 0 &&
        myInfo.isPaid != true &&
        !isWaitingApproval;

    final smallButtonStyle = ElevatedButton.styleFrom(
      minimumSize: const Size(0, 36),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
    );

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      // Nhỏ margin lại
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0), // Padding bên trong cũng thu lại
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  match.title.isNotEmpty
                      ? match.title
                      : 'Giao lưu ${match.categoryName}',
                  style: const TextStyle(
                    fontSize: 15, // Chữ nhỏ lại xíu
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildStatusTag(match.status, hasLeft),
                _buildMatchTypeTag(match),
              ],
            ),
            const SizedBox(height: 8),
            // Giảm khoảng cách
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: kAppOrange),
                const SizedBox(width: 4),
                Text(
                  _formatDate(match.startTime),
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(width: 12),
                const Icon(Icons.location_on, size: 14, color: kAppPurple),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    match.courtName.isNotEmpty
                        ? match.courtName
                        : "Tự thỏa thuận",
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (myInfo != null &&
                    ['OPEN', 'PENDING', 'READY'].contains(match.status))
                  _buildCompactActionButton(
                    label: 'Rút lui',
                    icon: Icons.logout_rounded,
                    onPressed: () => _showLeaveConfirmDialog(match.matchId),
                    foregroundColor: const Color(0xFFEF4444),
                    borderColor: const Color(0xFFEF4444),
                    backgroundColor: Colors.white,
                  ),

                if (myInfo != null &&
                    ['OPEN', 'PENDING', 'READY'].contains(match.status))
                  const SizedBox(width: 8),

                Expanded(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Wrap(
                      alignment: WrapAlignment.end,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        if (isWaitingApproval)
                          _buildCompactStatus(
                            label: 'Chờ duyệt',
                            icon: Icons.hourglass_top_rounded,
                            foregroundColor: const Color(0xFFEA580C),
                            backgroundColor: const Color(0xFFFFF7ED),
                            borderColor: const Color(0xFFFDBA74),
                          ),

                        if (isPaid)
                          _buildCompactStatus(
                            label: 'Đã TT',
                            icon: Icons.check_circle_rounded,
                            foregroundColor: const Color(0xFF15803D),
                            backgroundColor: const Color(0xFFECFDF3),
                            borderColor: const Color(0xFF86EFAC),
                          ),

                        if (needsPayment &&
                            !['COMPLETED', 'CANCELLED'].contains(match.status))
                          _buildCompactActionButton(
                            label: 'Thanh toán',
                            icon: Icons.account_balance_wallet_rounded,
                            onPressed: () => _openPaymentScreen(match),
                            foregroundColor: kAppOrange,
                            backgroundColor: kAppOrange,
                            filled: true,
                          ),

                        if (match.status == 'WAITING_RESULT_APPROVAL')
                          _buildCompactActionButton(
                            label: 'Xử lý KQ',
                            icon: Icons.fact_check_rounded,
                            onPressed: () => _openApproveDialog(match),
                            foregroundColor: kAppOrange,
                            backgroundColor: kAppOrange,
                            filled: true,
                          )
                        else if ([
                              'READY',
                              'PLAYING',
                              'DISPUTED',
                            ].contains(match.status) &&
                            !needsPayment &&
                            !hasLeft)
                          _buildCompactActionButton(
                            label: 'Đội hình / KQ',
                            icon: Icons.groups_rounded,
                            onPressed: () => _openDetailBottomSheet(match),
                            foregroundColor: kAppPurple,
                            borderColor: kAppPurple,
                            backgroundColor: Colors.white,
                          )
                        else
                          _buildCompactActionButton(
                            label: 'Chi tiết',
                            icon: Icons.visibility_outlined,
                            onPressed: () => _openDetailBottomSheet(match),
                            foregroundColor: const Color(0xFF374151),
                            borderColor: const Color(0xFFD1D5DB),
                            backgroundColor: Colors.white,
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        Icon(icon, size: 80, color: Colors.grey.shade300),
        const SizedBox(height: 16),
        Center(
          child: Text(
            message,
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final myUserId = context.read<AuthProvider>().user?['userId'];

    final activeStatuses = [
      'OPEN',
      'READY',
      'PLAYING',
      'WAITING_RESULT_APPROVAL',
      'DISPUTED',
    ];

    List<MatchResponse> activeMatches = [];
    List<MatchResponse> historyMatches = [];

    for (var m in matches) {
      var rawInfo = m.participants
          .where((p) => p.userId == myUserId)
          .firstOrNull;

      bool hasLeft =
          (rawInfo?.isCancelled == true) || _leftMatchIds.contains(m.matchId);

      if (hasLeft || ['COMPLETED', 'CANCELLED'].contains(m.status)) {
        historyMatches.add(m);
      } else if (activeStatuses.contains(m.status)) {
        activeMatches.add(m);
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      // Thêm nền xám nhạt để card nổi bật hơn
      appBar: AppBar(
        automaticallyImplyLeading: true,
        title: const Text(
          'Trận đấu của tôi',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
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
                RefreshIndicator(
                  onRefresh: _fetchMyMatches,
                  color: kAppOrange,
                  child: activeMatches.isEmpty
                      ? _buildEmptyState(
                          "Không có trận đấu nào đang diễn ra",
                          Icons.sports_tennis,
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.only(top: 8, bottom: 20),
                          itemCount: activeMatches.length,
                          itemBuilder: (context, index) =>
                              _buildMatchCard(activeMatches[index]),
                        ),
                ),
                RefreshIndicator(
                  onRefresh: _fetchMyMatches,
                  color: kAppOrange,
                  child: historyMatches.isEmpty
                      ? _buildEmptyState(
                          "Không có dữ liệu lịch sử",
                          Icons.history,
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.only(top: 8, bottom: 20),
                          itemCount: historyMatches.length,
                          itemBuilder: (context, index) =>
                              _buildMatchCard(historyMatches[index]),
                        ),
                ),
              ],
            ),
    );
  }
}
