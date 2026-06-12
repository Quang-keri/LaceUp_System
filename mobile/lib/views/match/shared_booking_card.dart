import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/booking_share.dart';
import '../../services/booking_shared_service.dart';
import '../area/booking/ticket_payment_proof_screen.dart';

class SharedBookingCard extends StatefulWidget {
  final SharedBookingPublicResponse booking;
  final String? currentUserId;
  final Future<void> Function() onJoinSuccess;

  const SharedBookingCard({
    super.key,
    required this.booking,
    this.currentUserId,
    required this.onJoinSuccess,
  });

  @override
  State<SharedBookingCard> createState() => _SharedBookingCardState();
}

class _SharedBookingCardState extends State<SharedBookingCard> {
  static const Color _orange = Color(0xFFEA580C);
  static const Color _teal = Color(0xFF0F766E);

  bool _isJoining = false;

  String _formatDate(String value) {
    final date = DateTime.tryParse(value);

    if (date == null) {
      return '--/--/----';
    }

    return DateFormat('dd/MM/yyyy').format(date);
  }

  String _formatTime(String value) {
    final date = DateTime.tryParse(value);

    if (date != null) {
      return DateFormat('HH:mm').format(date);
    }

    if (value.contains('T')) {
      final parts = value.split('T');

      if (parts.length > 1 && parts[1].length >= 5) {
        return parts[1].substring(0, 5);
      }
    }

    return '--:--';
  }

  String _formatMoney(double value) {
    return NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'đ',
      decimalDigits: 0,
    ).format(value);
  }

  Future<void> _openJoinDialog() async {
    if ((widget.currentUserId ?? '').trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập để tham gia trận vãng lai!'),
          behavior: SnackBarBehavior.floating,
        ),
      );

      Navigator.pushNamed(context, '/login');
      return;
    }

    if (widget.booking.remainingSlots <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Trận vãng lai đã đủ người!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    int quantity = 1;

    final selectedQuantity = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final total = widget.booking.pricePerTicket * quantity;

            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
              title: const Text(
                'Tham gia trận vãng lai',
                style: TextStyle(color: _orange, fontWeight: FontWeight.bold),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.booking.categoryName ?? 'Trận vãng lai',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.booking.rentalAreaName,
                          style: const TextStyle(color: Colors.black54),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_formatDate(widget.booking.startTime)} • '
                          '${_formatTime(widget.booking.startTime)} - '
                          '${_formatTime(widget.booking.endTime)}',
                          style: const TextStyle(color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Số vé còn lại:'),
                      Text(
                        '${widget.booking.remainingSlots} vé',
                        style: const TextStyle(
                          color: _teal,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Số lượng vé',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        IconButton(
                          onPressed: quantity > 1
                              ? () {
                                  setDialogState(() {
                                    quantity--;
                                  });
                                }
                              : null,
                          icon: const Icon(Icons.remove_circle_outline),
                        ),
                        Text(
                          '$quantity',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: quantity < widget.booking.remainingSlots
                              ? () {
                                  setDialogState(() {
                                    quantity++;
                                  });
                                }
                              : null,
                          icon: const Icon(Icons.add_circle_outline),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Tổng tiền',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        _formatMoney(total),
                        style: const TextStyle(
                          color: _orange,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(dialogContext, quantity),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _orange,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Xác nhận'),
                ),
              ],
            );
          },
        );
      },
    );

    if (selectedQuantity == null || !mounted) {
      return;
    }

    await _join(selectedQuantity);
  }

  Future<void> _join(int quantity) async {
    if (_isJoining) {
      return;
    }

    setState(() {
      _isJoining = true;
    });

    try {
      final result = await sharedBookingService.joinSharedBooking(
        bookingId: widget.booking.bookingId,
        quantity: quantity,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đăng ký vé vãng lai thành công!'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );

      // 1. Bóc tách ID lập tức (Bao trọn mọi cấu trúc Backend)
      String? participantId;
      Map<String, dynamic>? joinResultMap;

      if (result is Map<String, dynamic>) {
        joinResultMap = result;
        participantId = result['participantId']?.toString();

        if (participantId == null && result['result'] != null) {
          participantId = result['result'] is Map
              ? result['result']['participantId']?.toString()
              : result['result'].toString();
        }

        if (participantId == null && result['data'] != null) {
          participantId = result['data'] is Map
              ? result['data']['participantId']?.toString()
              : result['data'].toString();
        }
      } else if (result != null) {
        participantId = result.toString();
      }

      final String? finalParticipantId = participantId;

      // 2. Refresh lại danh sách (KHÔNG DÙNG AWAIT ĐỂ TRÁNH UNMOUNT)
      widget.onJoinSuccess();

      // 3. Chuyển trang ngay và luôn
      if (finalParticipantId != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TicketPaymentProofScreen(
              participantId: finalParticipantId,
              joinResult: joinResultMap,
            ),
          ),
        );
      } else {
        // Fallback nếu Backend trả về rỗng
        Navigator.pushNamed(context, '/booking-history');
      }
    } catch (error) {
      if (!mounted) return;

      final message = error.toString().replaceFirst('Exception: ', '');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isJoining = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;

    final progress = booking.maxParticipants > 0
        ? (booking.reservedParticipants / booking.maxParticipants)
              .clamp(0.0, 1.0)
              .toDouble()
        : 0.0;

    final courtLabel = [
      booking.courtName,
      if (booking.courtCode != null) '(${booking.courtCode})',
    ].whereType<String>().join(' ');

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFFED7AA)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildTag(
                      text: 'Vãng lai',
                      color: _orange,
                      icon: Icons.confirmation_number_outlined,
                    ),
                    const Spacer(),
                    _buildTag(
                      text: 'Tối thiểu ${booking.minParticipants} người',
                      color: const Color(0xFF0891B2),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  booking.categoryName ?? 'Trận vãng lai',
                  style: const TextStyle(
                    color: _orange,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  courtLabel.isEmpty ? 'Sân chưa xác định' : 'Sân: $courtLabel',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 14,
                  runSpacing: 8,
                  children: [
                    _iconText(
                      Icons.calendar_today_outlined,
                      _formatDate(booking.startTime),
                    ),
                    _iconText(
                      Icons.access_time,
                      '${_formatTime(booking.startTime)} - '
                      '${_formatTime(booking.endTime)}',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.people_outline,
                      size: 17,
                      color: Colors.grey,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Đã đăng ký: '
                        '${booking.reservedParticipants}/'
                        '${booking.maxParticipants} người',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      booking.remainingSlots > 0
                          ? 'Còn ${booking.remainingSlots} slot'
                          : 'Đã đủ người',
                      style: TextStyle(
                        color: booking.remainingSlots > 0
                            ? Colors.teal
                            : Colors.red,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: const AlwaysStoppedAnimation<Color>(_orange),
                  borderRadius: BorderRadius.circular(10),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFFFF7ED),
              border: Border(top: BorderSide(color: Color(0xFFFED7AA))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_formatMoney(booking.pricePerTicket)} / người',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Đã xác nhận: '
                        '${booking.currentParticipants} người',
                        style: const TextStyle(
                          color: Colors.black54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: booking.remainingSlots <= 0 || _isJoining
                      ? null
                      : _openJoinDialog,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: _isJoining
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.person_add_alt_1, size: 18),
                  label: Text(
                    booking.remainingSlots > 0 ? 'Tham gia' : 'Đã đầy',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag({
    required String text,
    required Color color,
    IconData? icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
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

  Widget _iconText(IconData icon, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.blueGrey.shade300),
        const SizedBox(width: 6),
        Text(
          value,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
