import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../models/match.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/match_service.dart';
import '../../../services/payment_service.dart';
import '../../../utils/error_utils.dart';
import 'my_match_screen.dart';

class MatchPaymentScreen extends StatefulWidget {
  final String matchId;

  const MatchPaymentScreen({super.key, required this.matchId});

  @override
  State<MatchPaymentScreen> createState() => _MatchPaymentScreenState();
}

class _MatchPaymentScreenState extends State<MatchPaymentScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color confirmColor = const Color(0xFFEA580C);

  bool isLoading = true;
  bool isUploading = false;
  File? selectedImage;

  MatchResponse? matchDetail;
  String? _registrationId;
  double _amountDue = 0;
  dynamic _paymentResult; // Biến hứng dữ liệu từ Backend

  @override
  void initState() {
    super.initState();
    _loadPaymentIntent();
  }

  Future<void> _loadPaymentIntent() async {
    try {
      setState(() => isLoading = true);

      matchDetail = await matchService.getMatchDetail(widget.matchId);

      if (matchDetail == null) {
        throw Exception("Không tìm thấy thông tin trận đấu");
      }

      final authProvider = context.read<AuthProvider>();
      final myUserId = authProvider.user?['userId'];

      final myRegistration = matchDetail!.participants.firstWhere(
        (p) => p.userId == myUserId,
        orElse: () => throw Exception(
          "Bạn không nằm trong danh sách đăng ký của trận này",
        ),
      );

      _registrationId = myRegistration.registrationId;
      _amountDue = (myRegistration.amountDue ?? 0).toDouble();

      if (_registrationId == null) {
        throw Exception("Không tìm thấy mã đăng ký (registrationId) của bạn.");
      }

      // --- GỌI API BACKEND ĐỂ TẠO THANH TOÁN VÀ LẤY VIETQR URL ---
      final checkoutRes = await paymentService.checkoutMatchJoin(
        _registrationId!,
        'VIET_QR',
      );

      if (checkoutRes['code'] == 201 || checkoutRes['code'] == 200) {
        _paymentResult = checkoutRes['result'];
      } else {
        throw Exception(checkoutRes['message'] ?? "Không thể tạo giao dịch");
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(getErrorMessage(e)),
          backgroundColor: Colors.red,
        ),
      );
      Navigator.pop(context); // Trở về nếu lỗi
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  // --- ĐỌC DỮ LIỆU ĐÃ ĐƯỢC XỬ LÝ TỪ BACKEND ---
  String get bankName =>
      _paymentResult?['bankName']?.toString() ?? 'Chưa cấu hình ngân hàng';

  String get accountNumber =>
      _paymentResult?['accountNumber']?.toString() ?? '';

  String get accountName =>
      _paymentResult?['accountName']?.toString() ?? 'Chủ sân';

  String get transferContent =>
      _paymentResult?['transferContent']?.toString() ??
      'LACEUP MATCH ${widget.matchId.substring(0, 8).toUpperCase()}';

  String get vietQrUrl => _paymentResult?['vietQrUrl']?.toString() ?? '';

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (picked == null) return;
    setState(() => selectedImage = File(picked.path));
  }

  Future<void> _uploadProof() async {
    if (selectedImage == null) {
      _showTopMessage('Vui lòng chọn ảnh chuyển khoản', isError: true);
      return;
    }

    if (_registrationId == null) return;

    setState(() => isUploading = true);

    try {
      await paymentService.uploadMatchPaymentProof(
        registrationId: _registrationId!,
        imagePath: selectedImage!.path,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tải ảnh thành công, vui lòng chờ duyệt kết quả'),
          backgroundColor: Colors.green,
        ),
      );

      // Quay về trang danh sách My Matches
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MyMatchScreen()),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      _showTopMessage(getErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => isUploading = false);
    }
  }

  void _showTopMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(backgroundColor: primaryColor, elevation: 0),
        body: Center(child: CircularProgressIndicator(color: primaryColor)),
      );
    }

    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(_amountDue);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text(
          'Thanh toán ghép kèo',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 16 + MediaQuery.of(context).padding.bottom,
        ),
        color: Colors.white,
        child: ElevatedButton(
          onPressed: isUploading ? null : _uploadProof,
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: isUploading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text(
                  'Xác nhận đã tải ảnh chuyển khoản',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
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
                  'Thông tin chuyển khoản',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                _infoRow('Ngân hàng', bankName),
                _infoRow('Số tài khoản', accountNumber, enableCopy: true),
                _infoRow('Chủ tài khoản', accountName, enableCopy: true),
                _infoRow('Số tiền', totalStr),
                _infoRow('Nội dung', transferContent, enableCopy: true),
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
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return const SizedBox(
                        height: 260,
                        child: Center(child: CircularProgressIndicator()),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      debugPrint('LỖI TẢI QR: $error');
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
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Text(
                      'Owner chưa cấu hình tài khoản ngân hàng',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
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
                    child: kIsWeb
                        ? Image.network(
                            selectedImage!.path,
                            height: 220,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          )
                        : Image.file(
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
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      'Chưa chọn ảnh',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: Icon(Icons.image, color: primaryColor),
                    label: Text(
                      'Chọn ảnh từ thư viện',
                      style: TextStyle(color: primaryColor),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: primaryColor),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
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
        BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value, {bool enableCopy = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(color: Colors.black54, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? 'Chưa có' : value,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          if (enableCopy && value.isNotEmpty)
            InkWell(
              onTap: () async {
                await Clipboard.setData(ClipboardData(text: value));
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã sao chép $label'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Icon(Icons.copy_rounded, size: 18, color: primaryColor),
              ),
            ),
        ],
      ),
    );
  }
}
