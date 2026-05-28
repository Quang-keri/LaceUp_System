import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/court.dart';

class PaymentScreen extends StatefulWidget {
  final CourtResponse court;
  final DateTime selectedDate;
  final String timeStr;
  final double duration;
  final int quantity;
  final double totalPrice;

  const PaymentScreen({
    super.key,
    required this.court,
    required this.selectedDate,
    required this.timeStr,
    required this.duration,
    required this.quantity,
    required this.totalPrice,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  int paymentRatio = 100;
  String paymentMethod = 'VNPAY';

  final TextEditingController nameController = TextEditingController(
    text: 'Renter main',
  );
  final TextEditingController phoneController = TextEditingController(
    text: '0931000011',
  );
  final TextEditingController noteController = TextEditingController();

  void _submitBooking() {
    print('Thanh toán với: $paymentMethod, Đóng: $paymentRatio%');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chuyển hướng đến cổng thanh toán...')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final priceToPay = widget.totalPrice * (paymentRatio / 100);
    final dateStr = DateFormat('dd/MM/yyyy').format(widget.selectedDate);
    final totalFormat = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(widget.totalPrice);
    final payFormat = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(priceToPay);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Xác nhận đặt sân',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Hủy', style: TextStyle(color: Colors.black)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _submitBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange, // Đảm bảo nút tông màu cam
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Xác nhận và thanh toán',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Thông tin người đặt',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: nameController,
            decoration: InputDecoration(
              labelText: 'Họ và tên',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Số điện thoại',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: noteController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Ghi chú thêm (nếu có)',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
            ),
          ),

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.black87),
              borderRadius: BorderRadius.circular(12),
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
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      totalFormat,
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '$dateStr • ${widget.timeStr} (${widget.duration} giờ)',
                  style: const TextStyle(color: Colors.black87),
                ),
                const SizedBox(height: 4),
                Text(
                  'Số lượng sân: ${widget.quantity}',
                  style: const TextStyle(color: Colors.black87),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'Tùy chọn thanh toán',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Container(
            color: Colors.white,
            child: Column(
              children: [
                RadioListTile<int>(
                  title: const Text('Thanh toán toàn bộ (100%)'),
                  value: 100,
                  groupValue: paymentRatio,
                  activeColor: primaryColor,
                  onChanged: (val) => setState(() => paymentRatio = val!),
                ),
                RadioListTile<int>(
                  title: const Text('Đặt cọc trước (50%)'),
                  value: 50,
                  groupValue: paymentRatio,
                  activeColor: primaryColor,
                  onChanged: (val) => setState(() => paymentRatio = val!),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tổng chi phí dự kiến',
                style: TextStyle(fontSize: 16),
              ),
              Text(
                totalFormat,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: primaryColor,
                ),
              ),
            ],
          ),
          if (paymentRatio == 50)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Số tiền cần cọc (50%)',
                    style: TextStyle(color: Colors.orange),
                  ),
                  Text(
                    payFormat,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
