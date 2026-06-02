import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ảnh chuyển khoản')),
      );
      return;
    }

    setState(() => uploading = true);

    try {
      await bookingService.uploadPaymentProof(
        bookingIntentId: widget.bookingId,
        imagePath: selectedImage!.path,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Upload ảnh thành công, vui lòng chờ owner xác nhận'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.popUntil(context, (route) => route.isFirst);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload ảnh thất bại: $e'),
          backgroundColor: Colors.red,
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
        padding: const EdgeInsets.all(16),
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
                  'Upload ảnh chuyển khoản',
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
                _infoRow('Số tài khoản', accountNumber),
                _infoRow('Chủ tài khoản', accountName),
                _infoRow('Số tiền', totalStr),
                _infoRow('Nội dung', transferContent),
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
                    errorBuilder: (_, __, ___) {
                      return const Text('Không tải được mã QR');
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

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? 'Chưa có' : value,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
