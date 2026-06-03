import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/court.dart';
import '../../../models/court_copy.dart';
import '../../../models/rental_area.dart';
import '../../../models/selected_booking_slot.dart';
import '../booking/match_config_widget.dart';

class ScheduleTab extends StatefulWidget {
  final RentalAreaResponse? rentalArea;
  final CourtResponse? activeCourt;
  final DateTime selectedDate;
  final List<SelectedBookingSlot> selectedSlots;
  final bool isMatchMode;

  final ValueChanged<DateTime> onDateSelected;
  final ValueChanged<List<SelectedBookingSlot>> onSelectedSlotsChanged;
  final ValueChanged<CourtResponse> onActiveCourtChanged;
  final ValueChanged<bool> onModeChanged;
  final ValueChanged<MatchConfigData> onMatchConfigChanged;

  const ScheduleTab({
    super.key,
    required this.rentalArea,
    required this.activeCourt,
    required this.selectedDate,
    required this.selectedSlots,
    required this.isMatchMode,
    required this.onDateSelected,
    required this.onSelectedSlotsChanged,
    required this.onActiveCourtChanged,
    required this.onModeChanged,
    required this.onMatchConfigChanged,
  });

  @override
  State<ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<ScheduleTab> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  final ScrollController _scheduleScrollController = ScrollController();
  double _scrollProgress = 0.0;

  late List<String> dynamicTimeSlots;

  @override
  void initState() {
    super.initState();
    _scheduleScrollController.addListener(_onScroll);
    dynamicTimeSlots = _generateTimeSlots();
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

  String? _getSlotStatus(CourtCopyResponse copy, String timeStr) {
    final slotMinute = _timeToMinutes(timeStr);
    final slots = copy.slots ?? [];

    for (var slot in slots) {
      final start = DateTime.tryParse(slot.startTime ?? '');
      final end = DateTime.tryParse(slot.endTime ?? '');

      if (start == null || end == null) continue;

      if (start.year == widget.selectedDate.year &&
          start.month == widget.selectedDate.month &&
          start.day == widget.selectedDate.day) {
        final startMin = start.hour * 60 + start.minute;
        final endMin = end.hour * 60 + end.minute;

        if (slotMinute >= startMin && slotMinute < endMin) {
          return slot.slotStatus;
        }
      }
    }

    return null;
  }

  void _toggleSlot({
    required CourtResponse court,
    required CourtCopyResponse copy,
    required int idx,
  }) {
    final currentSlots = [...widget.selectedSlots];

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
          merged[merged.length - 1] = last.copyWith(
            endIndex: block.endIndex,
          );
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
    _scheduleScrollController.removeListener(_onScroll);
    _scheduleScrollController.dispose();
    super.dispose();
  }

  void _scrollSchedule(double offset) {
    if (!_scheduleScrollController.hasClients) return;
    final target = (_scheduleScrollController.offset + offset).clamp(
      0.0,
      _scheduleScrollController.position.maxScrollExtent,
    );
    _scheduleScrollController.animateTo(
      target,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: widget.selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(primary: primaryColor),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != widget.selectedDate) {
      widget.onDateSelected(picked);
    }
  }

  List<Map<String, dynamic>> _buildCourtCopyRows() {
    final rows = <Map<String, dynamic>>[];

    for (final court in widget.rentalArea?.courts ?? []) {
      for (final copy in court.courtCopies) {
        rows.add({
          'court': court,
          'copy': copy,
        });
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
        const SizedBox(height: 8),
        _buildLegends(),
        const SizedBox(height: 16),
        _buildScrollHint(),

        const SizedBox(height: 8),
        _buildTimelineMatrix(rows),
        const SizedBox(height: 16),
        _buildBookingNotice(),
        if (widget.isMatchMode)
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => widget.onModeChanged(false),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: !widget.isMatchMode
                        ? primaryColor
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Text(
                    'Đặt sân',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: !widget.isMatchMode
                          ? Colors.white
                          : Colors.grey.shade600,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => widget.onModeChanged(true),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: widget.isMatchMode
                        ? selectedColor
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Text(
                    'Ghép kèo',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: widget.isMatchMode
                          ? Colors.white
                          : Colors.grey.shade600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegends() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 12,
        runSpacing: 8,
        children: [
          _buildLegendItem(
            Colors.white,
            'Trống',
            borderColor: Colors.grey.shade400,
          ),
          _buildLegendItem(selectedColor, 'Đang chọn'),
          _buildLegendItem(const Color(0xFFEA580C), 'Đã đặt'),
          _buildLegendItem(primaryColor, 'Đã có trận'),
          _buildLegendItem(Colors.orange.shade300, 'Trận chưa đủ'),
          _buildLegendItem(Colors.grey.shade400, 'Khóa'),
        ],
      ),
    );
  }
  Widget _buildBookingNotice() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFFDBA74),
        ),
      ),
      child: RichText(
        text: const TextSpan(
          style: TextStyle(
            fontSize: 13,
            height: 1.6,
            color: Color(0xFFEA580C),
          ),
          children: [
            TextSpan(
              text: '* Lưu ý: ',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            TextSpan(
              text:
              'Bạn hãy lựa chọn vào khung giờ phù hợp với mình nhất dưới các ô dưới đây.\n'
                  'Đăng nhập để đặt lịch nhanh hơn, theo dõi lịch sử đặt sân và nhận thông báo ưu đãi từ chúng tôi.\n'
                  'Hệ thống chúng tôi hiện không hỗ trợ hoàn tiền, hãy chọn thời gian phù hợp.',
            ),
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

  Widget _buildScrollHint() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Row(
        children: [
          Icon(Icons.swipe_outlined, size: 16, color: Colors.grey.shade500),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'Vuốt ngang để chọn nhiều khung giờ',
              style: TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          _scrollButton(Icons.chevron_left, () => _scrollSchedule(-220)),
          const SizedBox(width: 8),
          _scrollButton(Icons.chevron_right, () => _scrollSchedule(220)),
        ],
      ),
    );
  }

  Widget _scrollButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFF3E8FF),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE9D5FF)),
        ),
        child: Icon(icon, color: primaryColor, size: 22),
      ),
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
                              // Dùng Stack để ép text nằm đè lên vạch chia (Border)
                              child: Stack(
                                clipBehavior: Clip.none, // Quan trọng: Cho phép chữ tràn ra ngoài viền Container
                                children: [
                                  // 1. Mốc giờ bắt đầu nằm ở vạch bên TRÁI
                                  Positioned(
                                    // Ô đầu tiên nhích vào trong 4px để không bị lẹm vào cột Tên Sân.
                                    // Các ô tiếp theo dịch sang trái -16px để chữ (rộng khoảng 32px) nằm ngay chính giữa vạch kẻ.
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

                                  // 2. Xử lý riêng cho ô CUỐI CÙNG: Thêm mốc giờ kết thúc ở vạch bên PHẢI
                                  if (idx == dynamicTimeSlots.length - 1)
                                    Positioned(
                                      right: 4, // Nhích vào trong 4px ở lề phải cùng để không tràn khỏi màn hình
                                      top: 0,
                                      bottom: 0,
                                      child: Center(
                                        child: Text(
                                          widget.rentalArea?.closeTime?.substring(0, 5) ?? '22:00',
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

                              final slotStatus = _getSlotStatus(copy, time);

                              final isBlocked = [
                                'BOOKED',
                                'MATCH_FULL',
                                'LOCKED',
                              ].contains(slotStatus);

                              final activeBlock = myBlocks.where((b) {
                                return idx >= b.startIndex &&
                                    idx <= b.endIndex;
                              }).toList();

                              final isSelected = activeBlock.isNotEmpty;

                              Color bgColor = Colors.white;
                              BoxBorder border = Border(
                                bottom: BorderSide(color: Colors.grey.shade300),
                                right: BorderSide(color: Colors.grey.shade300),
                              );

                              if (slotStatus == 'BOOKED') {
                                bgColor = const Color(0xFFEA580C);
                              } else if (slotStatus == 'MATCH_FULL') {
                                bgColor = primaryColor;
                              } else if (slotStatus == 'MATCH_PENDING') {
                                bgColor = Colors.orange.shade300;
                              } else if (slotStatus == 'LOCKED') {
                                bgColor = Colors.grey.shade400;
                              }

                              if (isSelected) {
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
                                      : BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                );
                              }

                              return InkWell(
                                onTap: isBlocked
                                    ? null
                                    : () => _toggleSlot(
                                  court: court,
                                  copy: copy,
                                  idx: idx,
                                ),
                                child: Container(
                                  width: cellWidth,
                                  height: cellHeight,
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    border: border,
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