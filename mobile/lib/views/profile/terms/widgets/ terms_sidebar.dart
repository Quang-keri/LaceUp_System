import 'package:flutter/material.dart';


import '../../../../theme/app_colors.dart';
import '../../../../models/terms_section.dart';

class TermsSidebar extends StatelessWidget {
  final List<TermsSection> sections;
  final int selectedIndex;
  final ValueChanged<int> onTap;

  const TermsSidebar({
    super.key,
    required this.sections,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      decoration: const BoxDecoration(
        color: AppColors.card,
        border: Border(
          right: BorderSide(color: AppColors.border),
        ),
      ),
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 20),
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              'MỤC LỤC',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 20),

          ...List.generate(sections.length, (index) {
            final active = selectedIndex == index;

            return InkWell(
              onTap: () => onTap(index),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 14,
                ),
                color: active ? AppColors.primaryLight : AppColors.card,
                child: Row(
                  children: [
                    Container(
                      width: 9,
                      height: 9,
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.primary
                            : Colors.grey.shade400,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        sections[index].title,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight:
                          active ? FontWeight.w800 : FontWeight.w600,
                          color: active
                              ? AppColors.primary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}