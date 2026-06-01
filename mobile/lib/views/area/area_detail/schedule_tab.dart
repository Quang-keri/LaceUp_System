import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../models/court.dart';
import '../../../models/rental_area.dart';
import '../booking/match_config_widget.dart';

class ScheduleTab extends StatefulWidget {
  final RentalAreaResponse? rentalArea;
  final CourtResponse? activeCourt;
  final DateTime selectedDate;
  final List<String> selectedTimeSlots;
  final bool isMatchMode;
  final ValueChanged<DateTime> onDateSelected;
  final void Function(CourtResponse, String) onToggleSlot;
  final ValueChanged<bool> onModeChanged;
  final ValueChanged<MatchConfigData> onMatchConfigChanged;

  const ScheduleTab({
    super.key,
    required this.rentalArea,
    required this.activeCourt,
    required this.selectedDate,
    required this.selectedTimeSlots,
    required this.isMatchMode,
    required this.onDateSelected,
    required this.onToggleSlot,
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
    String openTimeStr = "05:00";
    String closeTimeStr = "22:00";

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

  String? _getSlotStatus(CourtResponse court, String timeStr) {
    final parts = timeStr.split(':');
    final slotMinute = int.parse(parts[0]) * 60 + int.parse(parts[1]);

    final allCopies = court.courtCopies ?? [];
    if (allCopies.isEmpty) return null;

    for (var copy in allCopies) {
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
    }

    return null;
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
          data: Theme.of(
            context,
          ).copyWith(colorScheme: ColorScheme.light(primary: primaryColor)),
          child: child!,
        );
      },
    );

    if (picked != null && picked != widget.selectedDate) {
      widget.onDateSelected(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDateSelector(context),
        _buildModeToggle(),
        const SizedBox(height: 8),
        _buildLegends(),
        const SizedBox(height: 16),
        _buildScrollHint(),
        _buildTimelineMatrix(),
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
                  curve: Curves.easeInOut,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: !widget.isMatchMode
                        ? primaryColor
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: !widget.isMatchMode
                        ? [
                            BoxShadow(
                              color: primaryColor.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [],
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
                  curve: Curves.easeInOut,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: widget.isMatchMode
                        ? selectedColor
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: widget.isMatchMode
                        ? [
                            BoxShadow(
                              color: selectedColor.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [],
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
          _buildLegendItem(selectedColor, 'Đang chọn', textColor: Colors.white),
          _buildLegendItem(primaryColor, 'Đã có trận (đủ)'),
          _buildLegendItem(Colors.orange.shade300, 'Đã có trận (thiếu)'),
          _buildLegendItem(Colors.grey.shade400, 'Khóa / Đã đặt'),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    Color color,
    String label, {
    Color? borderColor,
    Color? textColor,
  }) {
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
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.black87),
        ),
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
              'Vuốt ngang hoặc bấm nút để xem thêm khung giờ',
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

  Widget _buildTimelineMatrix() {
    final courts = widget.rentalArea?.courts ?? [];

    if (courts.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('Chưa có danh sách sân tại cơ sở này.'),
      );
    }

    const double cellWidth = 65;
    const double cellHeight = 45;
    const double leftColumnWidth = 110;

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
                      ...courts.map((court) {
                        return Container(
                          height: cellHeight,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: Colors.grey.shade300),
                            ),
                          ),
                          child: Text(
                            court.courtName,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: primaryColor,
                            ),
                            textAlign: TextAlign.center,
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
                          children: dynamicTimeSlots.asMap().entries.map((
                            entry,
                          ) {
                            final int idx = entry.key;
                            final String time = entry.value;

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
                                    left: idx == 0 ? 4 : -24,
                                    top: 0,
                                    bottom: 0,
                                    width: 48,
                                    child: Container(
                                      alignment: idx == 0
                                          ? Alignment.centerLeft
                                          : Alignment.center,
                                      child: Text(
                                        time,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black87,
                                        ),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    left: idx == 0 ? 0 : -1,
                                    bottom: 0,
                                    child: Container(
                                      width: 2,
                                      height: 6,
                                      color: primaryColor,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                        ...courts.map((court) {
                          return Row(
                            children: dynamicTimeSlots.map((time) {
                              final isSelected =
                                  widget.activeCourt?.courtId ==
                                      court.courtId &&
                                  widget.selectedTimeSlots.contains(time);

                              final slotStatus = _getSlotStatus(court, time);
                              final isBlocked = [
                                'BOOKED',
                                'MATCH_FULL',
                                'LOCKED',
                              ].contains(slotStatus);

                              Color bgColor = Colors.white;
                              BoxBorder? customBorder;

                              if (isSelected) {
                                bgColor = const Color(0xFFFFF7ED);
                                customBorder = Border(
                                  top: BorderSide(
                                    color: selectedColor,
                                    width: 2,
                                  ),
                                  bottom: BorderSide(
                                    color: selectedColor,
                                    width: 2,
                                  ),
                                  right: BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                );
                              } else if (slotStatus == 'BOOKED') {
                                bgColor = Colors.grey.shade400;
                              } else if (slotStatus == 'MATCH_FULL') {
                                bgColor = primaryColor;
                              } else if (slotStatus == 'MATCH_PENDING') {
                                bgColor = Colors.orange.shade300;
                              } else if (slotStatus == 'LOCKED') {
                                bgColor = Colors.grey.shade400;
                              }

                              return InkWell(
                                onTap: isBlocked
                                    ? null
                                    : () => widget.onToggleSlot(court, time),
                                child: Container(
                                  width: cellWidth,
                                  height: cellHeight,
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    border:
                                        customBorder ??
                                        Border(
                                          bottom: BorderSide(
                                            color: Colors.grey.shade300,
                                          ),
                                          right: BorderSide(
                                            color: Colors.grey.shade300,
                                          ),
                                        ),
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
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 6,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
                activeTrackColor: primaryColor,
                inactiveTrackColor: Colors.grey.shade200,
                thumbColor: primaryColor,
              ),
              child: Slider(
                value: _scrollProgress,
                onChanged: (val) {
                  setState(() {
                    _scrollProgress = val;
                  });
                  if (_scheduleScrollController.hasClients) {
                    final maxScroll =
                        _scheduleScrollController.position.maxScrollExtent;
                    _scheduleScrollController.jumpTo(val * maxScroll);
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
