import 'package:flutter/material.dart';

class AreaFilterBar extends StatelessWidget {
  final String? sortBy;
  final bool isDefaultFilter;
  final bool hasActiveFilter;
  final VoidCallback onClear;
  final VoidCallback onFilterTap;
  final ValueChanged<String?> onSortChanged;

  const AreaFilterBar({
    super.key,
    required this.sortBy,
    required this.isDefaultFilter,
    required this.hasActiveFilter,
    required this.onClear,
    required this.onFilterTap,
    required this.onSortChanged,
  });

  @override
  Widget build(BuildContext context) {

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _FilterChipButton(
            label: 'Bộ lọc',
            active: hasActiveFilter,
            onTap: onFilterTap,
          ),

          const SizedBox(width: 8),

          if (!isDefaultFilter)
            ActionChip(
              label: const Text('Xóa lọc'),
              onPressed: onClear,
              backgroundColor: Colors.red.shade50,
              labelStyle: const TextStyle(color: Colors.red),
            ),

          const Spacer(),

          DropdownButton<String>(
            value: sortBy,
            hint: const Text('Sắp xếp'),
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: 'price_asc', child: Text('Giá tăng dần')),
              DropdownMenuItem(value: 'price_desc', child: Text('Giá giảm dần')),
            ],
            onChanged: onSortChanged,
          ),
        ],
      ),
    );
  }
}

class _FilterChipButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChipButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF9156F1) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: active ? const Color(0xFF9156F1) : Colors.black12,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.white : Colors.black87,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}