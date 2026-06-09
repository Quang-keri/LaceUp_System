import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // Đừng quên import intl để format ngày và giá tiền
import '../../models/match.dart';
import '../../services/match_service.dart';

class JoinMatchDialog extends StatefulWidget {
  final MatchResponse match;
  final String currentUserName;
  final String currentUserId;
  final VoidCallback onSuccess;

  const JoinMatchDialog({
    super.key,
    required this.match,
    required this.currentUserName,
    required this.currentUserId,
    required this.onSuccess,
  });

  @override
  State<JoinMatchDialog> createState() => _JoinMatchDialogState();
}

class _JoinMatchDialogState extends State<JoinMatchDialog> {
  bool _isLoading = false;
  int _playerCount = 1;

  @override
  void initState() {
    super.initState();
  }

  bool get isParticipant =>
      widget.match.participants.any((p) => p.userId == widget.currentUserId);

  bool get isHost => widget.match.host?.userName == widget.currentUserName;

  int get maxAllowed {
    int maxTeamSize = (widget.match.maxPlayers + 1) ~/ 2;
    return math.min(maxTeamSize, widget.match.remainingSlots);
  }

  // --- HÀM HELPER FORMAT THỜI GIAN & NGÀY ---
  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  String _formatTime(String timeStr) {
    try {
      if (timeStr.contains('T')) {
        return timeStr.split('T')[1].substring(0, 5);
      }
      return timeStr.substring(0, 5);
    } catch (e) {
      return '--:--';
    }
  }

  // --- HÀM TẠO TAG ---
  Widget _buildTag(
    String text,
    Color color,
    IconData? icon, {
    bool isOutline = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isOutline ? Colors.transparent : color.withOpacity(0.1),
        border: Border.all(color: isOutline ? color : Colors.transparent),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleJoin() async {
    setState(() => _isLoading = true);
    try {
      await matchService.joinMatch(widget.match.matchId, _playerCount);
      if (mounted) {
        widget.onSuccess();

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext dContext) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Column(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 48),
                  SizedBox(height: 12),
                  Text(
                    'Thành công!',
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
              content: const Text(
                'Bạn đã tham gia trận đấu thành công.\nHãy thanh toán hoặc chờ chủ phòng duyệt nhé.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: Colors.black87,
                ),
              ),
              actionsAlignment: MainAxisAlignment.center,
              actions: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () {
                      Navigator.of(dContext).pop();
                      Navigator.of(context).pop();
                      Navigator.pushNamed(context, '/my-matches');
                    },
                    child: const Text(
                      'Đến Trận đấu của tôi',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Widget> _buildFooterActions() {
    List<Widget> actions = [];

    actions.add(
      Expanded(
        child: OutlinedButton(
          onPressed: () => Navigator.pop(context),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: const Text('Đóng', style: TextStyle(color: Colors.grey)),
        ),
      ),
    );

    actions.add(const SizedBox(width: 12));

    if (widget.match.status == "OPEN" ||
        (widget.match.status == "CONFIRMED" &&
            widget.match.remainingSlots > 0)) {
      if (isParticipant) {
        actions.add(
          Expanded(
            child: ElevatedButton(
              onPressed: null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Đã tham gia'),
            ),
          ),
        );
      } else {
        actions.add(
          Expanded(
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleJoin,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Xác nhận',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        );
      }
    } else if (widget.match.status == "WAITING_DEPOSIT") {
      actions.add(
        Expanded(
          child: ElevatedButton(
            onPressed: null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Chờ chốt cọc'),
          ),
        ),
      );
    } else if (['FULL', 'CONFIRMED'].contains(widget.match.status)) {
      actions.add(
        Expanded(
          child: ElevatedButton(
            onPressed: null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Đã đủ người'),
          ),
        ),
      );
    }

    return actions;
  }

  @override
  Widget build(BuildContext context) {
    // Tính toán giá tiền
    final int validMaxPlayers = widget.match.maxPlayers > 0
        ? widget.match.maxPlayers
        : 1;
    final double pricePerPerson = widget.match.courtPrice / validMaxPlayers;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        constraints: const BoxConstraints(maxHeight: 700, maxWidth: 500),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chi tiết trận đấu',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.purple,
              ),
            ),
            const SizedBox(height: 16),

            // --- BOX CHI TIẾT TRẬN ĐẤU (ĐÃ BỔ SUNG ĐẦY ĐỦ DATA) ---
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.purple.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.purple.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thể thức & Mã Phòng
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (widget.match.matchType == 'RANKED')
                        _buildTag(
                          'Rank (${widget.match.minRank ?? 0}-${widget.match.maxRank ?? 0})',
                          Colors.purple,
                          Icons.emoji_events,
                        )
                      // else if (widget.match.matchType == 'BET')
                      //   _buildTag(
                      //     'Kèo: ${widget.match.note ?? 'Tự thỏa thuận'}',
                      //     Colors.green,
                      //     Icons.local_fire_department,
                      //   )
                      else
                        _buildTag(
                          'Giao lưu',
                          Colors.blue,
                          Icons.sentiment_satisfied,
                        ),

                      _buildTag(
                        'MÃ: ${widget.match.roomCode ?? 'TRỐNG'}',
                        Colors.orange,
                        null,
                        isOutline: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Tên trận đấu
                  Text(
                    widget.match.title.isNotEmpty
                        ? widget.match.title
                        : 'Giao lưu ${widget.match.categoryName}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.purple.shade900,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Địa điểm
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.match.hasCourt
                              ? widget.match.courtName
                              : 'Sân tự thỏa thuận',
                          style: const TextStyle(fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Ngày và Giờ
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(widget.match.startTime),
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(
                        Icons.access_time,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_formatTime(widget.match.startTime)} - ${_formatTime(widget.match.endTime)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Giá tiền
                  Row(
                    children: [
                      const Icon(
                        Icons.payments_outlined,
                        size: 16,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: widget.match.courtPrice > 0
                            ? Text(
                                '${NumberFormat.decimalPattern('vi_VN').format(pricePerPerson)}đ / người',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFEA580C),
                                ),
                              )
                            : const Text(
                                'Phí tự thỏa thuận',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (!isParticipant &&
                (widget.match.status == "OPEN" ||
                    (widget.match.status == "CONFIRMED" &&
                        widget.match.remainingSlots > 0))) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.orange.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Số lượng tham gia:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      color: Colors.orange,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _playerCount > 1
                          ? () => setState(() => _playerCount--)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$_playerCount',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      color: Colors.orange,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _playerCount < maxAllowed
                          ? () => setState(() => _playerCount++)
                          : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Danh sách tham gia',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${widget.match.currentPlayers} / ${widget.match.maxPlayers}',
                    style: const TextStyle(
                      color: Colors.orange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListView.separated(
                  itemCount: widget.match.participants.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final player = widget.match.participants[index];
                    final playerCount = player.playerCount ?? 1;

                    String rankDisplay = '3000';
                    if (player.categoryRanks != null &&
                        player.categoryRanks!.isNotEmpty) {
                      try {
                        final matchedRank = player.categoryRanks!.firstWhere(
                          (rank) =>
                              rank.categoryName.toLowerCase() ==
                              widget.match.categoryName.toLowerCase(),
                        );
                        rankDisplay = matchedRank.rankPoint.toInt().toString();
                      } catch (e) {
                        // Không tìm thấy category khớp, giữ nguyên 3000
                      }
                    }

                    return ListTile(
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.purple,
                        child: Text(
                          player.userName[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      title: Row(
                        children: [
                          Flexible(
                            child: Text(
                              player.userName +
                                  (playerCount > 1 ? ' (+$playerCount)' : ''),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (player.userName == widget.match.host?.userName)
                            Container(
                              margin: const EdgeInsets.only(left: 6),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.orange,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'HOST',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.purple.shade200),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              size: 14,
                              color: Colors.orange,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              rankDisplay,
                              style: TextStyle(
                                color: Colors.purple.shade700,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            Row(children: _buildFooterActions()),
          ],
        ),
      ),
    );
  }
}
