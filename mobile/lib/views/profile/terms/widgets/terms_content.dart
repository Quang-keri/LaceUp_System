import 'package:flutter/material.dart';
import '../../../../models/terms_section.dart';
import 'terms_section_widget.dart';

class TermsContent extends StatelessWidget {
  final List<TermsSection> sections;
  final ScrollController controller;

  const TermsContent({
    super.key,
    required this.sections,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ListView.separated(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: sections.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return TermsSectionWidget(section: sections[index]);
        },
      ),
    );
  }
}