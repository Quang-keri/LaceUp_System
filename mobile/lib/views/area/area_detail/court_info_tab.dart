import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../models/court.dart';
import '../../../models/rental_area.dart';

class CourtInfoTab extends StatelessWidget {
  final RentalAreaResponse? rentalArea;
  final CourtResponse? activeCourt;
  final ValueChanged<CourtResponse> onCourtSelected;
  final VoidCallback onViewPriceTap;
  const CourtInfoTab({
    super.key,
    required this.rentalArea,
    required this.activeCourt,
    required this.onCourtSelected,
    required this.onViewPriceTap,
  });

  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  @override
  Widget build(BuildContext context) {
    if (activeCourt == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('Không có thông tin sân phù hợp.')),
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
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
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
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
                ),
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
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
                onTap: () => onCourtSelected(court),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isCurrent ? const Color(0xFFFFF7ED) : Colors.white,
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
                  InkWell(
                    onTap: onViewPriceTap,
                    child: Row(
                      children: [
                        Text(
                          'Xem bảng giá',
                          style: TextStyle(
                            color: primaryColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 12,
                          color: primaryColor,
                        ),
                      ],
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
}
