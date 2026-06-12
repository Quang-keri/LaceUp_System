import 'package:flutter/material.dart';
import 'package:mobile/views/area/area_detail/rental_area_detail_screen.dart';

import '../../models/post.dart';
import '../../services/post_service.dart';
import '../../services/location_service.dart';
import '../../services/category_service.dart';
import '../../services/amenity_service.dart';

import 'widgets/area_card.dart';
import 'widgets/area_header.dart';
import 'widgets/area_search_box.dart';
import 'widgets/area_pagination.dart';
import 'widgets/area_filter_bottom_sheet.dart';

class AreaListScreen extends StatefulWidget {
  const AreaListScreen({super.key});
  @override
  State<AreaListScreen> createState() => _AreaListScreenState();
}

class _AreaListScreenState extends State<AreaListScreen> {
  final TextEditingController searchController = TextEditingController();

  List<PostResponse> posts = [];
  bool loading = true;
  String? error;

  int page = 1;
  int size = 10;
  int totalElements = 0;

  int minPrice = 0;
  int maxPrice = 500000;
  int minRating = 0;
  String? sortBy;

  List<int> provinceCodes = [];
  List<int> categoryIds = [];
  List<int> amenityIds = [];

  List<dynamic> provinces = [];
  List<dynamic> categories = [];
  List<dynamic> amenities = [];

  @override
  void initState() {
    super.initState();
    fetchFilterData();
    fetchPosts();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  int get totalPages {
    if (totalElements == 0) return 1;
    return (totalElements / size).ceil();
  }

  int get filterCount {
    int count = 0;
    if (sortBy != null) count++;
    if (minRating > 0) count++;
    if (minPrice > 0 || maxPrice < 500000) count++;
    if (provinceCodes.isNotEmpty) count++;
    if (categoryIds.isNotEmpty) count++;
    if (amenityIds.isNotEmpty) count++;
    return count;
  }

  bool get hasAnyFilter => filterCount > 0;

  Future<void> fetchFilterData() async {
    try {
      final provinceRes = await locationService.getProvinces();
      final categoryRes = await categoryService.getAllCategories(
        page: 1,
        size: 100,
      );
      final amenityRes = await amenityService.getAllAmenities();

      if (!mounted) return;

      setState(() {
        provinces = provinceRes;
        categories = categoryRes.data ?? [];
        amenities = amenityRes;
      });
    } catch (e) {
      debugPrint('Fetch filter data error: $e');
    }
  }

  Future<void> fetchPosts() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final response = await postService.getPosts(
        page: page,
        size: size,
        title: searchController.text.trim().isEmpty
            ? null
            : searchController.text.trim(),
        minPrice: minPrice > 0 ? minPrice : null,
        maxPrice: maxPrice < 500000 ? maxPrice : null,
        sortBy: sortBy,
        minRating: minRating > 0 ? minRating : null,
        provinceCodes: provinceCodes.isNotEmpty ? provinceCodes : null,
        categoryIds: categoryIds.isNotEmpty ? categoryIds : null,
        amenityIds: amenityIds.isNotEmpty ? amenityIds : null,
      );
      if (!mounted) return;

      setState(() {
        posts = response.data;
        totalElements = response.totalElements;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => error = e.toString());
    } finally {
      if (!mounted) return;
      setState(() => loading = false);
    }
  }

  void clearFilter() {
    setState(() {
      page = 1;
      minPrice = 0;
      maxPrice = 500000;
      minRating = 0;
      sortBy = null;
      provinceCodes = [];
      categoryIds = [];
      amenityIds = [];
    });

    fetchPosts();
  }

  void openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return DraggableScrollableSheet(
          initialChildSize: 0.86,
          minChildSize: 0.55,
          maxChildSize: 0.95,
          builder: (context, scrollController) {
            return AreaFilterBottomSheet(
              scrollController: scrollController,
              minPrice: minPrice,
              maxPrice: maxPrice,
              minRating: minRating,
              sortBy: sortBy,
              provinceCodes: provinceCodes,
              categoryIds: categoryIds,
              amenityIds: amenityIds,
              provinces: provinces,
              categories: categories,
              amenities: amenities,
              onApply: ({
                required newCategoryIds,
                required newAmenityIds,
                required newMaxPrice,
                required newMinPrice,
                required newMinRating,
                required newProvinceCodes,
                required newSortBy,
              }) {
                setState(() {
                  minPrice = newMinPrice;
                  maxPrice = newMaxPrice;
                  minRating = newMinRating;
                  sortBy = newSortBy;
                  provinceCodes = newProvinceCodes;
                  categoryIds = newCategoryIds;
                  amenityIds = newAmenityIds;
                  page = 1;
                });

                fetchPosts();
              },
            );
          },
        );
      },
    );
  }

  Widget _buildCriteriaButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Material(
          color: hasAnyFilter ? const Color(0xFF9156F1) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: openFilterSheet,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(
                  color: hasAnyFilter ? Colors.transparent : Colors.black12,
                ),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.tune_rounded,
                    color: hasAnyFilter ? Colors.white : const Color(0xFF9156F1),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      hasAnyFilter
                          ? 'Đang lọc: $filterCount tiêu chí'
                          : 'Chọn tiêu chí lọc',
                      style: TextStyle(
                        color: hasAnyFilter ? Colors.white : const Color(0xFF1F2937),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  if (hasAnyFilter)
                    GestureDetector(
                      onTap: clearFilter,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Text(
                          'Xóa',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    )
                  else
                    const Icon(
                      Icons.keyboard_arrow_right_rounded,
                      color: Color(0xFF9156F1),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTitleRow() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: [
          const Text(
            'Tất cả sân',
            style: TextStyle(
              color: Color(0xFF1F2937),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          Text(
            '$totalElements sân phù hợp',
            style: const TextStyle(
              color: Color(0xFF9156F1),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  void goPreviousPage() {
    if (page <= 1) return;
    setState(() => page--);
    fetchPosts();
  }

  void goNextPage() {
    if (page >= totalPages) return;
    setState(() => page++);
    fetchPosts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: SafeArea(
        child: Column(
          children: [
            const AreaHeader(),

            AreaSearchBox(
              controller: searchController,
              onSearch: () {
                page = 1;
                fetchPosts();
              },
            ),

            _buildCriteriaButton(),

            _buildTitleRow(),

            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : error != null
                  ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Colors.redAccent),
                    textAlign: TextAlign.center,
                  ),
                ),
              )
                  : posts.isEmpty
                  ? const Center(
                child: Text(
                  'Không tìm thấy sân nào phù hợp',
                  style: TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
                  : RefreshIndicator(
                onRefresh: fetchPosts,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(
                    16,
                    0,
                    16,
                    90,
                  ),
                  itemCount: posts.length + 1,
                  itemBuilder: (context, index) {
                    if (index == posts.length) {
                      return AreaPagination(
                        page: page,
                        totalPages: totalPages,
                        onPrevious:
                        page > 1 ? goPreviousPage : null,
                        onNext: page < totalPages ? goNextPage : null,
                      );
                    }

                    final post = posts[index];

                    return AreaCard(
                      post: post,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RentalAreaDetailScreen(

                              rentalAreaId: post.rentalAreaId ?? '',
                            ),
                          ),
                        );
                      },
                      onBookTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RentalAreaDetailScreen(
                              rentalAreaId: post.rentalAreaId ?? '',
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}