// lib/views/area/rental_area_detail_screen.dart

import 'package:flutter/material.dart';
import '../../services/rental_service.dart';
import '../../models/rental_area.dart';

class RentalAreaDetailScreen extends StatefulWidget {
  final String rentalAreaId;

  const RentalAreaDetailScreen({super.key, required this.rentalAreaId});

  @override
  State<RentalAreaDetailScreen> createState() => _RentalAreaDetailScreenState();
}

class _RentalAreaDetailScreenState extends State<RentalAreaDetailScreen> {
  bool _isLoading = true;
  RentalAreaResponse? _data;
  dynamic _activeCourt; // Lưu sân đang được chọn xem chi tiết

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    try {
      final result = await rentalService.getRentalAreaById(widget.rentalAreaId);
      setState(() {
        _data = result;
        if (result.courts.isNotEmpty) {
          _activeCourt = result.courts.first;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
  }

  void _handleChatClick() {
    // Tương tự logic dispatch event bên React
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đang mở khung chat với chủ sân...')),
    );
  }

  void _openBookingSheet() {
    // TODO: Hiện BottomSheet chứa form Đặt sân (CourtBookingPanel)
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(16),
        child: const Center(child: Text('Form Đặt Sân Sẽ Ở Đây')),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_data == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Không tìm thấy thông tin sân')),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(_data!.rentalAreaName),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            color: const Color(0xFF9156F1), // Màu tím chủ đạo của bạn
            onPressed: _handleChatClick,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 80), // Chừa chỗ cho nút đặt sân cố định
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Ảnh sân (Active Court)
            Image.network(
              _activeCourt?['coverImage'] ?? 'https://placehold.co/800x500?text=San+The+Thao',
              width: double.infinity,
              height: 250,
              fit: BoxFit.cover,
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 2. Tên sân & Địa chỉ
                  Text(
                    _data!.rentalAreaName,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _data!.address?.fullAddress ?? '',
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32),

                  // 3. Thông tin sân con đang chọn
                  if (_activeCourt != null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _activeCourt['courtName'] ?? 'Tên sân',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.purple[50],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Tổng: ${_activeCourt['totalCourts'] ?? 1} sân',
                            style: const TextStyle(color: Color(0xFF9156F1), fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _activeCourt['description'] ?? 'Chưa có mô tả cho sân này.',
                      style: const TextStyle(color: Colors.black87, height: 1.5),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // 4. Các sân khác (Vuốt ngang)
                  const Text(
                    'Các sân khác tại cơ sở',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _data!.courts.length,
                      itemBuilder: (context, index) {
                        final court = _data!.courts[index];
                        final isSelected = _activeCourt == court;
                        return GestureDetector(
                          onTap: () => setState(() => _activeCourt = court),
                          child: Container(
                            width: 120,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected ? const Color(0xFF9156F1) : Colors.grey[300]!,
                                width: isSelected ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(8),
                              image: DecorationImage(
                                image: NetworkImage(court['coverImage'] ?? 'https://placehold.co/150'),
                                fit: BoxFit.cover,
                                colorFilter: isSelected
                                    ? null
                                    : ColorFilter.mode(Colors.black.withOpacity(0.3), BlendMode.darken),
                              ),
                            ),
                            alignment: Alignment.bottomCenter,
                            padding: const EdgeInsets.all(8),
                            child: Text(
                              court['courtName'] ?? '',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        );
                      },
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),

      // Gắn nút Đặt Sân / Tạo trận dưới cùng màn hình
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () { /* TODO: Mở form Tạo trận */ },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFF3B82F6)),
                  ),
                  child: const Text('Tạo trận', style: TextStyle(color: Color(0xFF3B82F6))),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _openBookingSheet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9156F1),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Đặt sân ngay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}