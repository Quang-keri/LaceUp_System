import 'package:flutter/material.dart';

class AreaTab extends StatelessWidget {
  const AreaTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.stadium_outlined, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Đang tải danh sách sân...',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}