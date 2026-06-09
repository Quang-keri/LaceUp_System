import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/models/booking_price_helper.dart';
import 'package:mobile/utils/error_utils.dart';
import 'package:provider/provider.dart';

import '../../../models/match.dart';
import '../../../models/rental_area.dart';
import '../../../models/selected_booking_slot.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/booking_service.dart';
import '../../../services/match_service.dart';

import '../area_detail/payment_proof_screen.dart';
import 'match_config_widget.dart';

class BookingFormScreen extends StatefulWidget {
  final DateTime selectedDate;
  final List<SelectedBookingSlot> selectedSlots;
  final bool isMatchMode;
  final MatchConfigData? matchConfig;
  final RentalAreaResponse? rentalArea;

  const BookingFormScreen({
    super.key,
    required this.selectedDate,
    required this.selectedSlots,
    required this.isMatchMode,
    this.matchConfig,
    this.rentalArea,
  });

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color confirmColor = const Color(0xFFEA580C);

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  bool _isLoading = false;

  double get totalPrice => calculateTotalPrice(widget.selectedSlots);

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();

      if (authProvider.isLoggedIn) {
        if (authProvider.userName != null) {
          _nameController.text = authProvider.userName!;
        }

        final userPhone = authProvider.user?['phone'];
        if (userPhone != null) {
          _phoneController.text = userPhone.toString();
        }
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  String _toIsoDateTime(DateTime date, String time) {
    final parts = time.split(':');

    final dt = DateTime(
      date.year,
      date.month,
      date.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );

    return dt.toIso8601String();
  }

  Future<void> _onSubmit() async {
    if (_nameController.text
        .trim()
        .isEmpty ||
        _phoneController.text
            .trim()
            .isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập tên và số điện thoại')),
      );
      return;
    }

    if (widget.selectedSlots.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ít nhất 1 khung giờ')),
      );
      return;
    }

    if (widget.isMatchMode) {
      await _createMatchFlow();
      return;
    }

    await _createBookingIntentFlow();
  }

  Future<void> _createBookingIntentFlow() async {
    setState(() => _isLoading = true);

    try {
      final slotRequests = widget.selectedSlots.map((item) {
        return {
          'courtCopyId': item.courtCopyId,
          'startTime': _toIsoDateTime(item.date, item.startTime),
          'endTime': _toIsoDateTime(item.date, item.endTime),
        };
      }).toList();

      final response = await bookingService.createBookingIntent(
        userName: _nameController.text.trim(),
        userPhone: _phoneController.text.trim(),
        note: _noteController.text.trim(),
        slotRequests: slotRequests,
      );

      final result = response['result'] ?? response;

      final bookingId = result['bookingIntentId']?.toString();

      final totalPriceFromBe =
          double.tryParse(result['previewPrice']?.toString() ?? '') ??
              totalPrice;

      if (bookingId == null || bookingId.isEmpty) {
        throw Exception('API chưa trả về bookingId / bookingIntentId');
      }

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
              PaymentProofScreen(
                bookingId: bookingId,
                rentalArea: widget.rentalArea,
                selectedSlots: widget.selectedSlots,
                totalPrice: totalPriceFromBe,
                bookingResult: result,
              ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      final message = getErrorMessage(e);

      _showTopMessage(message, isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createMatchFlow() async {
    if (widget.matchConfig == null || widget.selectedSlots.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final firstSlot = widget.selectedSlots.first;

      final payload = MatchRequest(
        courtId: firstSlot.courtId,
        categoryId: firstSlot.court.categoryId,
        street: widget.rentalArea?.address?.street ?? 'Không rõ',
        ward: widget.rentalArea?.address?.ward ?? 'Không rõ',
        cityId: widget.rentalArea?.cityId ?? 1,
        startTime: _toIsoDateTime(firstSlot.date, firstSlot.startTime),
        endTime: _toIsoDateTime(firstSlot.date, firstSlot.endTime),
        maxPlayers: widget.matchConfig!.maxPlayers,
        minPlayersToStart: widget.matchConfig!.minPlayersToStart,
        isRecurring: false,
        matchType: widget.matchConfig!.matchType,
        note: widget.matchConfig!.note.isEmpty
            ? _noteController.text
            : widget.matchConfig!.note,
        playerCount: widget.matchConfig!.playerCount,
      );

      await matchService.createMatch(payload);

      if (!mounted) return;

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
                  'Tạo trận thành công!',
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
              'Đã tạo trận đấu thành công!\nHãy đến trang Trận đấu của tôi để thanh toán nhé.',
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
                    backgroundColor: confirmColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: () {
                    Navigator.of(dContext).pop();
                    Navigator.of(context).pushNamedAndRemoveUntil(
                      '/my-matches',
                          (route) => route.isFirst,
                    );
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
    } catch (e) {
      if (!mounted) return;

      final message = getErrorMessage(e);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getMatchTypeName(String type) {
    switch (type) {
      case 'RANKED':
        return 'Đánh Rank (Tích điểm)';
      case 'NORMAL':
      default:
        return 'Giao lưu (Chơi vui vẻ)';
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(totalPrice);

    final screenTitle = widget.isMatchMode
        ? 'Xác nhận tạo trận'
        : 'Xác nhận đặt sân';

    final actionBtnText = widget.isMatchMode
        ? 'Xác nhận tạo trận'
        : 'Đặt lịch và chuyển khoản';

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: Text(
          screenTitle,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF4338CA),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Thông tin người đặt',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 12),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _nameController,
                      hintText: 'Họ tên',
                      readOnly: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _phoneController,
                      hintText: 'Số điện thoại',
                      keyboardType: TextInputType.phone,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    flex: 8,
                    child: _buildTextField(
                      controller: _noteController,
                      hintText: 'Ghi chú thêm (nếu có)',
                      maxLines: 3,
                    ),
                  ),
                  const Spacer(flex: 2),
                ],
              ),
              const SizedBox(height: 24),

              const Text(
                'Danh sách sân đã chọn',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 12),

              ...widget.selectedSlots.map((item) {
                final price = calculateSlotPrice(item);

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.orange.shade100),
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${item.courtName} - ${item.courtCode}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${DateFormat('dd/MM/yyyy').format(
                                  item.date)} • ${item.startTime} - ${item
                                  .endTime}',
                              style: const TextStyle(
                                color: Colors.black54,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              '${item.duration} giờ • ${item.categoryName}',
                              style: TextStyle(
                                color: primaryColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (!widget.isMatchMode)
                        Text(
                          NumberFormat.currency(
                            locale: 'vi_VN',
                            symbol: 'đ',
                          ).format(price),
                          style: const TextStyle(
                            color: Color(0xFFEA580C),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                );
              }),

              if (widget.isMatchMode && widget.matchConfig != null) ...[
                const SizedBox(height: 16),
                const Text(
                  'Thông tin trận đấu',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: primaryColor.withOpacity(0.2)),
                    color: const Color(0xFFF9F5FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      _buildMatchInfoRow(
                        'Thể thức',
                        _getMatchTypeName(widget.matchConfig!.matchType),
                        isHighlight: true,
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Divider(height: 1, color: Colors.black12),
                      ),
                      _buildMatchInfoRow(
                        'Tổng số người',
                        '${widget.matchConfig!.maxPlayers} người',
                      ),
                      const SizedBox(height: 10),
                      _buildMatchInfoRow(
                        'Số người / Team',
                        '${widget.matchConfig!.minPlayersToStart} người',
                      ),
                      const SizedBox(height: 10),
                      _buildMatchInfoRow(
                        'Bạn tham gia',
                        '${widget.matchConfig!.playerCount} người',
                        isOrange: true,
                      ),
                    ],
                  ),
                ),
              ],

              if (!widget.isMatchMode) ...[
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tổng tiền',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      totalStr,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                        color: primaryColor,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 24),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Hủy'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _onSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: confirmColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
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
                          : Text(
                        actionBtnText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMatchInfoRow(String label,
      String value, {
        bool isHighlight = false,
        bool isOrange = false,
      }) {
    Color valueColor = Colors.black87;
    if (isHighlight) valueColor = primaryColor;
    if (isOrange) valueColor = confirmColor;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.black54,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  // ĐÃ SỬA: Cập nhật hàm này để hỗ trợ trạng thái readOnly
  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool readOnly = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      readOnly: readOnly,
      style: TextStyle(color: readOnly ? Colors.black54 : Colors.black87),
      decoration: InputDecoration(
        hintText: hintText,
        fillColor: readOnly ? Colors.grey.shade100 : Colors.white,
        // Đổi màu nền nếu readOnly
        filled: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: readOnly ? Colors.grey.shade300 : primaryColor,
          ),
        ),
      ),
    );
  }

  void _showTopMessage(String message, {bool isError = true}) {
    final overlay = Overlay.of(context);

    final overlayEntry = OverlayEntry(
      builder: (context) =>
          Positioned(
            top: MediaQuery
                .of(context)
                .padding
                .top + 12,
            left: 16,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isError ? Colors.red : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
    );

    overlay.insert(overlayEntry);

    Future.delayed(const Duration(seconds: 3), () {
      overlayEntry.remove();
    });
  }
}
