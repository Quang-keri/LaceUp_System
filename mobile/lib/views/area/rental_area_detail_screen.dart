import 'package:flutter/material.dart';
import '../../services/rental_service.dart';

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

  String formatPrice(dynamic price) {
    if (price == null) return 'Liên hệ';
    final value = double.tryParse(price.toString()) ?? 0;
    return '${value.toStringAsFixed(0)}đ / giờ';
  }

  String getAddressText() {
    final address = rentalArea?['address'];

    if (address == null) return 'Đang cập nhật địa chỉ';

    return address.fullAddress;
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

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF9156F1),
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
      bottomNavigationBar: _buildBookingButton(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 100),
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
                  const SizedBox(height: 18),
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

  String formatTime(dynamic time) {
    if (time == null) return '--:--';
    final value = time.toString();
    if (value.length >= 5) return value.substring(0, 5);
    return value;
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

  Widget _buildBookingButton() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: ElevatedButton(
        onPressed: _openBookingSheet,
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: const Text(
          'Chọn lịch đặt sân',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }

  void _openBookingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            16,
            18,
            16,
            MediaQuery.of(context).viewInsets.bottom + 18,
          ),
          child: BookingFormSheet(
            court: activeCourt!,
          ),
        );
      },
    );
  }
}

class BookingFormSheet extends StatelessWidget {
  final Map<String, dynamic> court;

  const BookingFormSheet({
    super.key,
    required this.court,
  });

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF9156F1);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 42,
          height: 5,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(99),
          ),
        ),
        const SizedBox(height: 18),
        Text(
          court['courtName'] ?? 'Thông tin đặt sân',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 18),
        TextField(
          decoration: InputDecoration(
            labelText: 'Ngày chơi',
            hintText: 'VD: 2026-05-22',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Giờ bắt đầu',
                  hintText: '17:00',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Giờ kết thúc',
                  hintText: '19:00',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Số lượng sân',
            hintText: '1',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: () {},
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Kiểm tra lịch trống',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ],
    );
  }
}