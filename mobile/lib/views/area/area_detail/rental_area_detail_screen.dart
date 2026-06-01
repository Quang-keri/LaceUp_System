import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/views/area/area_detail/schedule_tab.dart';
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
  List<String> selectedTimeSlots = [];

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
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
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

    final authProvider = context.read<AuthProvider>();

    void openForm() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => BookingFormScreen(
            court: activeCourt!,
            selectedDate: selectedDate,
            selectedSlots: selectedTimeSlots,
            isMatchMode: isMatchMode,
            matchConfig: currentMatchConfig,
            rentalArea: rentalArea,
          ),
        ),
      );
    }

    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập để tiếp tục!'),
          backgroundColor: Colors.orange,
        ),
      );

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LoginScreen(
            onLoginSuccess: () {
              openForm();
            },
          ),
        ),
      );
      return;
    }

    openForm();
  }

  @override
  Widget build(BuildContext context) {
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
                  isMatchMode
                      ? 'Tạo kèo ${activeCourt?.courtName ?? ''} (${selectedTimeSlots.length} slot)'
                      : 'Đặt sân ${activeCourt?.courtName ?? ''} (${selectedTimeSlots.length} slot)',
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
          selectedTimeSlots: selectedTimeSlots,
          isMatchMode: isMatchMode,
          onDateSelected: (date) {
            setState(() {
              selectedDate = date;
              selectedTimeSlots.clear();
              if ((rentalArea?.courts ?? []).isNotEmpty) {
                activeCourt = rentalArea!.courts!.first;
              }
            });
          },
          onToggleSlot: _toggleTimeSlot,
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
        return CourtInfoTab(
          rentalArea: rentalArea,
          activeCourt: activeCourt,
          onCourtSelected: (court) {
            setState(() {
              activeCourt = court;
              selectedTimeSlots.clear();
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
}
