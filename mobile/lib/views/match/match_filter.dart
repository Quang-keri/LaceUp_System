import 'package:flutter/material.dart';
import '../../models/category.dart';
import '../../services/location_service.dart';

class MatchFilter extends StatelessWidget {
  final String sortOrder;
  final ValueChanged<String> setSortOrder;
  final String selectedCategory;
  final ValueChanged<String> setSelectedCategory;
  final String typeFilter;
  final ValueChanged<String> setTypeFilter;
  final String selectedLocation;
  final ValueChanged<String> setSelectedLocation;
  final String selectedWard;
  final ValueChanged<String> setSelectedWard;

  final List<ProvinceResponse> provinces;
  final List<WardResponse> wards;
  final ValueChanged<List<WardResponse>> setWards;
  final VoidCallback resetFilters;

  final List<CategoryResponse> categories;
  final bool isFetchingCategories;

  final Function(String, ProvinceResponse?) onLocationChanged;

  const MatchFilter({
    super.key,
    required this.sortOrder,
    required this.setSortOrder,
    required this.selectedCategory,
    required this.setSelectedCategory,
    required this.typeFilter,
    required this.setTypeFilter,
    required this.selectedLocation,
    required this.setSelectedLocation,
    required this.selectedWard,
    required this.setSelectedWard,
    required this.provinces,
    required this.wards,
    required this.setWards,
    required this.resetFilters,
    required this.categories,
    required this.isFetchingCategories,
    required this.onLocationChanged,
  });

  final Color primaryColor = const Color(0xFF9156F1);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Bộ lọc',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E293B),
                  ),
                ),
                TextButton(
                  onPressed: resetFilters,
                  style: TextButton.styleFrom(
                    foregroundColor: primaryColor,
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(50, 30),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    'Làm mới',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),

            const Divider(height: 30, thickness: 1, color: Color(0xFFF1F5F9)),
            _buildSectionTitle('Sắp xếp'),

            _buildSectionTitle('Sắp xếp'),
            _buildRadioOption('Mới nhất', 'NEWEST', sortOrder, setSortOrder),
            _buildRadioOption(
              'Giá thấp → cao',
              'PRICE_ASC',
              sortOrder,
              setSortOrder,
            ),
            _buildRadioOption(
              'Giá cao → thấp',
              'PRICE_DESC',
              sortOrder,
              setSortOrder,
            ),
            const SizedBox(height: 24),

            _buildSectionTitle('Loại sân'),
            DropdownButtonFormField<String>(
              value: selectedCategory.isEmpty ? null : selectedCategory,
              decoration: _dropdownDecoration('Tất cả loại sân'),
              isExpanded: true,
              icon: isFetchingCategories
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.arrow_drop_down),
              items: categories.map((cat) {
                return DropdownMenuItem(
                  value: cat.categoryName,
                  child: Text(cat.categoryName),
                );
              }).toList(),
              onChanged: (val) => setSelectedCategory(val ?? ''),
            ),
            const SizedBox(height: 24),

            _buildSectionTitle('Thể thức'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildFilterChip('Tất cả', 'ALL', typeFilter, setTypeFilter),
                _buildFilterChip(
                  'Đánh thường',
                  'NORMAL',
                  typeFilter,
                  setTypeFilter,
                ),
                // _buildFilterChip('Đánh kèo', 'BET', typeFilter, setTypeFilter),
                _buildFilterChip(
                  'Đánh Rank',
                  'RANKED',
                  typeFilter,
                  setTypeFilter,
                ),
              ],
            ),
            const SizedBox(height: 24),

            _buildSectionTitle('Tỉnh / Thành phố'),
            DropdownButtonFormField<String>(
              value: selectedLocation.isEmpty ? null : selectedLocation,
              decoration: _dropdownDecoration('Tất cả Tỉnh/Thành'),
              isExpanded: true,
              items: provinces.map((city) {
                return DropdownMenuItem<String>(
                  value: city.name,
                  child: Text(city.name),
                );
              }).toList(),
              onChanged: (val) {
                if (val == null) {
                  setSelectedLocation('');
                  setSelectedWard('');
                  setWards([]);
                  return;
                }
                setSelectedLocation(val);

                final selectedProv = provinces.firstWhere(
                  (p) => p.name == val,
                  orElse: () => ProvinceResponse(code: 0, name: ''),
                );
                onLocationChanged(
                  val,
                  selectedProv.code != 0 ? selectedProv : null,
                );
              },
            ),
            const SizedBox(height: 24),

            _buildSectionTitle('Phường / Xã'),
            DropdownButtonFormField<String>(
              value: selectedWard.isEmpty ? null : selectedWard,
              decoration: _dropdownDecoration(
                selectedLocation.isEmpty
                    ? 'Chọn Tỉnh/Thành trước'
                    : 'Tất cả Phường/Xã',
              ),
              isExpanded: true,
              items: (selectedLocation.isEmpty || wards.isEmpty)
                  ? null
                  : wards.map((ward) {
                      return DropdownMenuItem<String>(
                        value: ward.name,
                        child: Text(ward.name),
                      );
                    }).toList(),
              onChanged: (selectedLocation.isEmpty || wards.isEmpty)
                  ? null
                  : (val) => setSelectedWard(val ?? ''),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Color(0xFF1E293B),
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildRadioOption(
    String label,
    String value,
    String groupValue,
    ValueChanged<String> onChanged,
  ) {
    return InkWell(
      onTap: () => onChanged(value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Radio<String>(
                value: value,
                groupValue: groupValue,
                activeColor: primaryColor,
                onChanged: (val) => onChanged(val!),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    String value,
    String groupValue,
    ValueChanged<String> onChanged,
  ) {
    final isSelected = value == groupValue;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) onChanged(value);
      },
      selectedColor: primaryColor.withOpacity(0.1),
      backgroundColor: Colors.grey.shade100,
      labelStyle: TextStyle(
        color: isSelected ? primaryColor : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 13,
      ),
      side: BorderSide(color: isSelected ? primaryColor : Colors.transparent),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      showCheckmark: false,
    );
  }

  InputDecoration _dropdownDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: primaryColor),
      ),
    );
  }
}
