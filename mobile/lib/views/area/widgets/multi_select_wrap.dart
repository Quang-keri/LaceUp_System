import 'package:flutter/material.dart';

class MultiSelectWrap extends StatelessWidget {
  final List<dynamic> items;
  final List<int> selectedIds;
  final dynamic Function(dynamic item) getId;
  final String Function(dynamic item) getName;
  final VoidCallback onChanged;

  const MultiSelectWrap({
    super.key,
    required this.items,
    required this.selectedIds,
    required this.getId,
    required this.getName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Text(
        'Đang cập nhật dữ liệu...',
        style: TextStyle(color: Colors.black45),
      );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items.map((item) {
        final id = int.tryParse(getId(item).toString()) ?? 0;
        final name = getName(item).toString();
        final selected = selectedIds.contains(id);

        return FilterChip(
          label: Text(name),
          selected: selected,
          selectedColor: const Color(0xFF9156F1).withOpacity(0.16),
          checkmarkColor: const Color(0xFF9156F1),
          labelStyle: TextStyle(
            color: selected ? const Color(0xFF9156F1) : Colors.black87,
            fontWeight: FontWeight.w600,
          ),
          onSelected: (value) {
            if (value) {
              if (!selectedIds.contains(id)) {
                selectedIds.add(id);
              }
            } else {
              selectedIds.remove(id);
            }

            onChanged();
          },
        );
      }).toList(),
    );
  }
}