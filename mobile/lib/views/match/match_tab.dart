import 'package:flutter/material.dart';

class MatchTab extends StatelessWidget {
  const MatchTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off_outlined, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'Không tìm thấy trận đấu nào!',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          const Text(
            'Hãy thử chọn "Làm mới" hoặc thay đổi tiêu chí bộ lọc.',
            style: TextStyle(fontSize: 14, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              // Xử lý tạo kèo tìm bạn ở đây
            },
            icon: const Icon(Icons.add),
            label: const Text('Tạo Kèo Tìm Bạn'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurpleAccent,
              foregroundColor: Colors.white,
            ),
          )
        ],
      ),
    );
  }
}