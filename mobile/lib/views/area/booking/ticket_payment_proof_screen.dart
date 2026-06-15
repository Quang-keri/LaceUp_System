import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../../services/booking_service.dart';
import '../../../utils/error_utils.dart';
import '../../../utils/top_message.dart';

class TicketPaymentProofScreen extends StatefulWidget {
  final String participantId;
  final Map<String, dynamic>? joinResult;

  const TicketPaymentProofScreen({
    super.key,
    required this.participantId,
    this.joinResult,
  });

  @override
  State<TicketPaymentProofScreen> createState() =>
      _TicketPaymentProofScreenState();
}

class _TicketPaymentProofScreenState extends State<TicketPaymentProofScreen> {
  static const Color primaryColor = Color(0xFF9156F1);
  static const Color sharedColor = Color(0xFFEA580C);

  XFile? selectedImage;

  bool loading = true;
  bool uploading = false;

  String? errorMessage;

  Map<String, dynamic>? ticketDetail;

  @override
  void initState() {
    super.initState();
    _loadTicketDetail();
  }

  Map<String, dynamic>? _toMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return null;
  }

  double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _getString(List<String> keys, {String fallback = ''}) {
    for (final key in keys) {
      final value = ticketDetail?[key] ?? widget.joinResult?[key];

      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }

    return fallback;
  }

  double get totalAmount {
    final amount = _toDouble(
      ticketDetail?['totalAmount'] ??
          ticketDetail?['amount'] ??
          ticketDetail?['ticketAmount'] ??
          widget.joinResult?['totalAmount'] ??
          widget.joinResult?['amount'],
    );

    if (amount > 0) {
      return amount;
    }

    final pricePerTicket = _toDouble(
      ticketDetail?['pricePerTicket'] ?? widget.joinResult?['pricePerTicket'],
    );

    final quantity = _toDouble(
      ticketDetail?['quantity'] ?? widget.joinResult?['quantity'] ?? 1,
    );

    return pricePerTicket * quantity;
  }

  Map<String, dynamic>? get _bankObj {
    final bank =
        ticketDetail?['bankAccount'] ?? widget.joinResult?['bankAccount'];
    if (bank is Map) return Map<String, dynamic>.from(bank);
    return null;
  }

  String get bankName {
    if (_bankObj != null && _bankObj!['bankName'] != null) {
      return _bankObj!['bankName'].toString();
    }
    return _getString([
      'bankName',
      'ownerBankName',
    ], fallback: 'Chưa cấu hình ngân hàng');
  }

  String get accountNumber {
    if (_bankObj != null && _bankObj!['accountNumber'] != null) {
      return _bankObj!['accountNumber'].toString();
    }
    return _getString([
      'accountNumber',
      'bankAccountNumber',
      'ownerAccountNumber',
    ]);
  }

  String get accountName {
    if (_bankObj != null && _bankObj!['accountHolderName'] != null) {
      return _bankObj!['accountHolderName'].toString();
    }
    return _getString([
      'accountName',
      'bankAccountName',
      'ownerAccountName',
    ], fallback: 'Chủ sân');
  }

  String get transferContent {
    return _getString([
      'transferContent',
      'paymentContent',
    ], fallback: 'LACEUP ${widget.participantId.substring(0, 8)}');
  }

  String get vietQrUrl {
    return _getString(['vietQrUrl', 'vietQRUrl', 'qrCodeUrl']);
  }

  String get courtName {
    return _getString([
      'courtName',
      'rentalAreaName',
    ], fallback: 'Sân thể thao');
  }

  String get courtCode {
    return _getString(['courtCode']);
  }

  String get quantity {
    return _getString(['quantity'], fallback: '1');
  }

  DateTime? get startTime {
    final value = _getString(['startTime']);

    return DateTime.tryParse(value);
  }

  DateTime? get endTime {
    final value = _getString(['endTime']);

    return DateTime.tryParse(value);
  }

  Future<void> _loadTicketDetail() async {
    setState(() {
      loading = true;
      errorMessage = null;
    });

    try {
      final response = await bookingService.getTicketParticipant(
        widget.participantId,
      );

      final responseMap = _toMap(response);

      final result = _toMap(responseMap?['result']) ?? responseMap;

      if (result == null) {
        throw Exception('Không tìm thấy thông tin vé.');
      }

      if (!mounted) return;

      setState(() {
        ticketDetail = result;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();

    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (picked == null) return;

    setState(() {
      selectedImage = picked;
    });
  }

  Future<void> _uploadProof() async {
    if (selectedImage == null) {
      showTopMessage(context, 'Vui lòng chọn ảnh chuyển khoản');
      return;
    }

    setState(() => uploading = true);

    try {
      await bookingService.uploadTicketPaymentProof(
        participantId: widget.participantId,
        image: selectedImage!,
      );

      if (!mounted) return;

      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) {
          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Column(
              children: [
                Icon(Icons.check_circle_rounded, color: sharedColor, size: 50),
                SizedBox(height: 10),
                Text(
                  'Đã gửi minh chứng',
                  style: TextStyle(
                    color: Color(0xFF0F766E),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            content: const Text(
              'Ảnh chuyển khoản đã được gửi.\n'
              'Vui lòng chờ chủ sân kiểm tra và xác nhận vé.',
              textAlign: TextAlign.center,
              style: TextStyle(height: 1.5),
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(dialogContext);
                },
                style: ElevatedButton.styleFrom(backgroundColor: sharedColor),
                child: const Text(
                  'Đã hiểu',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          );
        },
      );

      if (!mounted) return;

      Navigator.popUntil(context, (route) => route.isFirst);
    } catch (error) {
      if (!mounted) return;

      final message = getErrorMessage(error);

      // Bắt lỗi file size và hiển thị popup
      if (message.toLowerCase().contains('maximum upload size exceeded') ||
          message.toLowerCase().contains('size limit')) {
        _showErrorDialog(
          'Kích thước ảnh quá lớn.\nVui lòng chọn ảnh chuyển khoản có dung lượng tối đa dưới 10MB.',
        );
      } else {
        // Lỗi khác
        _showErrorDialog('Đã xảy ra lỗi: $message');
      }
    } finally {
      if (mounted) {
        setState(() => uploading = false);
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.error_outline_rounded, color: Colors.red, size: 28),
            SizedBox(width: 8),
            Text(
              'Không thể tải ảnh',
              style: TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(height: 1.4, fontSize: 15),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: sharedColor,
              minimumSize: const Size(120, 40),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Đã hiểu',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalStr = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: 'VNĐ',
    ).format(totalAmount);

    if (loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: sharedColor)),
      );
    }

    if (errorMessage != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Thanh toán vé vãng lai'),
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Colors.red,
                  size: 46,
                ),
                const SizedBox(height: 12),
                Text(
                  errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: _loadTicketDetail,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text(
          'Thanh toán vé vãng lai',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 14,
          bottom: 14 + MediaQuery.of(context).padding.bottom,
        ),
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
        child: ElevatedButton(
          onPressed: uploading ? null : _uploadProof,
          style: ElevatedButton.styleFrom(
            backgroundColor: sharedColor,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: uploading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text(
                  'Xác nhận đã chuyển khoản',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.groups_rounded, color: sharedColor),
                    SizedBox(width: 8),
                    Text(
                      'Thông tin vé vãng lai',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _infoRow(
                  'Sân',
                  courtCode.isEmpty ? courtName : '$courtName - $courtCode',
                ),
                if (startTime != null && endTime != null)
                  _infoRow(
                    'Thời gian',
                    '${DateFormat('dd/MM/yyyy').format(startTime!)}'
                        ' • ${DateFormat('HH:mm').format(startTime!)}'
                        ' - ${DateFormat('HH:mm').format(endTime!)}',
                  ),
                _infoRow('Số người', '$quantity người'),
                _infoRow('Thanh toán', totalStr, valueColor: sharedColor),
              ],
            ),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Chuyển khoản cho chủ sân',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                _infoRow('Ngân hàng', bankName),
                _infoRow('Số tài khoản', accountNumber, enableCopy: true),
                _infoRow('Chủ tài khoản', accountName, enableCopy: true),
                _infoRow('Số tiền', totalStr, valueColor: sharedColor),
                _infoRow('Nội dung', transferContent, enableCopy: true),
              ],
            ),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: _cardDecoration(),
            child: Column(
              children: [
                const Text(
                  'Quét mã VietQR',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                if (vietQrUrl.isNotEmpty)
                  Image.network(
                    vietQrUrl,
                    height: 230,
                    fit: BoxFit.contain,
                    headers: const {
                      'User-Agent': 'Mozilla/5.0',
                      'Accept': 'image/png,image/*,*/*',
                    },
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) {
                        return child;
                      }

                      return const SizedBox(
                        height: 230,
                        child: Center(child: CircularProgressIndicator()),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return const SizedBox(
                        height: 100,
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
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Chủ sân chưa cấu hình VietQR',
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: _cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ảnh chuyển khoản',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                if (selectedImage != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: kIsWeb
                        ? Image.network(
                            selectedImage!.path,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          )
                        : Image.file(
                            File(selectedImage!.path),
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                  )
                else
                  Container(
                    height: 130,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.image_outlined, color: Colors.black38),
                        SizedBox(height: 6),
                        Text(
                          'Chưa chọn ảnh',
                          style: TextStyle(color: Colors.black45),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.image_rounded),
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
    Color valueColor = Colors.black87,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
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
              style: TextStyle(
                color: valueColor,
                fontWeight: FontWeight.w700,
                fontSize: 13,
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
              child: Icon(Icons.copy_rounded, size: 19, color: primaryColor),
            ),
        ],
      ),
    );
  }
}
