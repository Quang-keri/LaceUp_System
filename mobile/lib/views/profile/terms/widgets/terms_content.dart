import 'package:flutter/material.dart';

import '../data/terms_policy_data.dart';

class TermsContent extends StatelessWidget {
  final List<TermsPolicyGroup> groups;
  final ScrollController controller;
  final Map<String, GlobalKey> sectionKeys;
  final bool compact;

  const TermsContent({
    super.key,
    required this.groups,
    required this.controller,
    required this.sectionKeys,
    required this.compact,
  });

  static const Color _primary = Color(0xFF9156F1);
  static const Color _textPrimary = Color(0xFF202027);
  static const Color _textBody = Color(0xFF414149);
  static const Color _border = Color(0xFFECECF1);

  @override
  Widget build(BuildContext context) {
    final horizontalPadding = compact ? 20.0 : 46.0;

    return ColoredBox(
      color: Colors.white,
      child: Scrollbar(
        controller: controller,
        thumbVisibility: !compact,
        child: SingleChildScrollView(
          controller: controller,
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            compact ? 28 : 38,
            horizontalPadding,
            120,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1060),
              child: SelectionArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildIntroCard(),
                    const SizedBox(height: 38),
                    for (final group in groups) _buildGroup(group),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIntroCard() {
    return Container(
      padding: EdgeInsets.all(compact ? 18 : 22),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _primary.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.gavel_rounded,
              color: _primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Điều khoản sử dụng LaceUp',
                  style: TextStyle(
                    color: _textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 7),
                Text(
                  'Vui lòng đọc kỹ các nội dung dưới đây trước khi sử dụng '
                  'dịch vụ đặt sân và tham gia hoạt động thể thao trên LaceUp.',
                  style: TextStyle(
                    color: _textBody,
                    fontSize: 14,
                    height: 1.55,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroup(TermsPolicyGroup group) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 58),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            group.title,
            style: TextStyle(
              color: _primary,
              fontSize: compact ? 20 : 24,
              height: 1.4,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.35,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: 54,
            height: 4,
            decoration: BoxDecoration(
              color: _primary,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(height: 28),
          for (final item in group.items) _buildItem(item),
        ],
      ),
    );
  }

  Widget _buildItem(TermsPolicyItem item) {
    return Container(
      key: sectionKeys[item.id],
      margin: const EdgeInsets.only(bottom: 42),
      padding: EdgeInsets.all(compact ? 18 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.title,
            style: TextStyle(
              color: _textPrimary,
              fontSize: compact ? 18 : 21,
              height: 1.45,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 18),
          for (final block in item.content) _buildBlock(block),
        ],
      ),
    );
  }

  Widget _buildBlock(TermsContentBlock block) {
    switch (block.type) {
      case TermsContentType.paragraph:
        return Padding(
          padding: const EdgeInsets.only(bottom: 15),
          child: SelectableText(
            block.text ?? '',
            style: TextStyle(
              color: _textBody,
              fontSize: compact ? 14.5 : 16,
              height: 1.75,
            ),
          ),
        );

      case TermsContentType.bullets:
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            children: [
              for (final item in block.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        margin: const EdgeInsets.only(top: 9),
                        decoration: const BoxDecoration(
                          color: _primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 13),
                      Expanded(
                        child: SelectableText(
                          item,
                          style: TextStyle(
                            color: _textBody,
                            fontSize: compact ? 14.5 : 16,
                            height: 1.72,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
    }
  }
}
