import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/rental_service.dart';
import 'booking_form_screen.dart'; // Nhớ import màn hình Form đặt sân (Màn 2)

class RentalAreaDetailScreen extends StatefulWidget {
  final String rentalAreaId;

  const RentalAreaDetailScreen({
    super.key,
    required this.rentalAreaId,
  });

  @override
  State<RentalAreaDetailScreen> createState() => _RentalAreaDetailScreenState();
}

class _RentalAreaDetailScreenState extends State<RentalAreaDetailScreen> {
  final Color primaryColor = const Color(0xFF9156F1);

  dynamic rentalArea;
  Map<String, dynamic>? activeCourt;

  bool loading = true;
  String? error;

  // Biến lưu trữ ngày đang chọn trên Lịch
  DateTime selectedDate = DateTime.now();

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

      setState(() {
        rentalArea = {
          'rentalAreaId': response.rentalAreaId,
          'rentalAreaName': response.rentalAreaName,
          'address': response.address,
          'contactName': response.contactName,
          'contactPhone': response.contactPhone,
          'status': response.status,
          'cityId': response.cityId,
          'cityName': response.cityName,
          'courts': response.courts,
        };

        if (response.courts.isNotEmpty) {
          activeCourt = Map<String, dynamic>.from(
            response.courts.first,
          );
        }
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
      });
    }
  }

  void _onTimeSlotTapped(String time) {
    if (activeCourt == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingFormScreen(
          court: activeCourt!,
          selectedDate: selectedDate,
          initialTime: time,
        ),
      ),
    );
  }


  String formatPrice(dynamic price) {
    if (price == null) return 'Liên hệ';
    final value = double.tryParse(price.toString()) ?? 0;
    return '${value.toStringAsFixed(0)}đ / giờ';
  }

  String formatTime(dynamic time) {
    if (time == null) return '--:--';
    final value = time.toString();
    if (value.length >= 5) return value.substring(0, 5);
    return value;
  }

  String getAddressText() {
    final address = rentalArea?['address'];
    if (address == null) return 'Đang cập nhật địa chỉ';
       return address.toString();
  }

  dynamic getPrice() {
    return activeCourt?['minPrice'] ?? activeCourt?['price'];
  }

  String? getImageUrl() {
    final coverImage = activeCourt?['coverImage'];

    if (coverImage != null && coverImage.toString().isNotEmpty) {
      return coverImage.toString();
    }

    final images = activeCourt?['images'];

    if (images is List && images.isNotEmpty) {
      final cover = images.firstWhere(
            (img) => img['isCover'] == true,
        orElse: () => images.first,
      );
      return cover['imageUrl'];
    }

    return null;
  }

  List get courts {
    final data = rentalArea?['courts'];
    if (data is List) return data;
    return [];
  }

  List get priceRules {
    final data = activeCourt?['priceRules'];
    if (data is List) return data;
    return [];
  }

  List get amenities {
    final data = activeCourt?['amenities'];
    if (data is List) return data;
    return [];
  }

  // ---- GIAO DIỆN CHÍNH ----

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(
            color: primaryColor,
          ),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ),
      );
    }

    if (rentalArea == null || activeCourt == null) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Text('Không có dữ liệu sân'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 40), // Cách đáy một chút cho thoáng
          children: [
            _buildImageHeader(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildRentalInfo(),
                  const SizedBox(height: 18),
                  _buildCourtInfo(),
                  const SizedBox(height: 24),
                  _buildCalendarAndTimeSlots(),

                  const SizedBox(height: 24),
                  _buildAmenities(),
                  const SizedBox(height: 18),
                  _buildPriceRules(),
                  const SizedBox(height: 18),
                  _buildOtherCourts(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildImageHeader() {
    final imageUrl = getImageUrl();

    return Stack(
      children: [
        imageUrl != null
            ? Image.network(
          imageUrl,
          height: 240,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _imagePlaceholder(),
        )
            : _imagePlaceholder(),
        Positioned(
          top: 14,
          left: 14,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: const Icon(Icons.arrow_back),
              color: Colors.black87,
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),
        Positioned(
          bottom: 14,
          left: 14,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              activeCourt?['categoryName'] ?? 'Sân thể thao',
              style: TextStyle(
                color: primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 240,
      width: double.infinity,
      color: const Color(0xFFF3F4F6),
      child: Icon(
        Icons.sports_tennis,
        size: 70,
        color: primaryColor,
      ),
    );
  }

  Widget _buildRentalInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          rentalArea?['rentalAreaName'] ?? 'Thông tin sân',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.location_on_outlined, size: 18, color: Colors.grey),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                getAddressText(),
                style: const TextStyle(color: Colors.grey),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(Icons.phone, size: 17, color: primaryColor),
            const SizedBox(width: 6),
            Text(
              rentalArea?['contactPhone'] ?? 'Chưa có số liên hệ',
              style: const TextStyle(
                color: Color(0xFF374151),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCourtInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F5FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE9D8FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            activeCourt?['courtName'] ?? 'Tên sân',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Mặt sân đạt chuẩn, hệ thống chiếu sáng tốt, không gian thoáng đãng. Thích hợp cho tập luyện và thi đấu giao lưu.',
            style: TextStyle(
              color: Color(0xFF6B7280),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.sports, color: primaryColor, size: 18),
              const SizedBox(width: 6),
              Text(
                'Tổng cộng: ${activeCourt?['totalCourts'] ?? 1} sân',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // WIDGET MỚI: Hiển thị lịch chọn ngày và khung giờ
  Widget _buildCalendarAndTimeSlots() {
    // Tạm tạo danh sách giờ mock. Sau này bạn có API check giờ trống thì map data vào đây nhé.
    final List<String> timeSlots = [
      '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Lịch sân + Nút chọn ngày
        Row(
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
                      DateFormat('dd/MM/yyyy').format(selectedDate),
                      style: TextStyle(
                          color: primaryColor,
                          fontWeight: FontWeight.bold
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: timeSlots.map((time) {
            return InkWell(
              onTap: () => _onTimeSlotTapped(time),
              child: Container(
                width: (MediaQuery.of(context).size.width - 32 - 30) / 4,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  time,
                  style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildAmenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tiện ích sân',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        amenities.isEmpty
            ? const Text(
          'Sân này chưa cập nhật tiện ích.',
          style: TextStyle(color: Colors.grey),
        )
            : Wrap(
          spacing: 10,
          runSpacing: 10,
          children: amenities.map<Widget>((amenity) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F0FF),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, color: primaryColor, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    amenity['amenityName'] ?? 'Tiện ích',
                    style: TextStyle(
                      color: primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPriceRules() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bảng giá tham khảo',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          priceRules.isEmpty
              ? const Text(
            'Sân này chưa có bảng giá.',
            style: TextStyle(color: Colors.grey),
          )
              : Column(
            children: priceRules.map<Widget>((rule) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${formatTime(rule['startTime'])} - ${formatTime(rule['endTime'])}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      formatPrice(rule['pricePerHour']),
                      style: TextStyle(
                        color: primaryColor,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildOtherCourts() {
    final otherCourts = courts.where((court) {
      return court['courtId'] != activeCourt?['courtId'];
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Các sân khác tại cơ sở',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        otherCourts.isEmpty
            ? const Text(
          'Không có sân nào khác tại cơ sở này.',
          style: TextStyle(color: Colors.grey),
        )
            : Column(
          children: otherCourts.map<Widget>((court) {
            final imageUrl = court['coverImage'];

            return GestureDetector(
              onTap: () {
                setState(() {
                  activeCourt = Map<String, dynamic>.from(court);
                });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 92,
                      height: 76,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: imageUrl != null && imageUrl.toString().isNotEmpty
                          ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) {
                            return Icon(
                              Icons.sports_tennis,
                              color: primaryColor,
                            );
                          },
                        ),
                      )
                          : Icon(Icons.sports_tennis, color: primaryColor),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            court['courtName'] ?? 'Tên sân',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            court['categoryName'] ?? 'Sân thể thao',
                            style: const TextStyle(color: Colors.grey),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formatPrice(court['minPrice'] ?? court['price']),
                            style: TextStyle(
                              color: primaryColor,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}