import 'dart:async';

import 'package:flutter/material.dart';

import '../../models/news.dart';
import '../../services/news_service.dart';
import 'news_detail_screen.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  final TextEditingController searchController = TextEditingController();

  List<NewsModel> news = [];
  bool loading = true;
  String? error;

  Timer? debounce;

  @override
  void initState() {
    super.initState();
    fetchNews();
  }

  @override
  void dispose() {
    searchController.dispose();
    debounce?.cancel();
    super.dispose();
  }

  Future<void> fetchNews() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final result = await newsService.getAll(
        page: 0,
        size: 10,
        keyword: searchController.text.trim(),
      );

      if (!mounted) return;

      setState(() {
        news = result;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        error = e.toString().replaceAll('Exception: ', '');
        news = [];
      });
    } finally {
      if (!mounted) return;

      setState(() {
        loading = false;
      });
    }
  }

  void onSearchChanged(String value) {
    debounce?.cancel();

    debounce = Timer(const Duration(milliseconds: 500), () {
      fetchNews();
    });
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

  Widget buildSearchBox() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: TextField(
        controller: searchController,
        onChanged: onSearchChanged,
        decoration: const InputDecoration(
          hintText: 'Tìm kiếm tin tức...',
          prefixIcon: Icon(Icons.search, color: Color(0xFF9156F1)),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 15,
          ),
        ),
      ),
    );
  }

  Widget buildNewsCard(NewsModel item) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => NewsDetailScreen(newsId: item.id),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 18),
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
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (item.coverImage.isNotEmpty)
              Image.network(
                item.coverImage,
                height: 190,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => buildImagePlaceholder(),
              )
            else
              buildImagePlaceholder(),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_month,
                        size: 16,
                        color: Color(0xFF9156F1),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        formatDate(item.createdAt),
                        style: const TextStyle(
                          color: Colors.black54,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    item.content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.black54,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),

                  const SizedBox(height: 14),

                  const Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Đọc tiếp',
                        style: TextStyle(
                          color: Color(0xFF9156F1),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward,
                        color: Color(0xFF9156F1),
                        size: 18,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildImagePlaceholder() {
    return Container(
      height: 190,
      width: double.infinity,
      color: const Color(0xFFE5E7EB),
      child: const Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          size: 46,
          color: Colors.black38,
        ),
      ),
    );
  }

  Widget buildEmpty() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Không tìm thấy bài viết nào phù hợp.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.black54,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          error ?? 'Đã xảy ra lỗi',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.redAccent,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        title: const Text(
          'Tin tức thể thao',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          buildSearchBox(),

          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                ? buildError()
                : news.isEmpty
                ? buildEmpty()
                : RefreshIndicator(
              onRefresh: fetchNews,
              child: ListView.builder(
                padding: const EdgeInsets.only(bottom: 90),
                itemCount: news.length,
                itemBuilder: (context, index) {
                  return buildNewsCard(news[index]);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}