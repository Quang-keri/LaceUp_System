import 'package:flutter/material.dart';

import 'multi_select_wrap.dart';

typedef AreaFilterApply =
    void Function({
      required int newMinPrice,
      required int newMaxPrice,
      required int newMinRating,
      required String? newSortBy,
      required List<int> newProvinceCodes,
      required List<int> newCategoryIds,
      required List<int> newAmenityIds,
    });

class AreaFilterBottomSheet extends StatefulWidget {
  final ScrollController scrollController;

  final int minPrice;
  final int maxPrice;
  final int minRating;
  final String? sortBy;

  final List<int> provinceCodes;
  final List<int> categoryIds;
  final List<int> amenityIds;

  final List<dynamic> provinces;
  final List<dynamic> categories;
  final List<dynamic> amenities;

  final AreaFilterApply onApply;

  const AreaFilterBottomSheet({
    super.key,
    required this.scrollController,
    required this.minPrice,
    required this.maxPrice,
    required this.minRating,
    required this.sortBy,
    required this.provinceCodes,
    required this.categoryIds,
    required this.amenityIds,
    required this.provinces,
    required this.categories,
    required this.amenities,
    required this.onApply,
  });

  @override
  State<AreaFilterBottomSheet> createState() => _AreaFilterBottomSheetState();
}

class _AreaFilterBottomSheetState extends State<AreaFilterBottomSheet> {
  late int tempMinPrice;
  late int tempMaxPrice;
  late int tempMinRating;
  late String? tempSortBy;

  late List<int> tempProvinceCodes;
  late List<int> tempCategoryIds;
  late List<int> tempAmenityIds;

  @override
  void initState() {
    super.initState();

    tempMinPrice = widget.minPrice;
    tempMaxPrice = widget.maxPrice;
    tempMinRating = widget.minRating;
    tempSortBy = widget.sortBy;

    tempProvinceCodes = List<int>.from(widget.provinceCodes);
    tempCategoryIds = List<int>.from(widget.categoryIds);
    tempAmenityIds = List<int>.from(widget.amenityIds);
  }

  int get tempFilterCount {
    int count = 0;
    if (tempSortBy != null) count++;
    if (tempMinRating > 0) count++;
    if (tempMinPrice > 0 || tempMaxPrice < 500000) count++;
    if (tempProvinceCodes.isNotEmpty) count++;
    if (tempCategoryIds.isNotEmpty) count++;
    if (tempAmenityIds.isNotEmpty) count++;
    return count;
  }

  void clearTempFilter() {
    setState(() {
      tempMinPrice = 0;
      tempMaxPrice = 500000;
      tempMinRating = 0;
      tempSortBy = null;
      tempProvinceCodes.clear();
      tempCategoryIds.clear();
      tempAmenityIds.clear();
    });
  }

  void apply() {
    Navigator.pop(context);

    widget.onApply(
      newMinPrice: tempMinPrice,
      newMaxPrice: tempMaxPrice,
      newMinRating: tempMinRating,
      newSortBy: tempSortBy,
      newProvinceCodes: List<int>.from(tempProvinceCodes),
      newCategoryIds: List<int>.from(tempCategoryIds),
      newAmenityIds: List<int>.from(tempAmenityIds),
    );
  }

  Widget _buildProvinceSelectOption() {
    String getSelectedNames() {
      if (tempProvinceCodes.isEmpty) return 'Tất cả khu vực';

      final selectedNames = widget.provinces
          .where((p) => tempProvinceCodes.contains(p.code))
          .map((p) => p.name)
          .join(', ');
      return selectedNames;
    }

    return InkWell(
      onTap: () {
        // Mở Dialog khi bấm vào
        showDialog(
          context: context,
          builder: (BuildContext context) {
            // Dùng StatefulBuilder để Dialog có thể tự cập nhật UI khi tích Checkbox
            return StatefulBuilder(
              builder: (context, setStateDialog) {
                return AlertDialog(
                  title: const Text(
                    'Chọn Khu vực',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                  contentPadding: const EdgeInsets.only(top: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  content: SizedBox(
                    width: double.maxFinite,
                    height:
                        MediaQuery.of(context).size.height *
                        0.5, // Chiều cao tối đa = 50% màn hình
                    child: ListView.builder(
                      itemCount: widget.provinces.length,
                      itemBuilder: (context, index) {
                        final province = widget.provinces[index];
                        final isSelected = tempProvinceCodes.contains(
                          province.code,
                        );

                        return CheckboxListTile(
                          title: Text(
                            province.name,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          value: isSelected,
                          activeColor: const Color(0xFF9156F1),
                          controlAffinity: ListTileControlAffinity.leading,
                          // Checkbox nằm bên trái
                          onChanged: (bool? value) {
                            setStateDialog(() {
                              // Cập nhật lại list trong Dialog
                              if (value == true) {
                                tempProvinceCodes.add(province.code);
                              } else {
                                tempProvinceCodes.remove(province.code);
                              }
                            });
                            setState(
                              () {},
                            ); // Cập nhật lại UI hiển thị bên ngoài BottomSheet
                          },
                        );
                      },
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'Xong',
                        style: TextStyle(
                          color: Color(0xFF9156F1),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.black12.withOpacity(0.06)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                getSelectedNames(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: tempProvinceCodes.isEmpty
                      ? Colors.black54
                      : const Color(0xFF1F2937),
                  fontWeight: tempProvinceCodes.isEmpty
                      ? FontWeight.w500
                      : FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: Colors.black54,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF8F9FF),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          _header(),

          Expanded(
            child: ListView(
              controller: widget.scrollController,
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              children: [
                _sectionTitle('Sắp xếp'),
                _sortChips(),

                const SizedBox(height: 22),

                _sectionTitle('Khoảng giá / giờ'),
                _priceCard(),

                const SizedBox(height: 22),

                _sectionTitle('Đánh giá'),
                _ratingChips(),

                const SizedBox(height: 22),

                _sectionTitle('Khu vực'),
                _buildProvinceSelectOption(),

                const SizedBox(height: 22),

                _sectionTitle('Loại sân'),
                _whiteCard(
                  child: MultiSelectWrap(
                    items: widget.categories,
                    selectedIds: tempCategoryIds,
                    getId: (item) => item.categoryId,
                    getName: (item) => item.categoryName,
                    onChanged: () => setState(() {}),
                  ),
                ),

                const SizedBox(height: 22),

                _sectionTitle('Tiện nghi'),
                _whiteCard(
                  child: MultiSelectWrap(
                    items: widget.amenities,
                    selectedIds: tempAmenityIds,
                    getId: (item) => item.amenityId,
                    getName: (item) => item.amenityName,
                    onChanged: () => setState(() {}),
                  ),
                ),
              ],
            ),
          ),

          _bottomBar(),
        ],
      ),
    );
  }

  Widget _header() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          Container(
            width: 42,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.black12,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Chọn tiêu chí lọc',
                  style: TextStyle(
                    color: Color(0xFF1F2937),
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              tempFilterCount == 0
                  ? 'Chọn điều kiện để tìm sân phù hợp hơn'
                  : 'Đã chọn $tempFilterCount tiêu chí',
              style: const TextStyle(
                color: Colors.black54,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sortChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _choiceChip(
          label: 'Mới nhất',
          active: tempSortBy == 'newest',
          onTap: () => setState(() => tempSortBy = 'newest'),
        ),
        _choiceChip(
          label: 'Giá thấp',
          active: tempSortBy == 'price_low',
          onTap: () => setState(() => tempSortBy = 'price_low'),
        ),
        _choiceChip(
          label: 'Giá cao',
          active: tempSortBy == 'price_high',
          onTap: () => setState(() => tempSortBy = 'price_high'),
        ),
      ],
    );
  }

  Widget _priceCard() {
    return _whiteCard(
      child: Column(
        children: [
          Row(
            children: [
              Text(
                '${tempMinPrice ~/ 1000}k',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              const Spacer(),
              Text(
                '${tempMaxPrice ~/ 1000}k',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          RangeSlider(
            min: 0,
            max: 500000,
            divisions: 50,
            values: RangeValues(
              tempMinPrice.toDouble(),
              tempMaxPrice.toDouble(),
            ),
            activeColor: const Color(0xFF9156F1),
            labels: RangeLabels(
              '${tempMinPrice ~/ 1000}k',
              '${tempMaxPrice ~/ 1000}k',
            ),
            onChanged: (value) {
              setState(() {
                tempMinPrice = value.start.round();
                tempMaxPrice = value.end.round();
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _ratingChips() {
    return Wrap(
      spacing: 6,
      runSpacing: 8,
      children: [
        _choiceChip(
          label: 'Tất cả',
          active: tempMinRating == 0,
          onTap: () => setState(() => tempMinRating = 0),
        ),
        ...[1, 2, 3, 4, 5].map((star) {
          String labelText;
          if (star == 5) {
            labelText = '⭐ 5';
          } else {
            labelText = '⭐ $star';
          }

          return _choiceChip(
            label: labelText,
            active: tempMinRating == star,
            onTap: () => setState(() => tempMinRating = star),
          );
        }),
      ],
    );
  }

  Widget _bottomBar() {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 14, 20, 20 + bottomInset),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: clearTempFilter,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF9156F1),
                side: const BorderSide(color: Color(0xFF9156F1)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Xóa lọc',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: apply,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF9156F1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Xem sân phù hợp',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _whiteCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.black12.withOpacity(0.06)),
      ),
      child: child,
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          color: Color(0xFF1F2937),
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _choiceChip({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return ChoiceChip(
      label: Text(label),
      selected: active,
      showCheckmark: false,
      backgroundColor: Colors.white,
      selectedColor: const Color(0xFF9156F1),
      labelStyle: TextStyle(
        color: active ? Colors.white : const Color(0xFF1F2937),
        fontWeight: FontWeight.w800,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(99),
        side: BorderSide(
          color: active ? const Color(0xFF9156F1) : Colors.black12,
        ),
      ),
      onSelected: (_) => onTap(),
    );
  }
}
