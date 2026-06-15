import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/post.dart';

class AreaCard extends StatelessWidget {
  final PostResponse post;
  final VoidCallback onTap;
  final VoidCallback onBookTap;

  const AreaCard({
    super.key,
    required this.post,
    required this.onTap,
    required this.onBookTap,
  });

  static final formatter = NumberFormat.decimalPattern('vi_VN');

  String formatPrice(double? price) {
    if (price == null) return 'Đang cập nhật';
    return 'Từ: ${formatter.format(price)}đ/giờ';
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = post.courtCoverImageUrl;

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          children: [
            Stack(
              children: [
                imageUrl != null && imageUrl.isNotEmpty
                    ? Image.network(
                  imageUrl,
                  height: 155,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _imagePlaceholder(),
                )
                    : _imagePlaceholder(),
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF48E083),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Còn sân',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: _buildInfo(),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: onBookTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE8DDFF),
                      foregroundColor: const Color(0xFF7C5CFF),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Text('Đặt ngay'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          post.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          post.courtName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFF6B7280),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 5),
        Row(
          children: [
            const Icon(
              Icons.location_on_outlined,
              size: 15,
              color: Colors.grey,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                post.address?.fullAddress ?? 'Đang cập nhật',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.star, size: 15, color: Colors.amber),
            const SizedBox(width: 4),
            Text(
              post.avgRating?.toStringAsFixed(1) ?? 'Chưa có',
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              formatPrice(post.minPrice),
              style: const TextStyle(
                color: Color(0xFF9156F1),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 155,
      width: double.infinity,
      color: const Color(0xFF243044),
      child: const Center(
        child: Icon(Icons.sports_soccer, color: Colors.white54, size: 42),
      ),
    );
  }
}