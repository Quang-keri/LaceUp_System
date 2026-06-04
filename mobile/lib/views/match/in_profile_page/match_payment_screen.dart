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
  dynamic _paymentResult;

  // Các biến lưu trữ thông tin hiển thị như Web
  int _playerCount = 1;
  String _userName = '';
  String _phoneNumber = '';
  String _matchTime = '';

  @override
  void initState() {
    super.initState();
    _loadPaymentIntent();
  }

  String _formatDateTime(dynamic timeData) {
    if (timeData == null) return '--:--';
    if (timeData is List && timeData.length >= 5) {
      final h = timeData[3].toString().padLeft(2, '0');
      final m = timeData[4].toString().padLeft(2, '0');
      final d = timeData[2].toString().padLeft(2, '0');
      final mo = timeData[1].toString().padLeft(2, '0');
      final y = timeData[0].toString();
      return '$h:$m - $d/$mo/$y';
    }
    try {
      final date = DateTime.parse(timeData.toString());
      return DateFormat('HH:mm - dd/MM/yyyy').format(date);
    } catch (e) {
      return timeData.toString();
    }
  }

  Future<void> _loadPaymentIntent() async {
    try {
      setState(() => isLoading = true);

      matchDetail = await matchService.getMatchDetail(widget.matchId);

      if (matchDetail == null) {
        throw Exception("Không tìm thấy thông tin trận đấu");
      }

      final authProvider = context.read<AuthProvider>();
      final userMap = authProvider.user;
      final myUserId = userMap?['userId'];

      // Lấy thông tin user (Người đặt kèo)
      _userName = userMap?['userName'] ?? 'Người chơi';
      _phoneNumber =
          userMap?['phoneNumber'] ?? userMap?['phone'] ?? 'Chưa cập nhật';

      final myRegistration = matchDetail!.participants.firstWhere(
        (p) => p.userId == myUserId,
        orElse: () => throw Exception(
          "Bạn không nằm trong danh sách đăng ký của trận này",
        ),
      );

      _registrationId = myRegistration.registrationId;
      _amountDue = (myRegistration.amountDue ?? 0).toDouble();

      // Cố gắng lấy số lượng người đăng ký (nếu có trong model, fallback về 1)
      try {
        _playerCount = (myRegistration as dynamic).playerCount ?? 1;
      } catch (_) {
        _playerCount = 1;
      }

      _matchTime = _formatDateTime(matchDetail!.startTime);

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
    if (isLoading || matchDetail == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(backgroundColor: primaryColor, elevation: 0),
        body: Center(child: CircularProgressIndicator(color: primaryColor)),
      );
    }

    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'đ',
    ).format(_amountDue);
    final courtName = matchDetail!.hasCourt
        ? (matchDetail!.courtName)
        : 'Tự thỏa thuận';

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text(
          'Thanh toán ghép kèo',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. THÔNG TIN NGƯỜI ĐẶT KÈO
          _buildCard(
            title: 'Thông tin người đặt kèo',
            child: Column(
              children: [
                _buildSimpleRow('Tên người chơi', _userName),
                const SizedBox(height: 8),
                _buildSimpleRow('Số điện thoại', _phoneNumber),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. CHI TIẾT TRẬN ĐẤU VÃNG LAI
          _buildCard(
            title: 'Chi tiết trận đấu vãng lai',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MÔN THỂ THAO: ${matchDetail!.categoryName.toUpperCase()}',
                  style: TextStyle(
                    color: primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text(
                      'Mã phòng: ',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      matchDetail!.roomCode ?? 'TRỐNG',
                      style: TextStyle(
                        color: primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 16,
                      color: Colors.black87,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Thời gian đấu: $_matchTime',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 16,
                      color: Colors.black87,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Cơ sở / Tên sân: $courtName',
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 3. TÓM TẮT THANH TOÁN
          _buildCard(
            title: 'Tóm tắt thanh toán',
            child: Column(
              children: [
                _buildSimpleRow(
                  'Số người đăng ký hộ:',
                  '$_playerCount người',
                  valueBold: true,
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Divider(height: 1, color: Color(0xFFEEEEEE)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tổng chi phí góp sân:',
                      style: TextStyle(fontSize: 14),
                    ),
                    Text(
                      totalStr,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 4. THÔNG TIN CHUYỂN KHOẢN (VietQR)
          _buildCard(
            title: 'Thông tin chuyển khoản',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _infoRow('Ngân hàng', bankName),
                _infoRow('Số tài khoản', accountNumber, enableCopy: true),
                _infoRow('Chủ tài khoản', accountName, enableCopy: true),
                _infoRow('Số tiền', totalStr),
                _infoRow('Nội dung', transferContent, enableCopy: true),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(height: 1, color: Color(0xFFEEEEEE)),
                ),
                const Text(
                  'Quét mã VietQR',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 16),
                if (vietQrUrl.isNotEmpty)
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Image.network(
                      vietQrUrl,
                      height: 240,
                      fit: BoxFit.contain,
                      loadingBuilder: (context, child, progress) {
                        if (progress == null) return child;
                        return const SizedBox(
                          height: 240,
                          child: Center(child: CircularProgressIndicator()),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) =>
                          const SizedBox(
                            height: 120,
                            child: Center(
                              child: Text(
                                'Không tải được mã QR',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ),
                    ),
                  )
                else
                  const Text(
                    'Owner chưa cấu hình tài khoản ngân hàng',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 5. UPLOAD ẢNH CHUYỂN KHOẢN
          _buildCard(
            title: 'Ảnh chuyển khoản',
            child: Column(
              children: [
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
                    height: 140,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.grey.shade300,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.cloud_upload_outlined,
                          size: 40,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Chưa chọn ảnh',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: Icon(Icons.image, color: primaryColor),
                    label: Text(
                      'Chọn ảnh từ thư viện',
                      style: TextStyle(
                        color: primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: primaryColor),
                      padding: const EdgeInsets.symmetric(vertical: 14),
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

  // --- HÀM HỖ TRỢ XÂY DỰNG UI ---

  Widget _buildCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFEEEEEE)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildSimpleRow(String label, String value, {bool valueBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.black54, fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: valueBold ? FontWeight.bold : FontWeight.w500,
            fontSize: 14,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value, {bool enableCopy = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(color: Colors.black54, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? 'Chưa có' : value,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black87,
              ),
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

  Widget _buildBottomNavigationBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: 16 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
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
    );
  }
}
