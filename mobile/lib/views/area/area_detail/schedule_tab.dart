import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/court.dart';
import '../../../models/court_copy.dart';
import '../../../models/rental_area.dart';
import '../../../models/selected_booking_slot.dart';
import '../../../models/slot.dart';
import '../booking/join_shared_booking_panel.dart';
import '../booking/match_config_widget.dart';

class ScheduleTab extends StatefulWidget {
  final RentalAreaResponse? rentalArea;
  final CourtResponse? activeCourt;
  final DateTime selectedDate;
  final List<SelectedBookingSlot> selectedSlots;
  final String activeMode;

  final ValueChanged<DateTime> onDateSelected;
  final ValueChanged<List<SelectedBookingSlot>> onSelectedSlotsChanged;
  final ValueChanged<CourtResponse> onActiveCourtChanged;
  final ValueChanged<String> onModeChanged;
  final ValueChanged<MatchConfigData> onMatchConfigChanged;

  final void Function(
    dynamic slot,
    CourtResponse court,
    CourtCopyResponse copy,
  )?
  onClickSharedSlot;

  final Map<String, dynamic>? selectedJoinableSlot;

  final Future<void> Function(String bookingId, int quantity)? onJoinShared;

  const ScheduleTab({
    super.key,
    required this.rentalArea,
    required this.activeCourt,
    required this.selectedDate,
    required this.selectedSlots,
    required this.activeMode,
    this.onClickSharedSlot,
    required this.onDateSelected,
    required this.onSelectedSlotsChanged,
    required this.onActiveCourtChanged,
    required this.onModeChanged,
    required this.onMatchConfigChanged,
    this.selectedJoinableSlot,
    this.onJoinShared,
  });

  @override
  State<ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<ScheduleTab> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  final ScrollController _scheduleScrollController = ScrollController();
  double _scrollProgress = 0.0;

  Timer? _clockTimer;
  DateTime _currentTime = DateTime.now();

  late List<String> dynamicTimeSlots;

  static bool _hideMatchGuide = false;

  @override
  void initState() {
    super.initState();
    _scheduleScrollController.addListener(_onScroll);
    dynamicTimeSlots = _generateTimeSlots();

    _clockTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _currentTime = DateTime.now();
      });
    });
  }

  @override
  void didUpdateWidget(covariant ScheduleTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.rentalArea != widget.rentalArea) {
      setState(() {
        dynamicTimeSlots = _generateTimeSlots();
      });
    }
  }

  List<String> _generateTimeSlots() {
    final openTimeStr = widget.rentalArea?.openTime ?? '05:00';
    final closeTimeStr = widget.rentalArea?.closeTime ?? '22:00';

    final slots = <String>[];
    final startHour = int.tryParse(openTimeStr.split(':')[0]) ?? 5;
    final endHour = int.tryParse(closeTimeStr.split(':')[0]) ?? 22;

    for (var hour = startHour; hour < endHour; hour++) {
      final formattedHour = hour.toString().padLeft(2, '0');
      slots.add('$formattedHour:00');
      slots.add('$formattedHour:30');
    }

    return slots;
  }

  int _timeToMinutes(String timeStr) {
    final parts = timeStr.split(':');
    return int.parse(parts[0]) * 60 + int.parse(parts[1]);
  }

  DateTime _buildCellStartDateTime(String timeStr) {
    final parts = timeStr.split(':');

    final hour = int.tryParse(parts.first) ?? 0;
    final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;

    return DateTime(
      widget.selectedDate.year,
      widget.selectedDate.month,
      widget.selectedDate.day,
      hour,
      minute,
    );
  }

  bool _isPastCell(String timeStr) {
    final cellStart = _buildCellStartDateTime(timeStr);
    return !cellStart.isAfter(_currentTime);
  }

  SlotResponse? _getSlotAtTime(CourtCopyResponse copy, String timeStr) {
    final slotMinute = _timeToMinutes(timeStr);
    final slots = copy.slots ?? [];

    for (final slot in slots) {
      final start = DateTime.tryParse(slot.startTime ?? '');
      final end = DateTime.tryParse(slot.endTime ?? '');

      if (start == null || end == null) {
        continue;
      }

      final isSameDay =
          start.year == widget.selectedDate.year &&
          start.month == widget.selectedDate.month &&
          start.day == widget.selectedDate.day;

      if (!isSameDay) {
        continue;
      }

      final startMinute = start.hour * 60 + start.minute;
      final endMinute = end.hour * 60 + end.minute;

      if (slotMinute >= startMinute && slotMinute < endMinute) {
        return slot;
      }
    }

    return null;
  }

  String _normalizeValue(dynamic value) {
    return value?.toString().trim().toUpperCase() ?? '';
  }

  bool _isSharedOpen(SlotResponse? slot) {
    if (slot == null) {
      return false;
    }

    final slotStatus = _normalizeValue(slot.slotStatus);
    final bookingType = _normalizeValue(slot.bookingType);

    return slotStatus == 'SHARE' ||
        slotStatus == 'SHARED_OPEN' ||
        (bookingType == 'SHARED' &&
            slotStatus != 'MATCH_FULL' &&
            slotStatus != 'COMPLETED' &&
            slotStatus != 'CANCELLED');
  }

  void _toggleSlot({
    required CourtResponse court,
    required CourtCopyResponse copy,
    required int idx,
  }) {
    final currentSlots = [...widget.selectedSlots];

    if (widget.activeMode == 'shared') {
      widget.onModeChanged('booking');
    }

    if (widget.activeMode == 'match') {
      var myBlocks = currentSlots
          .where((item) => item.courtCopyId == copy.courtCopyId)
          .toList();

      List<SelectedBookingSlot> newBlocks = [];

      SelectedBookingSlot createNewBlock(int index) {
        return SelectedBookingSlot(
          courtCopyId: copy.courtCopyId,
          courtCode: copy.courtCode,
          courtId: court.courtId,
          courtName: court.courtName,
          categoryName: court.categoryName ?? 'Sân thể thao',
          date: widget.selectedDate,
          startIndex: index,
          endIndex: index,
          startTime: dynamicTimeSlots[index],
          endTime: index + 1 < dynamicTimeSlots.length
              ? dynamicTimeSlots[index + 1]
              : widget.rentalArea?.closeTime?.substring(0, 5) ?? '22:00',
          duration: 0.5,
          court: court,
          courtCopy: copy,
        );
      }

      if (myBlocks.isEmpty) {
        newBlocks = [createNewBlock(idx)];
      } else {
        final block = myBlocks.first;
        if (idx == block.startIndex - 1) {
          newBlocks = [block.copyWith(startIndex: idx)];
        } else if (idx == block.endIndex + 1) {
          newBlocks = [block.copyWith(endIndex: idx)];
        } else if (idx == block.startIndex) {
          if (block.startIndex < block.endIndex) {
            newBlocks = [block.copyWith(startIndex: block.startIndex + 1)];
          }
        } else if (idx == block.endIndex) {
          if (block.startIndex < block.endIndex) {
            newBlocks = [block.copyWith(endIndex: block.endIndex - 1)];
          }
        } else {
          newBlocks = [createNewBlock(idx)];
        }
      }

      newBlocks = newBlocks.map((b) {
        final startTime = dynamicTimeSlots[b.startIndex];
        final endTime = b.endIndex + 1 < dynamicTimeSlots.length
            ? dynamicTimeSlots[b.endIndex + 1]
            : widget.rentalArea?.closeTime?.substring(0, 5) ?? '22:00';
        final duration = (b.endIndex - b.startIndex + 1) * 0.5;

        return b.copyWith(
          startTime: startTime,
          endTime: endTime,
          duration: duration,
        );
      }).toList();

      widget.onActiveCourtChanged(court);
      widget.onSelectedSlotsChanged(newBlocks);
    } else {
      final otherCopies = currentSlots
          .where((item) => item.courtCopyId != copy.courtCopyId)
          .toList();

      var myBlocks = currentSlots
          .where((item) => item.courtCopyId == copy.courtCopyId)
          .toList();

      final clickedInsideIndex = myBlocks.indexWhere(
        (b) => idx >= b.startIndex && idx <= b.endIndex,
      );

      if (clickedInsideIndex != -1) {
        final b = myBlocks[clickedInsideIndex];
        final newBlocks = <SelectedBookingSlot>[];

        if (idx > b.startIndex) {
          newBlocks.add(b.copyWith(endIndex: idx - 1));
        }

        if (idx < b.endIndex) {
          newBlocks.add(b.copyWith(startIndex: idx + 1));
        }

        myBlocks.removeAt(clickedInsideIndex);
        myBlocks.insertAll(clickedInsideIndex, newBlocks);
      } else {
        myBlocks.add(
          SelectedBookingSlot(
            courtCopyId: copy.courtCopyId,
            courtCode: copy.courtCode,
            courtId: court.courtId,
            courtName: court.courtName,
            categoryName: court.categoryName ?? 'Sân thể thao',
            date: widget.selectedDate,
            startIndex: idx,
            endIndex: idx,
            startTime: dynamicTimeSlots[idx],
            endTime: idx + 1 < dynamicTimeSlots.length
                ? dynamicTimeSlots[idx + 1]
                : widget.rentalArea?.closeTime?.substring(0, 5) ?? '22:00',
            duration: 0.5,
            court: court,
            courtCopy: copy,
          ),
        );
      }

      myBlocks.sort((a, b) => a.startIndex.compareTo(b.startIndex));

      final merged = <SelectedBookingSlot>[];
      for (final block in myBlocks) {
        if (merged.isEmpty) {
          merged.add(block);
        } else {
          final last = merged.last;
          if (last.endIndex + 1 == block.startIndex) {
            merged[merged.length - 1] = last.copyWith(endIndex: block.endIndex);
          } else {
            merged.add(block);
          }
        }
      }

      myBlocks = merged.map((b) {
        final startTime = dynamicTimeSlots[b.startIndex];
        final endTime = b.endIndex + 1 < dynamicTimeSlots.length
            ? dynamicTimeSlots[b.endIndex + 1]
            : widget.rentalArea?.closeTime?.substring(0, 5) ?? '22:00';
        final duration = (b.endIndex - b.startIndex + 1) * 0.5;

        return b.copyWith(
          startTime: startTime,
          endTime: endTime,
          duration: duration,
        );
      }).toList();

      widget.onActiveCourtChanged(court);
      widget.onSelectedSlotsChanged([...otherCopies, ...myBlocks]);
    }
  }

  void _onScroll() {
    if (_scheduleScrollController.hasClients) {
      final maxScroll = _scheduleScrollController.position.maxScrollExtent;
      if (maxScroll > 0) {
        setState(() {
          _scrollProgress = (_scheduleScrollController.offset / maxScroll)
              .clamp(0.0, 1.0);
        });
      }
    }
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _scheduleScrollController.removeListener(_onScroll);
    _scheduleScrollController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final now = DateTime.now();

    final DateTime? picked = await showDatePicker(
      context: context,
      locale: const Locale('vi', 'VN'),
      initialDate: widget.selectedDate.isBefore(now)
          ? now
          : widget.selectedDate,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 30)),
      helpText: 'Chọn ngày',
      cancelText: 'Hủy',
      confirmText: 'Xác nhận',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: primaryColor,
              onPrimary: Colors.white,
              onSurface: const Color(0xFF111827),
            ),
            datePickerTheme: DatePickerThemeData(
              headerBackgroundColor: Colors.white,
              headerForegroundColor: const Color(0xFF111827),
              todayBorder: BorderSide(color: primaryColor, width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != widget.selectedDate) {
      widget.onDateSelected(picked);
    }
  }

  void _showMatchGuideDialog() {
    bool isChecked = _hideMatchGuide;
    showDialog(
      context: context,
      builder: (BuildContext ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Row(
                children: [
                  Icon(Icons.menu_book_rounded, color: primaryColor),
                  const SizedBox(width: 8),
                  const Text(
                    'Hướng dẫn ghép trận',
                    style: TextStyle(
                      color: Color(0xFF9156F1),
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '1. Chọn sân và khung giờ bạn muốn chơi.',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '2. Thiết lập số người và thể thức ở bảng cấu hình bên dưới.',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '3. Tạo trận để hệ thống bắt đầu tìm kiếm người chơi phù hợp.',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '4. Chuyển sang trang "Trận đấu của tôi" để xem diễn biến. Khi đủ số lượng, bạn có thể chuyển khoản cho chủ trận (Owner).',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '5. Trận đấu sẽ diễn ra khi chủ sân phê duyệt và bạn có thể bắt đầu chơi.',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: Checkbox(
                          value: isChecked,
                          activeColor: primaryColor,
                          onChanged: (val) {
                            setDialogState(() => isChecked = val ?? false);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Không hiện lại thông báo này',
                          style: TextStyle(fontSize: 13, color: Colors.black54),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                ElevatedButton(
                  onPressed: () {
                    _hideMatchGuide = isChecked;
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Đã hiểu',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showNoticeDialog() {
    showDialog(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFFEA580C)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Lưu ý',
                  style: TextStyle(
                    color: Color(0xFFEA580C),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          content: const SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '1. Đặt sân',
                  style: TextStyle(
                    color: Color(0xFFEA580C),
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '• Chọn vào khung giờ phù hợp với bạn trên biểu đồ sân.',
                  style: TextStyle(height: 1.5),
                ),
                SizedBox(height: 4),
                Text(
                  '• Đăng nhập để đặt lịch nhanh hơn, theo dõi lịch sử và nhận ưu đãi.',
                  style: TextStyle(height: 1.5),
                ),
                SizedBox(height: 4),
                Text(
                  '• Hệ thống hiện không hỗ trợ hoàn tiền cho lịch đặt sân thông thường, hãy kiểm tra kỹ trước khi thanh toán.',
                  style: TextStyle(height: 1.5),
                ),
                SizedBox(height: 4),
                Text(
                  '• Chức năng Đánh Rank yêu cầu bạn phải chọn sân trước để mở phần cấu hình trận.',
                  style: TextStyle(height: 1.5),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Divider(height: 1),
                ),
                Text(
                  '2. Vãng lai',
                  style: TextStyle(
                    color: Color(0xFF0F766E),
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '• Trận đấu sẽ được chốt danh sách trước giờ chơi 30 phút.',
                  style: TextStyle(height: 1.5),
                ),
                SizedBox(height: 4),
                Text(
                  '• Nếu không đủ số lượng người tối thiểu, chúng tôi sẽ lên kế hoạch hoàn tiền vì trận đấu không xảy ra.',
                  style: TextStyle(height: 1.5),
                ),
              ],
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: selectedColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Đã hiểu',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSharedNotice() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDFA),
          border: Border.all(color: const Color(0xFF99F6E4)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.info_outline_rounded,
              size: 18,
              color: Color(0xFF0F766E),
            ),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Trận đấu sẽ được chốt danh sách trước giờ chơi 30 phút. '
                'Nếu không đủ số lượng người tối thiểu, chúng tôi sẽ lên kế hoạch '
                'hoàn tiền vì trận đấu không xảy ra.',
                style: TextStyle(
                  color: Color(0xFF115E59),
                  fontSize: 12.5,
                  height: 1.45,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _buildCourtCopyRows() {
    final rows = <Map<String, dynamic>>[];
    for (final court in widget.rentalArea?.courts ?? []) {
      for (final copy in court.courtCopies) {
        rows.add({'court': court, 'copy': copy});
      }
    }
    return rows;
  }

  @override
  Widget build(BuildContext context) {
    final rows = _buildCourtCopyRows();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDateSelector(context),
        _buildModeToggle(),
        _buildActionButtons(),

        if (widget.activeMode == 'shared') ...[
          const SizedBox(height: 10),
          _buildSharedNotice(),
        ],

        const SizedBox(height: 16),
        _buildLegends(),
        const SizedBox(height: 16),

        _buildTimelineMatrix(rows),
        const SizedBox(height: 16),

        if (widget.activeMode == 'shared')
          JoinSharedBookingPanel(
            slotInfo: widget.selectedJoinableSlot?['slot'] as SlotResponse?,
            court: widget.selectedJoinableSlot?['court'] as CourtResponse?,
            courtCopy:
                widget.selectedJoinableSlot?['copy'] as CourtCopyResponse?,
            onConfirmJoin: widget.onJoinShared,
          ),

        if (widget.activeMode == 'match')
          MatchConfigWidget(
            categoryName: widget.activeCourt?.categoryName ?? '',
            onChanged: widget.onMatchConfigChanged,
          ),
      ],
    );
  }

  Widget _buildDateSelector(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Lịch đặt sân',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          InkWell(
            onTap: () => _selectDate(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: primaryColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.calendar_month, size: 16, color: primaryColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('dd/MM/yyyy').format(widget.selectedDate),
                    style: TextStyle(
                      color: primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModeToggle() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        height: 50,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(26),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildModeButton(
              mode: 'booking',
              title: 'Đặt sân',
              icon: Icons.calendar_month_rounded,
              activeColor: selectedColor,
            ),
            _buildModeButton(
              mode: 'shared',
              title: 'Vãng lai',
              icon: Icons.groups_rounded,
              activeColor: const Color(0xFF14B8A6),
            ),
            _buildModeButton(
              mode: 'match',
              title: 'Đánh Rank',
              icon: Icons.emoji_events_rounded,
              activeColor: primaryColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeButton({
    required String mode,
    required String title,
    required IconData icon,
    required Color activeColor,
  }) {
    final isActive = widget.activeMode == mode;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(22),
            onTap: () {
              widget.onModeChanged(mode);

              if (mode == 'match' && !_hideMatchGuide) {
                _showMatchGuideDialog();
              }
            },
            child: AnimatedContainer(
              height: double.infinity,
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeInOut,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isActive ? activeColor : Colors.transparent,
                borderRadius: BorderRadius.circular(22),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: activeColor.withOpacity(0.22),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    icon,
                    size: 17,
                    color: isActive ? Colors.white : Colors.grey.shade600,
                  ),
                  const SizedBox(width: 5),
                  Flexible(
                    child: Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: isActive ? Colors.white : Colors.grey.shade600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFEA580C),
                backgroundColor: const Color(0xFFFFF7ED),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              icon: const Icon(Icons.warning_amber_rounded, size: 18),
              label: const Text(
                'Lưu ý',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              onPressed: _showNoticeDialog,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: primaryColor,
                backgroundColor: primaryColor.withOpacity(0.08),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              icon: const Icon(Icons.menu_book_rounded, size: 18),
              label: const Text(
                'HD Ghép trận',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              onPressed: _showMatchGuideDialog,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegends() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 10,
          children: [
            _buildLegendItem(
              Colors.white,
              'Trống',
              borderColor: Colors.grey.shade400,
            ),
            _buildLegendItem(selectedColor, 'Đang chọn'),
            _buildLegendItem(
              const Color(0xFF99F6E4),
              'Đang mở vãng lai',
              borderColor: const Color(0xFF14B8A6),
            ),
            _buildLegendItem(const Color(0xFFEA580C), 'Đã đặt'),
            _buildLegendItem(Colors.orange.shade300, 'Trận chưa đủ'),
            _buildLegendItem(Colors.grey.shade400, 'Khóa'),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, {Color? borderColor}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            border: Border.all(color: borderColor ?? color),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildTimelineMatrix(List<Map<String, dynamic>> rows) {
    if (rows.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('Chưa có danh sách sân tại cơ sở này.'),
      );
    }

    const double cellWidth = 65;
    const double cellHeight = 48;
    const double leftColumnWidth = 120;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: leftColumnWidth,
                  decoration: BoxDecoration(
                    border: Border(
                      right: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        height: cellHeight,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          border: Border(
                            bottom: BorderSide(color: Colors.grey.shade300),
                          ),
                        ),
                      ),
                      ...rows.map((row) {
                        final court = row['court'] as CourtResponse;
                        final copy = row['copy'] as CourtCopyResponse;

                        return Container(
                          height: cellHeight,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: Colors.grey.shade300),
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                court.courtName,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: primaryColor,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                copy.courtCode,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFEA580C),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    controller: _scheduleScrollController,
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: dynamicTimeSlots.asMap().entries.map((e) {
                            final idx = e.key;
                            final time = e.value;

                            return Container(
                              width: cellWidth,
                              height: cellHeight,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9FAFB),
                                border: Border(
                                  bottom: BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                  right: BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                ),
                              ),
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Positioned(
                                    left: idx == 0 ? 4 : -16,
                                    top: 0,
                                    bottom: 0,
                                    child: Center(
                                      child: Text(
                                        time,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (idx == dynamicTimeSlots.length - 1)
                                    Positioned(
                                      right: 4,
                                      top: 0,
                                      bottom: 0,
                                      child: Center(
                                        child: Text(
                                          widget.rentalArea?.closeTime
                                                  ?.substring(0, 5) ??
                                              '22:00',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                        ...rows.map((row) {
                          final court = row['court'] as CourtResponse;
                          final copy = row['copy'] as CourtCopyResponse;

                          final myBlocks = widget.selectedSlots
                              .where((e) => e.courtCopyId == copy.courtCopyId)
                              .toList();

                          return Row(
                            children: dynamicTimeSlots.asMap().entries.map((e) {
                              final idx = e.key;
                              final time = e.value;

                              final slot = _getSlotAtTime(copy, time);

                              final slotStatus = _normalizeValue(
                                slot?.slotStatus,
                              );

                              final isSharedOpen = _isSharedOpen(slot);
                              final isPast = _isPastCell(time);

                              final isBlocked =
                                  isPast ||
                                  (!isSharedOpen &&
                                      [
                                        'BOOKED',
                                        'MATCH_FULL',
                                        'LOCKED',
                                        'COMPLETED',
                                      ].contains(slotStatus));

                              final activeBlock = myBlocks.where((b) {
                                return idx >= b.startIndex && idx <= b.endIndex;
                              }).toList();

                              final isSelected = activeBlock.isNotEmpty;

                              Color bgColor = Colors.white;

                              BoxBorder border = Border(
                                bottom: BorderSide(color: Colors.grey.shade300),
                                right: BorderSide(color: Colors.grey.shade300),
                              );

                              bool showLockedPattern = false;
                              bool showPastOverlay = false;

                              if (isSharedOpen) {
                                bgColor = const Color(0xFF99F6E4);

                                border = const Border(
                                  top: BorderSide(color: Color(0xFF14B8A6)),
                                  bottom: BorderSide(color: Color(0xFF14B8A6)),
                                  right: BorderSide(color: Color(0xFF14B8A6)),
                                );
                              } else if (slotStatus == 'BOOKED') {
                                bgColor = const Color(0xFFEA580C);
                              } else if (slotStatus == 'MATCH_FULL') {
                                bgColor = const Color(0xFFEA580C);
                              } else if (slotStatus == 'MATCH_PENDING') {
                                bgColor = Colors.orange.shade300;
                              } else if (slotStatus == 'LOCKED') {
                                bgColor = Colors.grey.shade400;
                              }

                              if (isSelected && !isSharedOpen) {
                                final block = activeBlock.first;

                                bgColor = const Color(0xFFFFF7ED);

                                border = Border(
                                  top: BorderSide(
                                    color: selectedColor,
                                    width: 2,
                                  ),
                                  bottom: BorderSide(
                                    color: selectedColor,
                                    width: 2,
                                  ),
                                  left: idx == block.startIndex
                                      ? BorderSide(
                                          color: selectedColor,
                                          width: 2,
                                        )
                                      : BorderSide.none,
                                  right: idx == block.endIndex
                                      ? BorderSide(
                                          color: selectedColor,
                                          width: 2,
                                        )
                                      : BorderSide(color: Colors.grey.shade300),
                                );
                              }

                              if (isPast) {
                                if (slot == null) {
                                  bgColor = Colors.grey.shade400;
                                  border = Border(
                                    bottom: BorderSide(
                                      color: Colors.grey.shade500,
                                    ),
                                    right: BorderSide(
                                      color: Colors.grey.shade500,
                                    ),
                                  );
                                  showLockedPattern = true;
                                } else {
                                  showPastOverlay = true;
                                  border = Border(
                                    bottom: BorderSide(
                                      color: Colors.grey.shade600,
                                    ),
                                    right: BorderSide(
                                      color: Colors.grey.shade600,
                                    ),
                                  );
                                }
                              }

                              return InkWell(
                                onTap: isBlocked
                                    ? null
                                    : () {
                                        if (isSharedOpen) {
                                          if (widget.onClickSharedSlot !=
                                              null) {
                                            widget.onClickSharedSlot!(
                                              slot,
                                              court,
                                              copy,
                                            );
                                          } else {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                  'Đây là khung giờ vãng lai đang mở.',
                                                ),
                                                behavior:
                                                    SnackBarBehavior.floating,
                                              ),
                                            );
                                          }

                                          return;
                                        }

                                        _toggleSlot(
                                          court: court,
                                          copy: copy,
                                          idx: idx,
                                        );
                                      },
                                borderRadius: BorderRadius.circular(
                                  isSharedOpen ? 4 : 0,
                                ),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  width: cellWidth,
                                  height: cellHeight,
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    border: border,
                                  ),
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      if (showLockedPattern)
                                        CustomPaint(
                                          painter: _LockedSlotPatternPainter(),
                                        ),
                                      if (showPastOverlay)
                                        ColoredBox(
                                          color: Colors.black.withOpacity(0.28),
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Slider(
              value: _scrollProgress,
              activeColor: primaryColor,
              onChanged: (val) {
                setState(() => _scrollProgress = val);
                if (_scheduleScrollController.hasClients) {
                  final maxScroll =
                      _scheduleScrollController.position.maxScrollExtent;
                  _scheduleScrollController.jumpTo(val * maxScroll);
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LockedSlotPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF525252).withOpacity(0.22)
      ..strokeWidth = 2;

    const spacing = 10.0;

    for (double startX = -size.height; startX < size.width; startX += spacing) {
      canvas.drawLine(
        Offset(startX, size.height),
        Offset(startX + size.height, 0),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _LockedSlotPatternPainter oldDelegate) {
    return false;
  }
}
