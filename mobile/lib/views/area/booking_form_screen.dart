import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'payment_screen.dart'; // Import màn 3

class BookingFormScreen extends StatefulWidget {
  final Map<String, dynamic> court;
  final DateTime selectedDate;
  final String initialTime;

  const BookingFormScreen({
    super.key,
    required this.court,
    required this.selectedDate,
    required this.initialTime,
  });

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  double duration = 1.0; // Thời lượng (giờ)
  int quantity = 1;      // Số lượng sân

  void _goToPayment() {
    // Tính giá (dựa vào minPrice hoặc logic của bạn)
    final double pricePerHour = double.tryParse(widget.court['minPrice']?.toString() ?? '80000') ?? 80000;
    final double totalPrice = pricePerHour * duration * quantity;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          court: widget.court,
          selectedDate: widget.selectedDate,
          timeStr: widget.initialTime,
          duration: duration,
          quantity: quantity,
          totalPrice: totalPrice,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy').format(widget.selectedDate);
    final priceStr = NumberFormat.currency(locale: 'vi_VN', symbol: 'VNĐ').format(widget.court['minPrice'] ?? 80000);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text('Thông tin đặt sân', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: ElevatedButton(
          onPressed: _goToPayment,
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Đặt sân ngay', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Box thông tin sân
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                const Text('Sân áp dụng: ', style: TextStyle(color: Colors.grey)),
                Text(
                  widget.court['courtName'] ?? 'Sân Standard 01',
                  style: TextStyle(fontWeight: FontWeight.bold, color: primaryColor),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Hiển thị Giá
          Row(
            children: [
              const Text('Giá từ ', style: TextStyle(fontSize: 16)),
              Text(
                priceStr,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.deepOrange),
              ),
              const Text(' / giờ', style: TextStyle(color: Colors.grey)),
            ],
          ),
          const Divider(height: 32),

          // Form nhập liệu
          Row(
            children: [
              Expanded(
                child: _buildStaticField('Giờ bắt đầu', '${widget.initialTime} - ${DateFormat('dd/MM').format(widget.selectedDate)}'),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdownField('Thời lượng chơi', duration, [1.0, 1.5, 2.0, 3.0], (val) {
                  setState(() => duration = val as double);
                }),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildDropdownField('Số lượng sân', quantity, [1, 2, 3, 4], (val) {
                  setState(() => quantity = val as int);
                }),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStaticField('Loại sân', widget.court['category']?['categoryName'] ?? 'Sân thể thao'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStaticField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black54)),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
          child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, dynamic currentValue, List<dynamic> options, Function(dynamic) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black54)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<dynamic>(
              value: currentValue,
              isExpanded: true,
              items: options.map((val) => DropdownMenuItem(
                value: val,
                child: Text(val is double ? '$val giờ' : '$val sân'),
              )).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}