import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import 'data/terms_policy_data.dart';
import 'widgets/terms_content.dart';
import 'widgets/terms_sidebar.dart';

class TermsPolicyScreen extends StatefulWidget {
  const TermsPolicyScreen({super.key});

  @override
  State<TermsPolicyScreen> createState() => _TermsPolicyScreenState();
}

class _TermsPolicyScreenState extends State<TermsPolicyScreen> {
  static const double _desktopBreakpoint = 900;

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final ScrollController _scrollController = ScrollController();

  late final List<TermsPolicyItem> _allItems;
  late final Map<String, GlobalKey> _sectionKeys;

  late String _selectedItemId;
  bool _showBackToTop = false;

  @override
  void initState() {
    super.initState();

    _allItems = termsPolicyGroups
        .expand((group) => group.items)
        .toList(growable: false);

    _sectionKeys = {
      for (final item in _allItems) item.id: GlobalKey(),
    };

    _selectedItemId = _allItems.first.id;

    _scrollController.addListener(_handleScroll);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateActiveSection();
    });
  }

  void _handleScroll() {
    final shouldShowBackToTop =
        _scrollController.hasClients && _scrollController.offset > 420;

    if (shouldShowBackToTop != _showBackToTop && mounted) {
      setState(() {
        _showBackToTop = shouldShowBackToTop;
      });
    }

    _updateActiveSection();
  }

  void _updateActiveSection() {
    if (!mounted || _allItems.isEmpty) {
      return;
    }

    String activeId = _allItems.first.id;
    const activeLine = 210.0;

    for (final item in _allItems) {
      final context = _sectionKeys[item.id]?.currentContext;

      if (context == null) {
        continue;
      }

      final renderObject = context.findRenderObject();

      if (renderObject is! RenderBox || !renderObject.attached) {
        continue;
      }

      final top = renderObject.localToGlobal(Offset.zero).dy;

      if (top <= activeLine) {
        activeId = item.id;
      }
    }

    if (_scrollController.hasClients &&
        _scrollController.position.extentAfter < 40) {
      activeId = _allItems.last.id;
    }

    if (activeId != _selectedItemId) {
      setState(() {
        _selectedItemId = activeId;
      });
    }
  }

  Future<void> _scrollToSection(String itemId) async {
    final sectionContext = _sectionKeys[itemId]?.currentContext;

    if (sectionContext == null) {
      return;
    }

    if (mounted) {
      setState(() {
        _selectedItemId = itemId;
      });
    }

    await Scrollable.ensureVisible(
      sectionContext,
      alignment: 0.04,
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeInOutCubic,
    );
  }

  void _onDrawerItemTap(String itemId) {
    Navigator.of(context).pop();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToSection(itemId);
    });
  }

  Future<void> _scrollToTop() async {
    if (!_scrollController.hasClients) {
      return;
    }

    await _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeInOutCubic,
    );

    if (mounted) {
      setState(() {
        _selectedItemId = _allItems.first.id;
      });
    }
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= _desktopBreakpoint;

        return Scaffold(
          key: _scaffoldKey,
          backgroundColor: AppColors.background,
          drawer: isDesktop
              ? null
              : Drawer(
                  width: MediaQuery.sizeOf(context).width * 0.88,
                  backgroundColor: Colors.white,
                  child: SafeArea(
                    child: TermsSidebar(
                      groups: termsPolicyGroups,
                      selectedItemId: _selectedItemId,
                      onTap: _onDrawerItemTap,
                    ),
                  ),
                ),
          appBar: AppBar(
            toolbarHeight: 88,
            automaticallyImplyLeading: false,
            backgroundColor: AppColors.card,
            surfaceTintColor: AppColors.card,
            elevation: 0,
            leadingWidth: 58,
            leading: IconButton(
              tooltip: 'Quay lại',
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(
                Icons.arrow_back_rounded,
                color: AppColors.primary,
              ),
            ),
            centerTitle: true,
            titleSpacing: 0,
            title: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'ĐIỀU KHOẢN SỬ DỤNG',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.45,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Cập nhật lần cuối 06/06/2026',
                  style: TextStyle(
                    color: Color(0xFF888891),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
            actions: [
              if (!isDesktop)
                IconButton(
                  tooltip: 'Mở mục lục',
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  icon: const Icon(
                    Icons.menu_rounded,
                    color: AppColors.primary,
                  ),
                ),
              const SizedBox(width: 6),
            ],
            bottom: const PreferredSize(
              preferredSize: Size.fromHeight(1),
              child: Divider(
                height: 1,
                thickness: 1,
                color: Color(0xFFECECF1),
              ),
            ),
          ),
          body: isDesktop
              ? Row(
                  children: [
                    SizedBox(
                      width: 370,
                      child: TermsSidebar(
                        groups: termsPolicyGroups,
                        selectedItemId: _selectedItemId,
                        onTap: _scrollToSection,
                      ),
                    ),
                    const VerticalDivider(
                      width: 1,
                      thickness: 1,
                      color: Color(0xFFECECF1),
                    ),
                    Expanded(
                      child: TermsContent(
                        groups: termsPolicyGroups,
                        controller: _scrollController,
                        sectionKeys: _sectionKeys,
                        compact: false,
                      ),
                    ),
                  ],
                )
              : TermsContent(
                  groups: termsPolicyGroups,
                  controller: _scrollController,
                  sectionKeys: _sectionKeys,
                  compact: true,
                ),
          floatingActionButton: IgnorePointer(
            ignoring: !_showBackToTop,
            child: AnimatedScale(
              scale: _showBackToTop ? 1 : 0,
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOut,
              child: AnimatedOpacity(
                opacity: _showBackToTop ? 1 : 0,
                duration: const Duration(milliseconds: 180),
                child: FloatingActionButton.small(
                  heroTag: 'termsPolicyBackToTop',
                  tooltip: 'Lên đầu trang',
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 5,
                  onPressed: _scrollToTop,
                  child: const Icon(
                    Icons.keyboard_arrow_up_rounded,
                    size: 30,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
