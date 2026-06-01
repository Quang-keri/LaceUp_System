import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:mobile/views/area/booking/payment_screen.dart';
import '../../../models/court.dart';
import '../../../models/match.dart';
import '../../../models/rental_area.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/match_service.dart';
import 'match_config_widget.dart';

class BookingFormScreen extends StatefulWidget {
  final CourtResponse court;
  final DateTime selectedDate;
  final List<String> selectedSlots;

  final bool isMatchMode;
  final MatchConfigData? matchConfig;

  final RentalAreaResponse? rentalArea;

  const BookingFormScreen({
    super.key,
    required this.court,
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

  late double duration;
  late String timeRangeDisplay;
  late String startTimeStr;
  late double totalPrice;
  bool _isLoading = false;

  late DateTime startDateTime;
  late DateTime endDateTime;

  @override
  void initState() {
    super.initState();
    _calculateBookingInfo();

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

  void _calculateBookingInfo() {
    duration = widget.selectedSlots.length * 0.5;
    startTimeStr = widget.selectedSlots.isNotEmpty
        ? widget.selectedSlots.first
        : '17:00';

    // 1. Tính toán chính xác End Time
    final timeParts = startTimeStr.split(':');
    startDateTime = DateTime(
      widget.selectedDate.year,
      widget.selectedDate.month,
      widget.selectedDate.day,
      int.parse(timeParts[0]),
      int.parse(timeParts[1]),
    );

    endDateTime = startDateTime.add(Duration(minutes: (duration * 60).toInt()));
    final endTimeStr = DateFormat('HH:mm').format(endDateTime);

    timeRangeDisplay = '$startTimeStr - $endTimeStr';

    // 2. Tính toán giá tiền chi tiết theo Price Rules
    _calculatePrice();
  }

  void _calculatePrice() {
    double calcPrice = 0.0;
    int chunks = (duration * 2).toInt();
    DateTime currentTime = startDateTime;

    // Xác định Ngày thường (WEEKDAY) hay Cuối tuần (WEEKEND)
    String dayType =
        (widget.selectedDate.weekday >= 1 && widget.selectedDate.weekday <= 5)
        ? 'WEEKDAY'
        : 'WEEKEND';

    final rules = widget.court.priceRules;

    if (rules.isEmpty) {
      double basePrice = widget.court.pricePerHour > 0
          ? widget.court.pricePerHour.toDouble()
          : 0.0;
      calcPrice = basePrice * duration;
    } else {
      // Duyệt qua từng khung 30 phút để map giá tương ứng
      for (int i = 0; i < chunks; i++) {
        int currentMins = currentTime.hour * 60 + currentTime.minute;
        double chunkPricePerHour = widget.court.pricePerHour.toDouble();

        for (var rule in rules) {
          // Bỏ qua nếu rule không khớp loại ngày
          if (rule.dayType != null &&
              rule.dayType != 'ALL' &&
              rule.dayType != dayType) {
            continue;
          }
          if (rule.startTime != null && rule.endTime != null) {
            try {
              final sParts = rule.startTime!.split(':');
              final eParts = rule.endTime!.split(':');
              int rStartMins = int.parse(sParts[0]) * 60 + int.parse(sParts[1]);
              int rEndMins = int.parse(eParts[0]) * 60 + int.parse(eParts[1]);

              // Nếu giờ kết thúc là 00:00 (qua ngày hôm sau), đổi thành 24 * 60 = 1440
              if (rEndMins == 0 && rStartMins > 0) rEndMins = 1440;

              if (currentMins >= rStartMins && currentMins < rEndMins) {
                chunkPricePerHour = rule.pricePerHour.toDouble();
                break;
              }
            } catch (e) {
              // Ignore parse error
            }
          }
        }
        calcPrice += chunkPricePerHour * 0.5; // Mỗi chunk tính 30 phút (0.5h)
        currentTime = currentTime.add(const Duration(minutes: 30));
      }
    }

    setState(() {
      totalPrice = calcPrice;
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _onSubmit() async {
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập tên và số điện thoại')),
      );
      return;
    }

    if (widget.isMatchMode) {
      _createMatchFlow();
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentScreen(
            court: widget.court,
            selectedDate: widget.selectedDate,
            timeStr: timeRangeDisplay,
            duration: duration,
            quantity: 1,
            totalPrice: totalPrice,
          ),
        ),
      );
    }
  }

  Future<void> _createMatchFlow() async {
    if (widget.matchConfig == null) return;

    setState(() => _isLoading = true);

    try {
      final payload = MatchRequest(
        courtId: widget.court.courtId,
        categoryId: widget.court.categoryId,

        street: widget.rentalArea?.address?.street ?? "Không rõ",
        ward: widget.rentalArea?.address?.ward ?? "Không rõ",
        cityId: widget.rentalArea?.cityId ?? 1,

        startTime: startDateTime.toIso8601String(),
        endTime: endDateTime.toIso8601String(),
        maxPlayers: widget.matchConfig!.maxPlayers,
        minPlayersToStart: widget.matchConfig!.minPlayersToStart,
        isRecurring: false,
        matchType: widget.matchConfig!.matchType,
        note: widget.matchConfig!.note.isEmpty
            ? _noteController.text
            : widget.matchConfig!.note,
      );

      await matchService.createMatch(payload);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tạo kèo thành công!'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tạo kèo: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy').format(widget.selectedDate);
    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(totalPrice);

    final screenTitle = widget.isMatchMode
        ? 'Xác nhận tạo kèo'
        : 'Xác nhận đặt sân';
    final actionBtnText = widget.isMatchMode
        ? 'Xác nhận tạo kèo'
        : 'Xác nhận thanh toán';

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
        centerTitle: false,
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
                'Thông tin người tạo',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              _buildTextField(controller: _nameController, hintText: 'Họ tên'),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _phoneController,
                hintText: 'Số điện thoại',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _noteController,
                hintText: 'Ghi chú thêm (nếu có)',
                maxLines: 3,
              ),
              const SizedBox(height: 24),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          widget.court.courtName,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          NumberFormat.currency(
                            locale: 'vi_VN',
                            symbol: 'VNĐ',
                          ).format(totalPrice / duration), // Hiển thị giá tb 1h
                          style: TextStyle(
                            color: primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$dateStr • $timeRangeDisplay ($duration giờ)',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),

                    if (widget.isMatchMode && widget.matchConfig != null) ...[
                      const Divider(height: 24),
                      Text(
                        'Thể thức: ${widget.matchConfig!.matchType}',
                        style: TextStyle(
                          color: confirmColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Số người: Tối đa ${widget.matchConfig!.maxPlayers} (Chia đều ${widget.matchConfig!.minPlayersToStart}/đội)',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 13,
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 4),
                      const Text(
                        'Số lượng sân: 1',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),

              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Tổng chi phí dự kiến',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: Colors.black54,
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
              const SizedBox(height: 24),

              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Hủy',
                        style: TextStyle(color: Colors.black87),
                      ),
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
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
          borderSide: BorderSide(color: primaryColor),
        ),
      ),
    );
  }
}
