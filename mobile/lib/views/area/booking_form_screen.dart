import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/views/area/payment_screen.dart';
import '../../models/court.dart';

class BookingFormScreen extends StatefulWidget {
  final CourtResponse court;
  final DateTime selectedDate;
  final List<String> selectedSlots;

  const BookingFormScreen({
    super.key,
    required this.court,
    required this.selectedDate,
    required this.selectedSlots,
  });

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color confirmColor = const Color(0xFFEA580C); // Màu cam

  // Controllers cho form nhập liệu
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  late double duration;
  late String timeRangeDisplay;
  late double totalPrice;

  @override
  void initState() {
    super.initState();
    _calculateBookingInfo();
  }

  void _calculateBookingInfo() {
    // Mỗi slot cách nhau 30 phút -> duration = số slot * 0.5 giờ
    duration = widget.selectedSlots.length * 0.5;

    // Tạo chuỗi thời gian hiển thị (VD: 17:00 - 18:00)
    String startTime = widget.selectedSlots.first;
    // Để tính giờ kết thúc, ta lấy giờ của slot cuối + 30 phút
    // (Ở đây làm đơn giản hiển thị slot đầu - slot cuối, bạn có thể parse TimeOfDay để cộng thêm 30p)
    String endTime = widget.selectedSlots.last;

    timeRangeDisplay = '$startTime - $endTime';

    final double pricePerHour = widget.court.pricePerHour > 0 ? widget.court.pricePerHour : 80000;
    totalPrice = pricePerHour * duration;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _goToPayment() {
    // Validate cơ bản
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập tên và số điện thoại')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          court: widget.court,
          selectedDate: widget.selectedDate,
          timeStr: timeRangeDisplay,
          duration: duration,
          quantity: 1, // Mặc định 1 sân như trên web
          totalPrice: totalPrice,
          // Bạn có thể truyền thêm name, phone, note qua PaymentScreen nếu cần
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy').format(widget.selectedDate);
    final totalStr = NumberFormat.currency(locale: 'vi_VN', symbol: 'VNĐ').format(totalPrice);

    return Scaffold(
      backgroundColor: Colors.grey.shade100, // Nền xám nhẹ để nổi bật form trắng
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Xác nhận đặt sân',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF4338CA)), // Màu chữ title giống hình
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Thông tin người đặt',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
              ),
              const SizedBox(height: 12),

              // Input Tên
              _buildTextField(
                controller: _nameController,
                hintText: 'Tên người đặt (VD: Renter main)',
              ),
              const SizedBox(height: 12),

              // Input SĐT
              _buildTextField(
                controller: _phoneController,
                hintText: 'Số điện thoại',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),

              // Input Ghi chú
              _buildTextField(
                controller: _noteController,
                hintText: 'Ghi chú thêm (nếu có)',
                maxLines: 3,
              ),

              const SizedBox(height: 24),

              // Box tóm tắt thông tin sân
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
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        Text(
                          NumberFormat.currency(locale: 'vi_VN', symbol: 'VNĐ').format(widget.court.pricePerHour),
                          style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$dateStr • $timeRangeDisplay (${duration} giờ)',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Số lượng sân: 1',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),

              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(),
              ),

              // Tổng chi phí
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Tổng chi phí dự kiến',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.black54),
                  ),
                  Text(
                    totalStr,
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: primaryColor),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Nút actions
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      child: const Text('Hủy', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _goToPayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: confirmColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text(
                        'Xác nhận và thanh toán',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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