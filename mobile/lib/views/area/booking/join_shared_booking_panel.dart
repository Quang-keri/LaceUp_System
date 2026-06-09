import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/court.dart';
import '../../../models/court_copy.dart';
import '../../../models/slot.dart';
import '../../../services/booking_service.dart';

class JoinSharedBookingPanel extends StatefulWidget {
  final SlotResponse? slotInfo;
  final CourtResponse? court;
  final CourtCopyResponse? courtCopy;

  final Future<void> Function(String bookingId, int quantity)? onConfirmJoin;

  const JoinSharedBookingPanel({
    super.key,
    required this.slotInfo,
    this.court,
    this.courtCopy,
    this.onConfirmJoin,
  });

  @override
  State<JoinSharedBookingPanel> createState() => _JoinSharedBookingPanelState();
}

class _JoinSharedBookingPanelState extends State<JoinSharedBookingPanel> {
  static const Color sharedColor = Color(0xFFEA580C);
  static const Color sharedDarkColor = Color(0xFFC2410C);
  static const Color sharedLightColor = Color(0xFFFFF7ED);

  bool _loading = false;
  bool _joining = false;

  String? _errorMessage;
  Map<String, dynamic>? _bookingDetail;

  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _loadBookingDetail();
  }

  @override
  void didUpdateWidget(covariant JoinSharedBookingPanel oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.slotInfo?.bookingId != widget.slotInfo?.bookingId) {
      _loadBookingDetail();
    }
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

  int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  DateTime? _toDateTime(dynamic value) {
    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }

  String _formatMoney(num value) {
    return NumberFormat.decimalPattern('vi_VN').format(value);
  }

  Map<String, dynamic>? get _firstSlot {
    final slots = _bookingDetail?['slots'];

    if (slots is List && slots.isNotEmpty) {
      return _toMap(slots.first);
    }

    return null;
  }

  Future<void> _loadBookingDetail() async {
    final bookingId = widget.slotInfo?.bookingId?.trim();

    if (bookingId == null || bookingId.isEmpty) {
      setState(() {
        _bookingDetail = null;
        _errorMessage = 'Không tìm thấy bookingId của lịch vãng lai.';
        _loading = false;
      });

      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
      _bookingDetail = null;
      _quantity = 1;
    });

    try {
      final response = await bookingService.getPublicSharedBooking(bookingId);

      final responseMap = _toMap(response);

      final detail = _toMap(responseMap?['result']) ?? responseMap;

      if (detail == null) {
        throw Exception('Không tìm thấy thông tin lịch vãng lai.');
      }

      final bookingType = detail['bookingType']?.toString().toUpperCase();

      if (bookingType != 'SHARED') {
        throw Exception('Booking này không phải lịch vãng lai.');
      }

      final maxParticipants = _toInt(detail['maxParticipants']);

      final currentParticipants = _toInt(detail['currentParticipants']);

      final remaining = maxParticipants - currentParticipants;

      if (!mounted) {
        return;
      }

      setState(() {
        _bookingDetail = detail;
        _quantity = remaining > 0 ? 1 : 0;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _confirmJoin() async {
    final bookingId =
        _bookingDetail?['bookingId']?.toString() ?? widget.slotInfo?.bookingId;

    if (bookingId == null || bookingId.isEmpty) {
      _showMessage('Không tìm thấy mã booking vãng lai.', isError: true);
      return;
    }

    final maxParticipants = _toInt(_bookingDetail?['maxParticipants']);

    final currentParticipants = _toInt(_bookingDetail?['currentParticipants']);

    final remaining = maxParticipants - currentParticipants;

    if (_quantity < 1 || _quantity > remaining) {
      _showMessage('Lịch vãng lai chỉ còn $remaining chỗ.', isError: true);
      return;
    }

    if (widget.onConfirmJoin == null) {
      _showMessage('Chưa cấu hình chức năng tham gia vãng lai.', isError: true);
      return;
    }

    setState(() => _joining = true);

    try {
      await widget.onConfirmJoin!(bookingId, _quantity);
    } finally {
      if (mounted) {
        setState(() => _joining = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.slotInfo == null) {
      return _buildEmptyState();
    }

    if (_loading) {
      return Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        padding: const EdgeInsets.symmetric(vertical: 44),
        child: const Center(
          child: Column(
            children: [
              CircularProgressIndicator(color: sharedColor),
              SizedBox(height: 12),
              Text(
                'Đang tải thông tin vãng lai...',
                style: TextStyle(color: Colors.black54),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Column(
          children: [
            Icon(
              Icons.error_outline_rounded,
              color: Colors.red.shade500,
              size: 38,
            ),
            const SizedBox(height: 10),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.red.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: _loadBookingDetail,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (_bookingDetail == null) {
      return _buildEmptyState();
    }

    final firstSlot = _firstSlot;

    final startTime = _toDateTime(
      _bookingDetail?['startTime'] ??
          firstSlot?['startTime'] ??
          widget.slotInfo?.startTime,
    );

    final endTime = _toDateTime(
      _bookingDetail?['endTime'] ??
          firstSlot?['endTime'] ??
          widget.slotInfo?.endTime,
    );

    final pricePerTicket = _toDouble(_bookingDetail?['pricePerTicket']);

    final currentParticipants = _toInt(_bookingDetail?['currentParticipants']);

    final maxParticipants = _toInt(_bookingDetail?['maxParticipants']);

    final remainingSlots = (maxParticipants - currentParticipants).clamp(
      0,
      maxParticipants,
    );

    final totalAmount = pricePerTicket * _quantity;

    final isFull =
        maxParticipants > 0 && currentParticipants >= maxParticipants;

    final isExpired = startTime == null || !startTime.isAfter(DateTime.now());

    final hasValidInformation = pricePerTicket > 0 && maxParticipants > 0;

    final courtName =
        widget.court?.courtName ??
        firstSlot?['courtName']?.toString() ??
        'Sân thể thao';

    final courtCode =
        widget.courtCopy?.courtCode ??
        widget.slotInfo?.courtCode ??
        firstSlot?['courtCode']?.toString() ??
        '';

    final canJoin =
        !isExpired && !isFull && hasValidInformation && remainingSlots > 0;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFF99F6E4),
        ),
        boxShadow: [
          BoxShadow(
            color: sharedColor.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Color(0xFFCCFBF1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.groups_rounded,
                  size: 21,
                  color: sharedColor,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tham gia vãng lai',
                      style: TextStyle(
                        color: sharedDarkColor,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Giao lưu và kết bạn mới',
                      style: TextStyle(
                        color: sharedDarkColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Text(
            courtCode.isEmpty
                ? courtName
                : '$courtName - $courtCode',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
          ),

          if (startTime != null && endTime != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.schedule_rounded,
                  size: 15,
                  color: Colors.black45,
                ),
                const SizedBox(width: 5),
                Text(
                  '${DateFormat('dd/MM/yyyy').format(startTime)}'
                      ' • ${DateFormat('HH:mm').format(startTime)}'
                      ' - ${DateFormat('HH:mm').format(endTime)}',
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 10,
            ),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildCompactStat(
                    label: 'Hiện tại',
                    value:
                    '$currentParticipants/$maxParticipants',
                    color: isFull
                        ? Colors.red
                        : sharedColor,
                  ),
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: Colors.grey.shade300,
                ),
                Expanded(
                  child: _buildCompactStat(
                    label: 'Còn lại',
                    value: '$remainingSlots chỗ',
                    color: remainingSlots > 0
                        ? sharedColor
                        : Colors.red,
                  ),
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: Colors.grey.shade300,
                ),
                Expanded(
                  child: _buildCompactStat(
                    label: 'Giá/vé',
                    value:
                    '${_formatMoney(pricePerTicket)}đ',
                    color: sharedColor,
                  ),
                ),
              ],
            ),
          ),

          if (isExpired) ...[
            const SizedBox(height: 10),
            _buildWarning(
              'Lịch vãng lai đã bắt đầu hoặc kết thúc.',
            ),
          ],

          if (!hasValidInformation) ...[
            const SizedBox(height: 10),
            _buildWarning(
              'Lịch chưa có giá vé hoặc số người hợp lệ.',
            ),
          ],

          const SizedBox(height: 12),

          Row(
            children: [
              const Expanded(
                child: Text(
                  'Số người',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                'Còn $remainingSlots chỗ',
                style: const TextStyle(
                  color: Colors.black45,
                  fontSize: 11,
                ),
              ),
            ],
          ),

          const SizedBox(height: 7),

          Row(
            children: [
              Container(
                width: 142,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(
                    color: Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  children: [
                    _buildQuantityButton(
                      icon: Icons.remove_rounded,
                      enabled:
                      canJoin && _quantity > 1,
                      onTap: () {
                        setState(() => _quantity--);
                      },
                    ),
                    Expanded(
                      child: Text(
                        '$_quantity',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    _buildQuantityButton(
                      icon: Icons.add_rounded,
                      enabled:
                      canJoin &&
                          _quantity < remainingSlots,
                      onTap: () {
                        setState(() => _quantity++);
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                child: Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                  ),
                  decoration: BoxDecoration(
                    color: sharedLightColor,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(
                      color: const Color(0xFFCCFBF1),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment:
                    MainAxisAlignment.center,
                    crossAxisAlignment:
                    CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'Tổng tiền',
                        style: TextStyle(
                          color: Colors.black45,
                          fontSize: 10,
                        ),
                      ),
                      Text(
                        '${_formatMoney(totalAmount)}đ',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: sharedColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed:
              canJoin && !_joining
                  ? _confirmJoin
                  : null,
              style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: sharedColor,
                disabledBackgroundColor:
                Colors.grey.shade300,
                shape: RoundedRectangleBorder(
                  borderRadius:
                  BorderRadius.circular(10),
                ),
              ),
              child: _joining
                  ? const SizedBox(
                width: 19,
                height: 19,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
                  : Text(
                !hasValidInformation
                    ? 'Chưa có giá vé'
                    : isExpired
                    ? 'Lịch đã bắt đầu'
                    : isFull ||
                    remainingSlots <= 0
                    ? 'Lịch đã đủ người'
                    : 'Tham gia $_quantity người'
                    ' • ${_formatMoney(totalAmount)}đ',
                maxLines: 1,
                overflow:
                TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactStat({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.black45,
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      decoration: BoxDecoration(
        color: sharedLightColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF99F6E4)),
      ),
      child: const Column(
        children: [
          Icon(Icons.groups_rounded, size: 42, color: sharedColor),
          SizedBox(height: 12),
          Text(
            'Tham gia vãng lai',
            style: TextStyle(
              color: sharedDarkColor,
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Chọn một ô màu xanh ngọc trên lịch để xem thông tin và đăng ký tham gia.',
            textAlign: TextAlign.center,
            style: TextStyle(color: sharedDarkColor, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildWarning(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.red.shade500),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 40,
        height: 42,
        child: Icon(
          icon,
          size: 20,
          color: enabled
              ? sharedColor
              : Colors.grey.shade400,
        ),
      ),
    );
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : sharedColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
