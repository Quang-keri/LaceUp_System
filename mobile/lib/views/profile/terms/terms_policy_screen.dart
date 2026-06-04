import 'package:flutter/material.dart';



import '../../../theme/app_colors.dart';
import 'data/terms_policy_data.dart';
import 'widgets/ terms_sidebar.dart';
import 'widgets/terms_content.dart';


class TermsPolicyScreen extends StatefulWidget {
  const TermsPolicyScreen({super.key});

  @override
  State<TermsPolicyScreen> createState() => _TermsPolicyScreenState();
}

class _TermsPolicyScreenState extends State<TermsPolicyScreen> {
  final ScrollController _scrollController = ScrollController();

  int selectedIndex = 0;

  void scrollToSection(int index) {
    setState(() {
      selectedIndex = index;
    });

    final offset = index * 520.0;

    _scrollController.animateTo(
      offset,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );

    setState(() {
      selectedIndex = 0;
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        surfaceTintColor: AppColors.card,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: const Text(
          'Điều khoản và Chính sách',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: Stack(
        children: [
          Row(
            children: [
              TermsSidebar(
                sections: termsPolicySections,
                selectedIndex: selectedIndex,
                onTap: scrollToSection,
              ),
              TermsContent(
                sections: termsPolicySections,
                controller: _scrollController,
              ),
            ],
          ),
          Positioned(
            right: 20,
            bottom: 24,
            child: FloatingActionButton(
              backgroundColor: AppColors.primary,
              onPressed: scrollToTop,
              child: const Icon(
                Icons.keyboard_arrow_up,
                color: Colors.white,
                size: 32,
              ),
            ),
          ),
        ],
      ),
    );
  }
}