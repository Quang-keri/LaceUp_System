import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/services/booking_service.dart';
import 'package:mobile/utils/error_utils.dart';

import '../../area/area_detail/payment_proof_screen.dart';
import '../../area/booking/ticket_payment_proof_screen.dart';
import '../../../models/selected_booking_slot.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen>
    with SingleTickerProviderStateMixin {
  final Color primaryColor = const Color(0xFF9156F1);

  late TabController tabController;

  bool loadingIntents = false;
  bool loadingBookings = false;

  List bookingIntents = [];
  List pendingSharedTickets = [];
  List confirmedBookings = [];

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 2, vsync: this);
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    await Future.wait([_loadBookingIntents(), _loadBookings()]);
  }

  Future<void> _loadBookingIntents() async {
    setState(() => loadingIntents = true);
    try {
      final res = await bookingService.getMyBookingIntents();
      setState(() {
        bookingIntents = res;
      });
    } catch (e) {
      _showError(e);
    } finally {
      if (mounted) setState(() => loadingIntents = false);
    }
  }

  Future<void> _loadBookings() async {
    if (!mounted) return;
    setState(() => loadingBookings = true);

    try {
      final res = await bookingService.getMyBookings(
        null,
        null,
        null,
        null,
        1,
        20,
      );

      if (!mounted) return;

      setState(() {
        final allBookings = res['data'] ?? [];

        pendingSharedTickets = allBookings
            .where(
              (b) =>
                  b['bookingType'] == 'SHARED' &&
                  b['ticketPaymentStatus'] == 'PENDING',
            )
            .toList();

        confirmedBookings = allBookings
            .where(
              (b) =>
                  !(b['bookingType'] == 'SHARED' &&
                      b['ticketPaymentStatus'] == 'PENDING'),
            )
            .toList();
      });
    } catch (e) {
      if (mounted) _showError(e);
    } finally {
      if (mounted) setState(() => loadingBookings = false);
    }
  }

  Future<void> _handleCancelBooking(dynamic booking) async {
    final isShared = booking['bookingType'] == 'SHARED';
    final startTimeStr = booking['startTime']?.toString();
    final startTime = startTimeStr != null
        ? DateTime.tryParse(startTimeStr)
        : DateTime.now();
    final hoursDiff = startTime?.difference(DateTime.now()).inHours ?? 0;
    final isLateCancel = hoursDiff < 5;

    Widget content;
    if (isShared) {
      content = const Text.rich(
        TextSpan(
          text:
              'Bạn đang yêu cầu hủy vé vãng lai. Theo quy định, tiền mua vé sẽ ',
          children: [
            TextSpan(
              text: 'không được hoàn lại',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: '. Bạn có chắc chắn muốn hủy?'),
          ],
        ),
      );
    } else if (isLateCancel) {
      content = const Text.rich(
        TextSpan(
          text: 'CẢNH BÁO: ',
          style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
          children: [
            TextSpan(
              text: 'Bạn đang hủy lịch quá sát giờ, dưới 5 giờ. Bạn sẽ ',
              style: TextStyle(color: Colors.black),
            ),
            TextSpan(
              text: 'mất tiền cọc',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextSpan(
              text: ' và ',
              style: TextStyle(color: Colors.black),
            ),
            TextSpan(
              text: 'bị trừ 10 điểm uy tín',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextSpan(
              text: '. Bạn vẫn muốn tiếp tục hủy?',
              style: TextStyle(color: Colors.black),
            ),
          ],
        ),
      );
    } else {
      content = const Text.rich(
        TextSpan(
          text: 'Bạn đang hủy lịch trước 5 giờ. Theo quy định, tiền cọc sẽ ',
          children: [
            TextSpan(
              text: 'không được hoàn lại',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: '. Bạn có chắc chắn muốn hủy?'),
          ],
        ),
      );
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          isShared ? 'Xác nhận hủy vé vãng lai?' : 'Xác nhận hủy booking?',
          style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
        ),
        content: content,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Không', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Đồng ý hủy',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    // Close the bottom sheet first if it's open
    Navigator.pop(context);
    setState(() => loadingBookings = true);

    try {
      if (isShared) {
        final participantId = booking['participantId']?.toString();
        if (participantId == null) throw Exception("Không tìm thấy mã vé");
        await bookingService.cancelSharedTicketByUser(participantId);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hủy vé vãng lai thành công!'),
            backgroundColor: Colors.orange,
          ),
        );
      } else {
        final res = await bookingService.cancelBooking(
          booking['bookingId'].toString(),
        );

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Hủy lịch đặt sân thành công!'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      _loadBookings();
    } catch (e) {
      if (!mounted) return;
      _showError(e);
    } finally {
      if (mounted) setState(() => loadingBookings = false);
    }
  }

  void _showError(dynamic e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(getErrorMessage(e)), backgroundColor: Colors.red),
    );
  }

  String _formatMoney(dynamic value) {
    final number = double.tryParse(value?.toString() ?? '0') ?? 0;
    return NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'đ',
      decimalDigits: 0,
    ).format(number);
  }

  String _formatDate(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '');
    if (date == null) return '-';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  String _formatTime(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '');
    if (date == null) return '--';
    return DateFormat('HH:mm').format(date);
  }

  String _effectiveIntentStatus(dynamic intent) {
    final status = intent['status']?.toString() ?? '';

    if (status == 'ACTIVE') {
      final expiresAt = DateTime.tryParse(
        intent['expiresAt']?.toString() ?? '',
      );

      if (expiresAt != null && !expiresAt.isAfter(DateTime.now())) {
        return 'EXPIRED';
      }
    }

    return status;
  }

  bool _isPendingIntent(dynamic intent) {
    final status = _effectiveIntentStatus(intent);
    return status == 'ACTIVE' || status == 'PENDING_OWNER_CONFIRM';
  }

  bool _isFailedIntent(dynamic intent) {
    final status = _effectiveIntentStatus(intent);
    return const {'EXPIRED', 'CANCELLED', 'REJECTED'}.contains(status);
  }

  List get _pendingBookingIntents =>
      bookingIntents.where(_isPendingIntent).toList();

  List get _failedBookingIntents =>
      bookingIntents.where(_isFailedIntent).toList();

  double _toDouble(dynamic value) {
    return double.tryParse(value?.toString() ?? '0') ?? 0;
  }

  Future<void> _openBookingPaymentProof(dynamic intent) async {
    final bookingIntentId = intent['bookingIntentId']?.toString();

    if (bookingIntentId == null || bookingIntentId.isEmpty) {
      _showError('Không tìm thấy mã đơn đặt sân.');
      return;
    }

    Navigator.pop(context);

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentProofScreen(
          bookingId: bookingIntentId,
          rentalArea: null,
          selectedSlots: const <SelectedBookingSlot>[],
          totalPrice: _toDouble(intent['previewPrice']),
          bookingResult: intent,
        ),
      ),
    );

    if (mounted) {
      await _loadAllData();
    }
  }

  bool _hasProof(dynamic booking) {
    final url = booking['ticketPaymentProofUrl']?.toString() ?? '';
    return url.isNotEmpty;
  }

  String _getSharedTicketStatusLabel(String ticketStatus, bool hasProof) {
    switch (ticketStatus) {
      case 'PENDING':
        return hasProof ? 'Chờ chủ sân duyệt' : 'Chờ thanh toán';
      case 'SUCCESS':
        return 'Đã thanh toán';
      case 'BOOKED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'FAILED':
        return 'Thanh toán lỗi';
      case 'CANCELLED':
        return 'Đã hủy vé';
      case 'CANCELLED_NO_REFUND':
        return 'Hủy (Không hoàn tiền)';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return 'Chờ xử lý';
    }
  }

  Color _getSharedTicketStatusColor(String ticketStatus, bool hasProof) {
    switch (ticketStatus) {
      case 'PENDING':
        return hasProof ? Colors.blue : Colors.orange;
      case 'SUCCESS':
      case 'COMPLETED':
        return Colors.green;
      case 'BOOKED':
      case 'REFUNDED':
        return Colors.blue;
      case 'FAILED':
      case 'CANCELLED_NO_REFUND':
        return Colors.red;
      case 'CANCELLED':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _intentStatusLabel(String status) {
    switch (status) {
      case 'ACTIVE':
        return 'Chờ chuyển khoản';
      case 'PENDING_OWNER_CONFIRM':
        return 'Chờ chủ sân duyệt';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'REJECTED':
        return 'Bị từ chối';
      default:
        return status;
    }
  }

  String _bookingStatusLabel(String status) {
    switch (status) {
      case 'BOOKED':
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ACTIVE':
        return Colors.orange;
      case 'PENDING_OWNER_CONFIRM':
        return Colors.blue;
      case 'BOOKED':
      case 'CONFIRMED':
        return Colors.blue;
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
      case 'REJECTED':
      case 'EXPIRED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _statusChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: Colors.grey.shade200),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 8,
          offset: const Offset(0, 3),
        ),
      ],
    );
  }

  Widget _emptyView(String text, IconData icon) {
    return ListView(
      children: [
        const SizedBox(height: 180),
        Icon(icon, size: 70, color: Colors.grey),
        const SizedBox(height: 12),
        Center(
          child: Text(
            text,
            style: const TextStyle(color: Colors.black54, fontSize: 16),
          ),
        ),
      ],
    );
  }

  void _backToProfile() {
    Navigator.pop(context);
  }

  bool _canCancelBooking(dynamic booking) {
    final startTimeStr = booking['startTime']?.toString();
    if (startTimeStr == null) return false;
    final startTime = DateTime.tryParse(startTimeStr);
    if (startTime == null || !startTime.isAfter(DateTime.now())) return false;

    final isShared = booking['bookingType'] == 'SHARED';
    if (isShared) {
      final ticketStatus = booking['ticketPaymentStatus']?.toString() ?? '';
      return ![
        'CANCELLED',
        'CANCELLED_NO_REFUND',
        'REFUND_PENDING',
        'REFUNDED',
        'FAILED',
        'COMPLETED',
      ].contains(ticketStatus);
    }

    final status = booking['bookingStatus']?.toString() ?? '';
    return !['CANCELLED'].contains(status);
  }

  void _showIntentDetail(dynamic intent) {
    final slots = intent['slots'] ?? [];
    final status = _effectiveIntentStatus(intent);

    late String infoTitle;
    late String infoContent;
    late IconData infoIcon;
    late Color infoColor;

    switch (status) {
      case 'ACTIVE':
        infoTitle = 'Chờ chuyển khoản';
        infoContent =
            'Bạn cần chuyển khoản và gửi ảnh chuyển khoản trong vòng 5 phút. '
            'Nếu không gửi kịp, đơn sẽ tự động hết hạn.';
        infoIcon = Icons.account_balance_wallet_outlined;
        infoColor = Colors.orange;
        break;
      case 'PENDING_OWNER_CONFIRM':
        infoTitle = 'Chờ chủ sân duyệt';
        infoContent =
            'Ảnh chuyển khoản đã được gửi. Vui lòng chờ chủ sân kiểm tra và xác nhận.';
        infoIcon = Icons.hourglass_top_rounded;
        infoColor = Colors.blue;
        break;
      case 'EXPIRED':
        infoTitle = 'Đơn đã hết hạn';
        infoContent =
            'Đơn này đã hết hạn vì bạn chưa gửi ảnh chuyển khoản trong vòng 5 phút '
            'kể từ lúc tạo đơn.';
        infoIcon = Icons.timer_off_outlined;
        infoColor = Colors.red;
        break;
      case 'REJECTED':
        infoTitle = 'Đơn bị từ chối';
        infoContent =
            'Chủ sân đã từ chối đơn hoặc ảnh chuyển khoản chưa hợp lệ.';
        infoIcon = Icons.highlight_off_rounded;
        infoColor = Colors.red;
        break;
      case 'CANCELLED':
        infoTitle = 'Đơn đã bị hủy';
        infoContent = 'Đơn đặt sân này đã bị hủy và không còn hiệu lực.';
        infoIcon = Icons.cancel_outlined;
        infoColor = Colors.grey;
        break;
      default:
        infoTitle = 'Trạng thái đơn';
        infoContent = _intentStatusLabel(status);
        infoIcon = Icons.info_outline;
        infoColor = _statusColor(status);
    }

    final systemBottomInset = MediaQuery.viewPaddingOf(context).bottom;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.82,
          minChildSize: 0.45,
          maxChildSize: 0.95,
          builder: (_, controller) {
            return ListView(
              controller: controller,
              padding: EdgeInsets.fromLTRB(18, 18, 18, 24 + systemBottomInset),
              children: [
                _bottomSheetHandle(),
                Row(
                  children: [
                    Icon(infoIcon, color: infoColor),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Chi tiết đơn đặt sân',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    _statusChip(
                      _intentStatusLabel(status),
                      _statusColor(status),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _infoBox(
                  title: infoTitle,
                  content: infoContent,
                  icon: infoIcon,
                  color: infoColor,
                ),
                const SizedBox(height: 12),
                _detailCard(
                  children: [
                    _detailRow(
                      'Mã đơn',
                      intent['bookingIntentId']?.toString() ?? '-',
                    ),
                    _detailRow(
                      'Khu sân',
                      intent['rentalAreaName']?.toString() ?? '-',
                    ),
                    _detailRow('Ngày', _formatDate(intent['startTime'])),
                    _detailRow(
                      'Khung giờ',
                      '${_formatTime(intent['startTime'])} - ${_formatTime(intent['endTime'])}',
                    ),
                    _detailRow(
                      'Người đặt',
                      intent['bookerName']?.toString() ?? '-',
                    ),
                    _detailRow('SĐT', intent['bookerPhone']?.toString() ?? '-'),
                    _detailRow(
                      'Ghi chú',
                      intent['note']?.toString().isNotEmpty == true
                          ? intent['note'].toString()
                          : '-',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _detailCard(
                  children: [
                    _moneyRow(
                      'Tạm tính',
                      intent['previewPrice'],
                      Colors.orange,
                    ),
                    _detailRow(
                      'Ngày gửi ảnh',
                      intent['paymentProofUploadedAt'] != null
                          ? '${_formatDate(intent['paymentProofUploadedAt'])} ${_formatTime(intent['paymentProofUploadedAt'])}'
                          : '-',
                    ),
                    _detailRow(
                      'Hết hạn lúc',
                      intent['expiresAt'] != null
                          ? '${_formatDate(intent['expiresAt'])} ${_formatTime(intent['expiresAt'])}'
                          : '-',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _slotListCard(slots),

                if (status == 'ACTIVE') ...[
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => _openBookingPaymentProof(intent),
                    icon: const Icon(
                      Icons.upload_file_rounded,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Gửi ảnh chuyển khoản',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],

                if (status == 'PENDING_OWNER_CONFIRM') ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.hourglass_top_rounded, color: Colors.blue),
                        SizedBox(width: 8),
                        Text(
                          'Đang chờ chủ sân duyệt...',
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            );
          },
        );
      },
    );
  }

  void _showBookingDetail(dynamic booking) {
    final systemBottomInset = MediaQuery.viewPaddingOf(context).bottom;
    final slots = booking['slots'] ?? [];
    final status = booking['bookingStatus']?.toString() ?? '';
    final isShared = booking['bookingType'] == 'SHARED';
    final ticketStatus = booking['ticketPaymentStatus']?.toString() ?? '';

    final hasProof = _hasProof(booking);
    final canCancel = _canCancelBooking(booking);

    final displayStatusLabel = isShared
        ? _getSharedTicketStatusLabel(ticketStatus, hasProof)
        : _bookingStatusLabel(status);
    final displayStatusColor = isShared
        ? _getSharedTicketStatusColor(ticketStatus, hasProof)
        : _statusColor(status);
    final displayPrice = isShared
        ? (booking['ticketAmount'] ?? booking['pricePerTicket'] ?? 0)
        : booking['totalPrice'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.78,
          minChildSize: 0.45,
          maxChildSize: 0.95,
          builder: (_, controller) {
            return ListView(
              controller: controller,
              padding: EdgeInsets.fromLTRB(18, 18, 18, 24 + systemBottomInset),
              children: [
                _bottomSheetHandle(),
                Row(
                  children: [
                    Icon(
                      isShared ? Icons.groups : Icons.calendar_month,
                      color: primaryColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        isShared
                            ? 'Chi tiết vé vãng lai'
                            : 'Chi tiết lịch đặt sân',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    _statusChip(displayStatusLabel, displayStatusColor),
                  ],
                ),
                const SizedBox(height: 16),
                _detailCard(
                  children: [
                    _detailRow(
                      isShared ? 'Mã vé' : 'Mã booking',
                      (isShared
                                  ? booking['participantId']
                                  : booking['bookingId'])
                              ?.toString() ??
                          '-',
                    ),
                    _detailRow(
                      'Khu sân',
                      booking['rentalArea']?['rentalAreaName'] ?? '-',
                    ),
                    _detailRow(
                      'Sân',
                      slots.isNotEmpty ? slots[0]['courtCode'] ?? '-' : '-',
                    ),
                    _detailRow('Ngày', _formatDate(booking['startTime'])),
                    _detailRow(
                      'Khung giờ',
                      '${_formatTime(booking['startTime'])} - ${_formatTime(booking['endTime'])}',
                    ),
                    if (!isShared)
                      _detailRow('Người đặt', booking['userName'] ?? '-'),
                    if (!isShared)
                      _detailRow('SĐT', booking['phoneNumber'] ?? '-'),
                  ],
                ),
                const SizedBox(height: 12),

                _detailCard(
                  children: isShared
                      ? [
                          _moneyRow(
                            'Giá vé/người',
                            booking['pricePerTicket'],
                            Colors.black54,
                          ),
                          _detailRow(
                            'Số lượng',
                            '${booking['ticketQuantity'] ?? 1} vé',
                          ),
                          const Divider(height: 20, color: Colors.black12),
                          _moneyRow(
                            'Tổng tiền vé',
                            displayPrice,
                            Colors.orange,
                          ),
                        ]
                      : [
                          _moneyRow(
                            'Tổng tiền',
                            booking['totalPrice'],
                            Colors.black,
                          ),
                          _moneyRow(
                            'Đã cọc',
                            booking['depositAmount'],
                            Colors.orange,
                          ),
                          _moneyRow(
                            'Còn lại',
                            booking['remainingAmount'],
                            Colors.red,
                          ),
                          _detailRow(
                            'Phương thức',
                            booking['paymentMethod']?.toString() ?? '-',
                          ),
                        ],
                ),
                const SizedBox(height: 12),
                _slotListCard(slots),

                if (isShared && ticketStatus == 'PENDING') ...[
                  const SizedBox(height: 24),
                  if (hasProof)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.hourglass_top_rounded, color: Colors.blue),
                          SizedBox(width: 8),
                          Text(
                            'Đang chờ chủ sân duyệt...',
                            style: TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        if (booking['participantId'] != null) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TicketPaymentProofScreen(
                                participantId: booking['participantId']
                                    .toString(),
                              ),
                            ),
                          ).then((_) => _loadBookings());
                        } else {
                          _showError(
                            "Dữ liệu vé chưa đồng bộ, vui lòng tải lại trang.",
                          );
                        }
                      },
                      icon: const Icon(
                        Icons.qr_code_scanner,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Thanh Toán Vé Ngay',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        minimumSize: const Size(double.infinity, 52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                ],

                if (canCancel) ...[
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _handleCancelBooking(booking),
                    icon: const Icon(
                      Icons.cancel_outlined,
                      color: Colors.white,
                    ),
                    label: Text(
                      isShared ? 'Hủy Vé Vãng Lai' : 'Hủy Lịch Đặt Sân',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
            );
          },
        );
      },
    );
  }

  Widget _bottomSheetHandle() {
    return Column(
      children: [
        Center(
          child: Container(
            width: 42,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        const SizedBox(height: 18),
      ],
    );
  }

  Widget _infoBox({
    required String title,
    required String content,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: color, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(content, style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailCard({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 105,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _moneyRow(String label, dynamic value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Text(
            _formatMoney(value),
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _slotListCard(List slots) {
    return _detailCard(
      children: [
        const Text(
          'Danh sách khung giờ',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        if (slots.isEmpty)
          const Text('Không có khung giờ')
        else
          ...slots.map<Widget>((s) {
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s['courtCode']?.toString() ?? '-',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_formatDate(s['startTime'])} ${_formatTime(s['startTime'])} - ${_formatTime(s['endTime'])}',
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    _formatMoney(s['price']),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          }).toList(),
      ],
    );
  }

  Widget _intentCard(dynamic intent) {
    final status = _effectiveIntentStatus(intent);
    final slots = intent['slots'] ?? [];
    final courtCode = slots.isNotEmpty ? slots[0]['courtCode'] ?? '-' : '-';
    final color = _statusColor(status);

    IconData icon;
    switch (status) {
      case 'EXPIRED':
        icon = Icons.timer_off_outlined;
        break;
      case 'REJECTED':
        icon = Icons.highlight_off_rounded;
        break;
      case 'CANCELLED':
        icon = Icons.cancel_outlined;
        break;
      case 'PENDING_OWNER_CONFIRM':
        icon = Icons.hourglass_top_rounded;
        break;
      default:
        icon = Icons.account_balance_wallet_outlined;
    }

    return InkWell(
      onTap: () => _showIntentDetail(intent),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(14),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color.withOpacity(0.12),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    intent['rentalAreaName']?.toString() ?? courtCode,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                _statusChip(_intentStatusLabel(status), color),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Sân: $courtCode',
              style: const TextStyle(
                color: Colors.black54,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: primaryColor),
                const SizedBox(width: 6),
                Text(_formatDate(intent['startTime'])),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: primaryColor),
                const SizedBox(width: 6),
                Text(
                  '${_formatTime(intent['startTime'])} - ${_formatTime(intent['endTime'])}',
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'Mã đơn: ${(intent['bookingIntentId'] ?? '').toString().length >= 8 ? intent['bookingIntentId'].toString().substring(0, 8) : intent['bookingIntentId'] ?? '-'}...',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    color: Colors.black45,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  _formatMoney(intent['previewPrice']),
                  style: const TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.grey.shade500),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _bookingCard(dynamic booking) {
    final slots = booking['slots'] ?? [];
    final status = booking['bookingStatus']?.toString() ?? '';
    final rentalAreaName = booking['rentalArea']?['rentalAreaName'] ?? '-';
    final courtCode = slots.isNotEmpty ? slots[0]['courtCode'] ?? '-' : '-';

    final isShared = booking['bookingType'] == 'SHARED';
    final ticketStatus = booking['ticketPaymentStatus']?.toString() ?? '';

    final hasProof = _hasProof(booking);

    final displayStatusLabel = isShared
        ? _getSharedTicketStatusLabel(ticketStatus, hasProof)
        : _bookingStatusLabel(status);
    final displayStatusColor = isShared
        ? _getSharedTicketStatusColor(ticketStatus, hasProof)
        : _statusColor(status);
    final displayPrice = isShared
        ? (booking['ticketAmount'] ?? booking['pricePerTicket'] ?? 0)
        : booking['totalPrice'];

    return InkWell(
      onTap: () => _showBookingDetail(booking),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(14),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: (isShared ? Colors.teal : primaryColor)
                      .withOpacity(0.12),
                  child: Icon(
                    isShared ? Icons.groups : Icons.sports_sharp,
                    color: isShared ? Colors.teal : primaryColor,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    courtCode,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                _statusChip(displayStatusLabel, displayStatusColor),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              rentalAreaName,
              style: const TextStyle(color: Colors.black54, fontSize: 13),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: primaryColor),
                const SizedBox(width: 6),
                Text(_formatDate(booking['startTime'])),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: primaryColor),
                const SizedBox(width: 6),
                Text(
                  '${_formatTime(booking['startTime'])} - ${_formatTime(booking['endTime'])}',
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  isShared
                      ? 'Vé: ${(booking['participantId'] ?? '').toString().length >= 8 ? booking['participantId'].toString().substring(0, 8) : booking['participantId'] ?? '-'}...'
                      : 'Mã: ${(booking['bookingId'] ?? '').toString().length >= 8 ? booking['bookingId'].toString().substring(0, 8) : booking['bookingId'] ?? '-'}...',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    color: Colors.black45,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  _formatMoney(displayPrice),
                  style: const TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.grey.shade500),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _pendingTab() {
    if (loadingIntents || loadingBookings) {
      return const Center(child: CircularProgressIndicator());
    }

    final pendingIntents = _pendingBookingIntents;

    return RefreshIndicator(
      color: primaryColor,
      onRefresh: _loadAllData,
      child: (pendingIntents.isEmpty && pendingSharedTickets.isEmpty)
          ? _emptyView('Không có đơn chờ xác nhận', Icons.pending_actions)
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ...pendingIntents.map((e) => _intentCard(e)),
                ...pendingSharedTickets.map((e) => _bookingCard(e)),
              ],
            ),
    );
  }

  Widget _historyTab() {
    if (loadingIntents || loadingBookings) {
      return const Center(child: CircularProgressIndicator());
    }

    final failedIntents = _failedBookingIntents;

    return RefreshIndicator(
      color: primaryColor,
      onRefresh: _loadAllData,
      child: (confirmedBookings.isEmpty && failedIntents.isEmpty)
          ? _emptyView(
              'Chưa có đơn thành công hoặc thất bại',
              Icons.history_rounded,
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ...confirmedBookings.map((e) => _bookingCard(e)),
                ...failedIntents.map((e) => _intentCard(e)),
              ],
            ),
    );
  }

  @override
  void dispose() {
    tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _backToProfile();
      },
      child: Scaffold(
        backgroundColor: Colors.grey.shade100,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _backToProfile,
          ),
          title: const Text(
            'Lịch sử đặt sân',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          bottom: TabBar(
            controller: tabController,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            tabs: const [
              Tab(text: 'Chờ xác nhận'),
              Tab(text: 'Thành công / Thất bại'),
            ],
          ),
        ),
        body: TabBarView(
          controller: tabController,
          children: [_pendingTab(), _historyTab()],
        ),
      ),
    );
  }
}
