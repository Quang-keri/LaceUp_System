import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/match.dart';

class MatchCard extends StatelessWidget {
  final MatchResponse match;
  final String? currentUserId;
  final VoidCallback onOpenJoinModal;
  final VoidCallback onJoinSuccess;

  const MatchCard({
    super.key,
    required this.match,
    this.currentUserId,
    required this.onOpenJoinModal,
    required this.onJoinSuccess,
  });

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

  Widget _buildActionButton(BuildContext context) {
    final isParticipant = match.participants.any(
      (p) => p.userId == currentUserId,
    );

    if (match.status == "OPEN" ||
        (match.status == "CONFIRMED" && match.remainingSlots > 0)) {
      if (isParticipant) {
        return ElevatedButton(
          onPressed: null,
          style: ElevatedButton.styleFrom(
            disabledBackgroundColor: Colors.grey.shade200,
            disabledForegroundColor: Colors.grey.shade600,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Text('Đã Tham Gia'),
        );
      }
      return ElevatedButton(
        onPressed: onOpenJoinModal,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF9156F1),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'Tham Gia',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      );
    }

    if (['READY', 'CONFIRMED', 'FULL'].contains(match.status)) {
      if (isParticipant) {
        return ElevatedButton(
          onPressed: null,
          style: ElevatedButton.styleFrom(
            disabledBackgroundColor: const Color(0xFF9156F1).withOpacity(0.5),
            disabledForegroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Text('Sẵn Sàng'),
        );
      }
      return ElevatedButton(
        onPressed: null,
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Đã Đầy'),
      );
    }

    return ElevatedButton(
      onPressed: null,
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: const Text('Đã Chốt'),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Tính giá tiền trên 1 người
    final int validMaxPlayers = match.maxPlayers > 0 ? match.maxPlayers : 1;
    final double pricePerPerson = match.courtPrice / validMaxPlayers;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onOpenJoinModal,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (match.matchType == 'RANKED')
                        _buildTag(
                          'Rank (${match.minRank ?? 0}-${match.maxRank ?? 0})',
                          Colors.purple,
                          Icons.emoji_events,
                        )
                      // else if (match.matchType == 'BET')
                      //   _buildTag(
                      //     'Kèo: ${match.note ?? 'Tự thỏa thuận'}',
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
                        'MÃ: ${match.roomCode ?? 'TRỐNG'}',
                        Colors.orange,
                        null,
                        isOutline: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Tên Trận/Môn thể thao
                  Text(
                    match.title.isNotEmpty
                        ? match.title
                        : 'Giao lưu ${match.categoryName}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9156F1),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // ĐÃ THÊM: Tên Sân (Court Name)
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
                          match.hasCourt
                              ? match.courtName
                              : 'Sân tự thỏa thuận',
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(match.startTime),
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
                        '${_formatTime(match.startTime)} - ${_formatTime(match.endTime)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.people,
                            size: 16,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${match.currentPlayers}/${match.maxPlayers} người',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      Text(
                        'Còn ${match.remainingSlots} slot',
                        style: const TextStyle(
                          color: Colors.teal,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: match.maxPlayers > 0
                        ? (match.currentPlayers / match.maxPlayers)
                        : 0,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFF9156F1),
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(16),
                ),
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ĐÃ SỬA: Hiển thị Giá / Người
                      match.courtPrice > 0
                          ? Text(
                              '${NumberFormat.decimalPattern('vi_VN').format(pricePerPerson)}đ / người',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Color(
                                  0xFFEA580C,
                                ), // Chuyển sang màu cam LaceUp cho nổi bật giá tiền
                              ),
                            )
                          : const Text(
                              'Phí tự thỏa thuận',
                              style: TextStyle(
                                color: Colors.grey,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Text(
                            'Host: ',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          Text(
                            match.host?.userName ?? 'Ẩn danh',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF9156F1),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  _buildActionButton(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

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
}
