import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/models/booking_price_helper.dart';
import 'package:mobile/models/selected_booking_slot.dart';
import 'package:provider/provider.dart';

import '../../../models/court.dart';
import '../../../models/rental_area.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/court_service.dart';
import '../../../services/rental_service.dart';

import '../../login/login_screen.dart';
import '../booking/booking_form_screen.dart';
import '../booking/match_config_widget.dart';
import 'court_info_tab.dart';
import 'court_price_tabs.dart';
import 'court_review_tabs.dart';
import 'schedule_tab.dart';

class RentalAreaDetailScreen extends StatefulWidget {
  final String rentalAreaId;

  const RentalAreaDetailScreen({super.key, required this.rentalAreaId});

  @override
  State<RentalAreaDetailScreen> createState() => _RentalAreaDetailScreenState();
}

class _RentalAreaDetailScreenState extends State<RentalAreaDetailScreen> {
  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  RentalAreaResponse? rentalArea;
  CourtResponse? activeCourt;

  bool loading = true;
  String? error;

  bool isMatchMode = false;
  MatchConfigData? currentMatchConfig;

  DateTime selectedDate = DateTime.now();
  int _activeTabIndex = 0;

  List<SelectedBookingSlot> selectedSlots = [];

  final List<String> _tabs = [
    'Xem lịch',
    'Thông tin sân',
    'Bảng giá',
    'Đánh giá',
  ];

  @override
  void initState() {
    super.initState();
    fetchRentalAreaDetail();
  }

  String _formatDate(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  Future<void> fetchRentalAreaDetail() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final response = await rentalService.getRentalAreaById(
        widget.rentalAreaId,
      );

      final courts = response.courts ?? [];

      CourtResponse? firstCourt;
      if (courts.isNotEmpty) {
        try {
          firstCourt = await courtService.getCourtById(courts.first.courtId);
        } catch (_) {
          firstCourt = courts.first;
        }
      }

      setState(() {
        rentalArea = response;
        activeCourt = firstCourt;
      });

      await fetchSchedule();
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> fetchSchedule() async {
    if (rentalArea == null) return;

    final scheduleCopies = await rentalService.getRentalAreaSchedule(
      rentalAreaId: widget.rentalAreaId,
      date: _formatDate(selectedDate),
    );

    setState(() {
      rentalArea = _mergeScheduleToRentalArea(rentalArea!, scheduleCopies);
    });
  }

  RentalAreaResponse _mergeScheduleToRentalArea(
      RentalAreaResponse area,
      List<dynamic> scheduleCopies,
      ) {
    final newCourts = (area.courts ?? []).map((court) {
      final newCopies = court.courtCopies.map((copy) {
        final matched = scheduleCopies.cast<dynamic>().where((s) {
          return s['courtCopyId']?.toString() == copy.courtCopyId;
        }).toList();

        if (matched.isEmpty) return copy;

        return copy.copyWithFromSchedule(matched.first);
      }).toList();

      return court.copyWith(courtCopies: newCopies);
    }).toList();

    return area.copyWith(courts: newCourts);
  }

  void _goToBookingForm() {
    if (selectedSlots.isEmpty) return;

    final authProvider = context.read<AuthProvider>();

    void openForm() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => BookingFormScreen(
            selectedSlots: selectedSlots,
            selectedDate: selectedDate,
            rentalArea: rentalArea,
            isMatchMode: isMatchMode,
            matchConfig: currentMatchConfig,
          ),
        ),
      );
    }

    if (!authProvider.isLoggedIn) {
      _showTopMessage('Vui lòng đăng nhập để tiếp tục!');

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LoginScreen(
            onLoginSuccess: openForm,
          ),
        ),
      );
      return;
    }

    openForm();
  }

  @override
  Widget build(BuildContext context) {
    final totalPrice = calculateTotalPrice(selectedSlots);

    if (loading) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator(color: primaryColor)),
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
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      bottomNavigationBar: (_activeTabIndex == 0 && selectedSlots.isNotEmpty)
          ? Container(
        // SỬA DÒNG PADDING NÀY:
        // Thêm MediaQuery.of(context).padding.bottom để tự động chừa chỗ cho thanh Home
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 16 + MediaQuery.of(context).padding.bottom,
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
          onPressed: _goToBookingForm,
          style: ElevatedButton.styleFrom(
            backgroundColor: selectedColor,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            'Đặt sân (${selectedSlots.length}) • ${NumberFormat.decimalPattern('vi_VN').format(totalPrice)} đ',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
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
              onTap: () => setState(() => _activeTabIndex = index),
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
        return ScheduleTab(
          rentalArea: rentalArea,
          activeCourt: activeCourt,
          selectedDate: selectedDate,
          selectedSlots: selectedSlots,
          isMatchMode: isMatchMode,
          onDateSelected: (date) async {
            setState(() {
              selectedDate = date;
              selectedSlots.clear();
              if ((rentalArea?.courts ?? []).isNotEmpty) {
                activeCourt = rentalArea!.courts!.first;
              }
            });

            await fetchSchedule();
          },
          onSelectedSlotsChanged: (slots) {
            setState(() => selectedSlots = slots);
          },
          onActiveCourtChanged: (court) {
            setState(() => activeCourt = court);
          },
          onModeChanged: (val) {
            setState(() {
              isMatchMode = val;
              currentMatchConfig ??= MatchConfigData(
                matchType: 'NORMAL',
                maxPlayers: 10,
                minPlayersToStart: 5,
                note: '',
              );
            });
          },
          onMatchConfigChanged: (config) {
            currentMatchConfig = config;
          },
        );
      case 1:
        return  CourtInfoTab(
          rentalArea: rentalArea,
          activeCourt: activeCourt,
          onCourtSelected: (court) {
            setState(() {
              activeCourt = court;
              selectedSlots.clear();
            });
          },
          onViewPriceTap: () {
            setState(() {
              _activeTabIndex = 2;
            });
          },
        );
      case 2:
        return CourtPriceTab(activeCourt: activeCourt);
      case 3:
        return const CourtReviewTab();
      default:
        return const SizedBox();
    }
  }
  void _showTopMessage(String message, {bool isError = false}) {
    final overlay = Overlay.of(context);

    final overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 12,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            decoration: BoxDecoration(
              color: isError ? Colors.red : Colors.orange,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(overlayEntry);

    Future.delayed(const Duration(seconds: 3), () {
      overlayEntry.remove();
    });
  }
}