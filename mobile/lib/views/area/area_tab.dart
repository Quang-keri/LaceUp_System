// lib/views/area/area_tab.dart

import 'package:flutter/material.dart';
import '../../models/page_response.dart';
import '../../services/post_service.dart';
import '../../models/post.dart';
import 'rental_area_detail_screen.dart'; // Thêm import màn hình chi tiết vào đây

class AreaTab extends StatefulWidget {
  const AreaTab({super.key});

  @override
  State<AreaTab> createState() => _AreaTabState();
}

class _AreaTabState extends State<AreaTab> {
  late Future<PageResponse<PostResponse>> _postsFuture;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  void _fetchData() {
    _postsFuture = postService.getPosts({});
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _fetchData();
    });
    await _postsFuture;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: FutureBuilder<PageResponse<PostResponse>>(
        future: _postsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
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
                  SizedBox(height: 16),
                  CircularProgressIndicator(),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.redAccent),
                    const SizedBox(height: 16),
                    Text(
                      'Đã xảy ra lỗi:\n${snapshot.error.toString().replaceAll('Exception: ', '')}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _handleRefresh,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Thử lại'),
                    )
                  ],
                ),
              ),
            );
          }

          final posts = snapshot.data?.data ?? [];

          if (posts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.search_off, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Chưa có sân bóng nào được đăng.'),
                  TextButton(
                    onPressed: _handleRefresh,
                    child: const Text('Tải lại'),
                  )
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _handleRefresh,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: posts.length,
              itemBuilder: (context, index) {
                final post = posts[index];

                return Card(
                  elevation: 2,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        post.courtCoverImageUrl.isNotEmpty
                            ? post.courtCoverImageUrl
                            : 'https://via.placeholder.com/150',
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            Container(
                              width: 60, height: 60, color: Colors.grey[300],
                              child: const Icon(Icons.image_not_supported),
                            ),
                      ),
                    ),
                    title: Text(
                      post.title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          post.address,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${post.price}đ',
                          style: const TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const Text('/giờ', style: TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),

                    // XỬ LÝ CHUYỂN TRANG Ở ĐÂY
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => RentalAreaDetailScreen(
                            // Truyền rentalAreaId từ bài post sang màn hình Chi tiết
                            rentalAreaId: post.rentalAreaId,
                          ),
                        ),
                      );
                    },

                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}