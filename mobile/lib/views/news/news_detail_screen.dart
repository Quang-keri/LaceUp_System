import 'package:flutter/material.dart';

import '../../models/news.dart';
import '../../services/news_service.dart';

class NewsDetailScreen extends StatefulWidget {
  final dynamic newsId;

  const NewsDetailScreen({
    super.key,
    required this.newsId,
  });

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  NewsModel? news;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    fetchDetail();
  }

  Future<void> fetchDetail() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final result = await newsService.getById(widget.newsId);

      if (!mounted) return;

      setState(() {
        news = result;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (!mounted) return;

      setState(() {
        loading = false;
      });
    }
  }

  String formatDate(String? value) {
    if (value == null || value.isEmpty) return 'Đang cập nhật';

    try {
      final date = DateTime.parse(value);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return value;
    }
  }

  Widget buildImagePlaceholder() {
    return Container(
      height: 240,
      width: double.infinity,
      color: const Color(0xFFE5E7EB),
      child: const Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          size: 52,
          color: Colors.black38,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = news;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        title: const Text('Chi tiết tin tức'),
        centerTitle: true,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            error!,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.redAccent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      )
          : item == null
          ? const Center(child: Text('Không tìm thấy bài viết'))
          : RefreshIndicator(
        onRefresh: fetchDetail,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 40),
          children: [
            if (item.coverImage.isNotEmpty)
              Image.network(
                item.coverImage,
                height: 240,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    buildImagePlaceholder(),
              )
            else
              buildImagePlaceholder(),

            Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_month,
                        size: 17,
                        color: Color(0xFF9156F1),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        formatDate(item.createdAt),
                        style: const TextStyle(
                          color: Colors.black54,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  Text(
                    item.title,
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      height: 1.25,
                    ),
                  ),

                  const SizedBox(height: 16),

                  Text(
                    item.content,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 16,
                      height: 1.6,
                    ),
                  ),

                  if (item.images.length > 1) ...[
                    const SizedBox(height: 24),
                    const Text(
                      'Hình ảnh liên quan',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),

                    ...item.images.map((img) {
                      if (img.imageUrl.isEmpty ||
                          img.imageUrl == item.coverImage) {
                        return const SizedBox.shrink();
                      }

                      return Padding(
                        padding:
                        const EdgeInsets.only(bottom: 12),
                        child: ClipRRect(
                          borderRadius:
                          BorderRadius.circular(16),
                          child: Image.network(
                            img.imageUrl,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                            const SizedBox.shrink(),
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}