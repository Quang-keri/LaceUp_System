import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
import 'package:mobile/utils/error_utils.dart';
import 'package:mobile/utils/top_message.dart';
import 'package:mobile/views/profile/history/booking_history_screen.dart';
import '../../../models/rental_area.dart';
import '../../../models/selected_booking_slot.dart';
import '../../../services/booking_service.dart';

class PaymentProofScreen extends StatefulWidget {
  final String bookingId;
  final RentalAreaResponse? rentalArea;
  final List<SelectedBookingSlot> selectedSlots;
  final double totalPrice;
  final dynamic bookingResult;

  const PaymentProofScreen({
    super.key,
    required this.bookingId,
    required this.rentalArea,
    required this.selectedSlots,
    required this.totalPrice,
    this.bookingResult,
  });

  @override
  State<PaymentProofScreen> createState() => _PaymentProofScreenState();
}

class _PaymentProofScreenState extends State<PaymentProofScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color confirmColor = const Color(0xFFEA580C);

  File? selectedImage;
  bool uploading = false;

  String get bankName {
    return widget.bookingResult?['bankName']?.toString() ??
        'Chưa cấu hình ngân hàng';
  }

  String get accountNumber {
    return widget.bookingResult?['accountNumber']?.toString() ?? '';
  }

  String get accountName {
    return widget.bookingResult?['accountName']?.toString() ??
        widget.rentalArea?.contactName ??
        'Chủ sân';
  }

  String get transferContent {
    return widget.bookingResult?['transferContent']?.toString() ??
        'LACEUP ${widget.bookingId.substring(0, 8)}';
  }

  String get vietQrUrl {
    return widget.bookingResult?['vietQrUrl']?.toString() ?? '';
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();

    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (picked == null) return;

    setState(() {
      selectedImage = File(picked.path);
    });
  }

  Future<void> _uploadProof() async {
    if (selectedImage == null) {
      showTopMessage(
        context,
        'Vui lòng chọn ảnh chuyển khoản',
      );
      return;
    }

    setState(() => uploading = true);

    debugPrint('====================================');
    debugPrint('[PAYMENT DEBUG] Bắt đầu gọi API upload...');
    debugPrint('[PAYMENT DEBUG] File: ${selectedImage!.path}');
    debugPrint('====================================');

    try {
      final result = await bookingService.uploadPaymentProof(
        bookingIntentId: widget.bookingId,
        imagePath: selectedImage!.path,
      );

      if (!mounted) return;

      // IN RA KẾT QUẢ KHI THÀNH CÔNG
      debugPrint('[PAYMENT DEBUG] UPLOAD THÀNH CÔNG!');
      debugPrint('[PAYMENT DEBUG] Result trả về: $result');

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tải ảnh thành công, vui lòng chờ chủ sân xác nhận'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const BookingHistoryScreen(),
        ),
      );
    } catch (e, stackTrace) {
      // IN RA TOÀN BỘ THÔNG TIN LỖI TRONG CONSOLE
      debugPrint('🛑 ========= LỖI RỒI - XEM CHI TIẾT TẠI ĐÂY ========= 🛑');
      debugPrint('[PAYMENT DEBUG] Kiểu dữ liệu của Lỗi: ${e.runtimeType}');
      debugPrint('[PAYMENT DEBUG] Thông báo lỗi thô (e.toString()): $e');

      // Kiểm tra xem lỗi có kèm Response từ Server không (Thường gặp nếu dùng thư viện Dio)
      try {
        final dynamic errorObj = e;
        if (errorObj.response != null) {
          debugPrint('[PAYMENT DEBUG] 👉 Mã lỗi HTTP từ Server: ${errorObj.response?.statusCode}');
          debugPrint('[PAYMENT DEBUG] 👉 Data lỗi cụ thể từ Server: ${errorObj.response?.data}');
        }
      } catch (_) {
        // Bỏ qua nếu đối tượng lỗi không phải là Network Error/DioError
      }

      debugPrint('[PAYMENT DEBUG] Vị trí lỗi chính xác (Stack Trace):');
      debugPrint(stackTrace.toString());
      debugPrint('🛑 ================================================= 🛑');

      if (!mounted) return;

      // HIỂN THỊ CẢ LỖI THÔ LÊN MÀN HÌNH (Gom cả message lẫn kết quả lỗi thô)
      final cleanMessage = getErrorMessage(e);

      // Tạo chuỗi hiển thị bao gồm lỗi đã dịch và lỗi thô từ hệ thống
      String errorToDisplay = 'Thông báo: $cleanMessage\n\nLỗi hệ thống: $e';

      // Nếu có response data từ server thì cộng thêm vào để nhìn cho rõ
      try {
        final dynamic errorObj = e;
        if (errorObj.response?.data != null) {
          errorToDisplay += '\n\nServer Data: ${errorObj.response.data}';
        }
      } catch (_) {}

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: SingleChildScrollView(
            child: Text(
              errorToDisplay,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
            ),
          ),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 10), // Cho hiện 10 giây để kịp đọc/chụp màn hình
          action: SnackBarAction(
            label: 'ĐÓNG',
            textColor: Colors.white,
            onPressed: () {},
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(widget.totalPrice);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text(
          'Chuyển khoản VietQR',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      bottomNavigationBar: Container(
        // Sửa dòng padding này để chừa khoảng trống cho nút Home
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 16 + MediaQuery.of(context).padding.bottom,
        ),
        color: Colors.white,
        child: ElevatedButton(
          onPressed: uploading ? null : _uploadProof,
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor,
            minimumSize: const Size(double.infinity, 52),
          ),
          child: uploading
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text(
            'Xác nhận đã tải ảnh chuyển khoản',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Thông tin chuyển khoản chủ sân',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                _infoRow('Ngân hàng', bankName),

                _infoRow(
                  'Số tài khoản',
                  accountNumber,
                  enableCopy: true,
                ),

                _infoRow(
                  'Chủ tài khoản',
                  accountName,
                  enableCopy: true,
                ),

                _infoRow('Số tiền', totalStr),

                _infoRow(
                  'Nội dung',
                  transferContent,
                  enableCopy: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: _cardDecoration(),
            child: Column(
              children: [
                const Text(
                  'Quét mã VietQR',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                if (vietQrUrl.isNotEmpty)
                  Image.network(
                    vietQrUrl,
                    height: 260,
                    fit: BoxFit.contain,
                    headers: const {
                      'User-Agent': 'Mozilla/5.0',
                      'Accept': 'image/png,image/*,*/*',
                    },
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;

                      return const SizedBox(
                        height: 260,
                        child: Center(child: CircularProgressIndicator()),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return const SizedBox(
                        height: 120,
                        child: Center(
                          child: Text(
                            'Không tải được mã QR',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      );
                    },
                  )
                else
                  const Text(
                    'Owner chưa cấu hình tài khoản ngân hàng',
                    style: TextStyle(color: Colors.red),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ảnh chuyển khoản',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                if (selectedImage != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(
                      selectedImage!,
                      height: 220,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  )
                else
                  Container(
                    height: 180,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: const Text('Chưa chọn ảnh'),
                  ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.image),
                  label: const Text('Chọn ảnh từ thư viện'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
      ],
    );
  }

  Widget _infoRow(
      String label,
      String value, {
        bool enableCopy = false,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(color: Colors.black54),
            ),
          ),

          Expanded(
            child: Text(
              value.isEmpty ? 'Chưa có' : value,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          if (enableCopy && value.isNotEmpty)
            IconButton(
              icon: Icon(
                Icons.copy_rounded,
                size: 20,
                color: primaryColor,
              ),
              onPressed: () async {
                await Clipboard.setData(
                  ClipboardData(text: value),
                );

                if (!mounted) return;

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã sao chép $label'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
