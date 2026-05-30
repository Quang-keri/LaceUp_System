import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/rental_service.dart';
import '../../services/court_service.dart';
import '../../models/rental_area.dart';
import '../../models/court.dart';
import 'booking_form_screen.dart';

class RentalAreaDetailScreen extends StatefulWidget {
  final String rentalAreaId;

  const RentalAreaDetailScreen({
    super.key,
    required this.rentalAreaId,
  });

  @override
  State<RentalAreaDetailScreen> createState() =>
      _RentalAreaDetailScreenState();
}

class _RentalAreaDetailScreenState extends State<RentalAreaDetailScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  final ScrollController _scheduleScrollController = ScrollController();

  RentalAreaResponse? rentalArea;
  CourtResponse? activeCourt;

  bool loading = true;
  String? error;

  DateTime selectedDate = DateTime.now();

  int _activeTabIndex = 0;

  final List<String> _tabs = [
    'Xem lịch',
    'Thông tin sân',
    'Bảng giá',
    'Đánh giá',
  ];

  List<String> selectedTimeSlots = [];

  final List<String> allTimeSlots = [
    '05:00',
    '05:30',
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
  ];

  @override
  void initState() {
    super.initState();
    fetchRentalAreaDetail();
  }

  @override
  void dispose() {
    _scheduleScrollController.dispose();
    super.dispose();
  }

  Future<void> fetchRentalAreaDetail() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final response =
      await rentalService.getRentalAreaById(widget.rentalAreaId);

      final courts = response.courts ?? [];

      CourtResponse? firstCourt;

      if (courts.isNotEmpty) {
        try {
          firstCourt =
          await courtService.getCourtById(courts.first.courtId);
        } catch (_) {
          firstCourt = courts.first;
        }
      }

      setState(() {
        rentalArea = response;
        activeCourt = firstCourt;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
      });
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  void _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
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

    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
        selectedTimeSlots.clear();

        if ((rentalArea?.courts ?? []).isNotEmpty) {
          activeCourt = rentalArea!.courts!.first;
        }
      });
    }
  }

  void _toggleTimeSlot(CourtResponse court, String time) {
    setState(() {
      if (activeCourt?.courtId != court.courtId) {
        activeCourt = court;
        selectedTimeSlots = [time];
      } else {
        if (selectedTimeSlots.contains(time)) {
          selectedTimeSlots.remove(time);

          if (selectedTimeSlots.isEmpty) {
            activeCourt = court;
          }
        } else {
          selectedTimeSlots.add(time);
          selectedTimeSlots.sort();
        }
      }
    });
  }

  void _goToBookingForm() {
    if (activeCourt == null || selectedTimeSlots.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingFormScreen(
          court: activeCourt!,
          selectedDate: selectedDate,
          selectedSlots: selectedTimeSlots,
        ),
      ),
    );
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

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(color: primaryColor),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          rentalArea?.rentalAreaName ?? 'Thông tin sân',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      bottomNavigationBar:
      (_activeTabIndex == 0 && selectedTimeSlots.isNotEmpty)
          ? Container(
        padding: const EdgeInsets.all(16),
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
          onPressed: _goToBookingForm,
          style: ElevatedButton.styleFrom(
            backgroundColor: selectedColor,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Đặt sân ${activeCourt?.courtName ?? ''} (${selectedTimeSlots.length} slot)',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      )
          : null,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTabsNav(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 40),
                child: _buildTabContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabsNav() {
    return Container(
      color: primaryColor,
      width: double.infinity,
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_tabs.length, (index) {
            final isActive = _activeTabIndex == index;

            return GestureDetector(
              onTap: () {
                setState(() {
                  _activeTabIndex = index;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isActive ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white),
                ),
                child: Text(
                  _tabs[index],
                  style: TextStyle(
                    color: isActive ? primaryColor : Colors.white,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTabIndex) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDateSelector(),
            const SizedBox(height: 8),
            _buildLegends(),
            const SizedBox(height: 16),
            _buildScrollHint(),
            _buildTimelineMatrix(),
          ],
        );
      case 1:
        return _buildCourtInfoTab();
      case 2:
        return _buildCourtPriceTab();
      case 3:
        return _buildReviewTab();
      default:
        return const SizedBox();
    }
  }

  Widget _buildDateSelector() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Lịch đặt sân',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          InkWell(
            onTap: () => _selectDate(context),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                border: Border.all(color: primaryColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.calendar_month, size: 16, color: primaryColor),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('dd/MM/yyyy').format(selectedDate),
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
          _buildLegendItem(
            selectedColor,
            'Đang chọn',
            textColor: Colors.white,
          ),
          _buildLegendItem(
            Colors.grey.shade400,
            'Khóa / Đã đặt',
          ),
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
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black87,
          ),
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
          _scrollButton(
            Icons.chevron_left,
                () => _scrollSchedule(-220),
          ),
          const SizedBox(width: 8),
          _scrollButton(
            Icons.chevron_right,
                () => _scrollSchedule(220),
          ),
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
    final courts = rentalArea?.courts ?? [];

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
      child: Container(
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
                      children: allTimeSlots.map((time) {
                        return Container(
                          width: cellWidth,
                          height: cellHeight,
                          alignment: Alignment.center,
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
                          child: Text(
                            time,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    ...courts.map((court) {
                      return Row(
                        children: allTimeSlots.map((time) {
                          final isSelected =
                              activeCourt?.courtId == court.courtId &&
                                  selectedTimeSlots.contains(time);

                          final isBooked = false;

                          return InkWell(
                            onTap: isBooked
                                ? null
                                : () => _toggleTimeSlot(court, time),
                            child: Container(
                              width: cellWidth,
                              height: cellHeight,
                              decoration: BoxDecoration(
                                color: isBooked
                                    ? Colors.grey.shade300
                                    : isSelected
                                    ? selectedColor
                                    : Colors.white,
                                border: Border(
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
    );
  }

  Widget _buildCourtInfoTab() {
    if (activeCourt == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text('Không có thông tin sân phù hợp.'),
        ),
      );
    }

    final courts = rentalArea?.courts ?? [];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  (activeCourt!.images != null &&
                      activeCourt!.images!.isNotEmpty)
                      ? activeCourt!.images!.first.imageUrl
                      : 'https://placehold.co/800x500?text=San+The+Thao',
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 200,
                      color: Colors.grey.shade200,
                      child: const Icon(
                        Icons.image_not_supported,
                        size: 50,
                        color: Colors.grey,
                      ),
                    );
                  },
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    activeCourt!.categoryName ?? 'Sân thể thao',
                    style: TextStyle(
                      color: selectedColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            activeCourt!.courtName,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.location_on, size: 16, color: primaryColor),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    rentalArea?.address != null
                        ? '${rentalArea!.address?.street}, ${rentalArea!.address?.ward}, ${rentalArea!.cityName ?? ''}'
                        : 'Chưa cập nhật địa chỉ',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            activeCourt!.description ??
                'Mặt sân đạt chuẩn, hệ thống chiếu sáng tốt, không gian thoáng đãng. Thích hợp cho tập luyện và thi đấu giao lưu.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Tiện ích sân',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          (activeCourt!.amenities.isNotEmpty)
              ? Wrap(
            spacing: 8,
            runSpacing: 8,
            children: activeCourt!.amenities.map((amenity) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E8FF),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE9D5FF)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 14,
                      color: primaryColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      amenity.amenityName,
                      style: TextStyle(
                        color: primaryColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          )
              : Text(
            'Sân này chưa cập nhật tiện ích.',
            style: TextStyle(
              color: Colors.grey.shade400,
              fontStyle: FontStyle.italic,
            ),
          )
             ,
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: Color(0xFFF1F5F9)),
          ),
          Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: selectedColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Tất cả các sân tại cơ sở',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: courts.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final court = courts[index];
              final isCurrent = court.courtId == activeCourt!.courtId;

              return InkWell(
                onTap: () {
                  setState(() {
                    activeCourt = court;
                    selectedTimeSlots.clear();
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                    isCurrent ? const Color(0xFFFFF7ED) : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isCurrent ? selectedColor : Colors.grey.shade200,
                      width: isCurrent ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        court.courtName,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isCurrent ? selectedColor : Colors.black87,
                        ),
                      ),
                      Text(
                        '${NumberFormat('#,###', 'vi_VN').format(court.pricePerHour)} đ/h',
                        style: TextStyle(
                          color: selectedColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCourtPriceTab() {
    if (activeCourt == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text('Không có thông tin bảng giá.'),
        ),
      );
    }

    final rules = activeCourt!.priceRules ?? [];

    if (rules.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: const Text(
            'Sân này hiện chưa có thông tin bảng giá chi tiết.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              children: [
                const TextSpan(
                  text: 'Bảng giá ',
                  style: TextStyle(color: Colors.black87),
                ),
                TextSpan(
                  text: '- ${activeCourt!.courtName}',
                  style: TextStyle(color: selectedColor),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...rules.map((rule) {
            final dayType = rule.dayType == 'WEEKDAY'
                ? 'T2 - T6'
                : rule.dayType == 'WEEKEND'
                ? 'T7 - CN'
                : 'Tất cả';

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(Icons.access_time, size: 18, color: primaryColor),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '$dayType | ${rule.startTime ?? ''} - ${rule.endTime ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    '${NumberFormat('#,###', 'vi_VN').format(rule.pricePerHour)} đ',
                    style: TextStyle(
                      color: selectedColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReviewTab() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.rate_review_outlined,
            size: 48,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'Chưa có đánh giá nào cho sân này.',
              style: TextStyle(
                color: Colors.grey,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }
}