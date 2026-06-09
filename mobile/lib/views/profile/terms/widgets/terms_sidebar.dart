import 'package:flutter/material.dart';

import '../data/terms_policy_data.dart';

class TermsSidebar extends StatelessWidget {
  final List<TermsPolicyGroup> groups;
  final String selectedItemId;
  final ValueChanged<String> onTap;
  final EdgeInsetsGeometry padding;

  const TermsSidebar({
    super.key,
    required this.groups,
    required this.selectedItemId,
    required this.onTap,
    this.padding = const EdgeInsets.only(bottom: 32),
  });

  static const Color _primary = Color(0xFF9156F1);
  static const Color _primaryDark = Color(0xFF7437D6);
  static const Color _primarySoft = Color(0xFFF3EDFF);
  static const Color _secondaryText = Color(0xFF55555F);
  static const Color _border = Color(0xFFECECF1);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: ListView(
        padding: padding,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(28, 28, 24, 20),
            child: Text(
              'MỤC LỤC',
              style: TextStyle(
                color: _primary,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.4,
              ),
            ),
          ),
          for (final group in groups) _buildGroup(group),
        ],
      ),
    );
  }

  Widget _buildGroup(TermsPolicyGroup group) {
    final bool isActiveGroup = group.items.any(
      (item) => item.id == selectedItemId,
    );

    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: _border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: group.items.isEmpty ? null : () => onTap(group.items.first.id),
            child: Container(
              constraints: const BoxConstraints(minHeight: 60),
              padding: const EdgeInsets.symmetric(
                horizontal: 26,
                vertical: 16,
              ),
              color: isActiveGroup ? _primarySoft : Colors.white,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      color: _primary,
                      shape: BoxShape.circle,
                    ),
                    child: SizedBox(width: 10, height: 10),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      group.title,
                      style: TextStyle(
                        color: isActiveGroup
                            ? _primaryDark
                            : const Color(0xFF17171C),
                        fontSize: 14,
                        height: 1.45,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.15,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          for (final item in group.items) _buildItem(item),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildItem(TermsPolicyItem item) {
    final bool isActive = item.id == selectedItemId;

    return InkWell(
      onTap: () => onTap(item.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        constraints: const BoxConstraints(minHeight: 50),
        padding: const EdgeInsets.fromLTRB(46, 11, 24, 11),
        color: isActive
            ? _primary.withValues(alpha: 0.08)
            : Colors.transparent,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 5,
              height: 5,
              margin: const EdgeInsets.only(top: 9),
              decoration: BoxDecoration(
                color: isActive ? _primary : const Color(0xFFC6C6CB),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                item.title,
                style: TextStyle(
                  color: isActive ? _primaryDark : _secondaryText,
                  fontSize: 15,
                  height: 1.5,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
