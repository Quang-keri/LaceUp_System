import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../models/review.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/review_service.dart';

class CourtReviewTab extends StatefulWidget {
  final String rentalAreaId;
  final VoidCallback? onNavigateToBooking;

  const CourtReviewTab({
    super.key,
    required this.rentalAreaId,
    this.onNavigateToBooking,
  });

  @override
  State<CourtReviewTab> createState() => _CourtReviewTabState();
}

class _CourtReviewTabState extends State<CourtReviewTab> {
  static const Color primaryColor = Color(0xFF9156F1);
  static const Color accentColor = Color(0xFFFF9800);
  static const int pageSize = 5;

  List<ReviewData> reviews = [];
  ReviewData? myReview;

  bool loading = true;
  bool loadingUserData = false;
  bool isEligible = false;

  int currentPage = 1;
  int totalElements = 0;

  String? errorMessage;
  bool? _lastLoginState;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final authProvider = context.watch<AuthProvider>();
    final bool isLoggedIn = authProvider.isLoggedIn;

    if (_lastLoginState != isLoggedIn) {
      _lastLoginState = isLoggedIn;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _loadUserData(isLoggedIn);
        }
      });
    }
  }

  List<ReviewData> get combinedReviews {
    final mine = myReview;

    if (mine == null) {
      return reviews;
    }

    final otherReviews = reviews.where((review) {
      if (mine.reviewId == null || review.reviewId == null) {
        return true;
      }

      return review.reviewId != mine.reviewId;
    }).toList();

    return [mine, ...otherReviews];
  }

  int get totalPages {
    if (totalElements <= 0) {
      return 1;
    }

    return (totalElements / pageSize).ceil();
  }

  Future<void> _loadReviews() async {
    if (mounted) {
      setState(() {
        loading = true;
        errorMessage = null;
      });
    }

    try {
      final result = await reviewService.getReviewsByRentalArea(
        widget.rentalAreaId,
        page: currentPage - 1,
        size: pageSize,
      );

      if (!mounted) return;

      setState(() {
        reviews = result.data;
        totalElements = result.totalElements;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        errorMessage = _cleanError(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  Future<void> _loadUserData(bool isLoggedIn) async {
    if (!isLoggedIn) {
      if (!mounted) return;

      setState(() {
        isEligible = false;
        myReview = null;
        loadingUserData = false;
      });

      return;
    }

    setState(() {
      loadingUserData = true;
    });

    bool eligible = false;
    ReviewData? mine;

    try {
      // Dùng API thật để check từ backend
      eligible = await reviewService.checkEligibility(widget.rentalAreaId);

      if (eligible) {
        mine = await reviewService.getMyReview(widget.rentalAreaId);
      }
    } catch (error) {
      debugPrint('Lỗi tải thông tin review cá nhân: $error');
    }

    if (!mounted) return;

    setState(() {
      isEligible = eligible;
      myReview = mine;
      loadingUserData = false;
    });
  }

  Future<void> _changePage(int page) async {
    if (page < 1 || page > totalPages || page == currentPage) {
      return;
    }

    setState(() {
      currentPage = page;
    });

    await _loadReviews();
  }

  Future<void> _openReviewModal() async {
    final bool isEditing = myReview != null;

    int selectedRating = myReview?.rating ?? 0;

    final commentController = TextEditingController(
      text: myReview?.comment ?? '',
    );

    final formKey = GlobalKey<FormState>();

    final bool? saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) {
        bool submitting = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 18,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  child: Form(
                    key: formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: Container(
                            width: 44,
                            height: 5,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          isEditing
                              ? 'Chỉnh sửa đánh giá'
                              : 'Đánh giá sân thể thao',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'Bạn thấy chất lượng sân thế nào?',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 10),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(5, (index) {
                            final starValue = index + 1;
                            final selected = starValue <= selectedRating;

                            return IconButton(
                              tooltip: '$starValue sao',
                              onPressed: submitting
                                  ? null
                                  : () {
                                      setModalState(() {
                                        selectedRating = starValue;
                                      });
                                    },
                              iconSize: 38,
                              visualDensity: VisualDensity.compact,
                              icon: Icon(
                                selected
                                    ? Icons.star_rounded
                                    : Icons.star_border_rounded,
                                color: selected
                                    ? accentColor
                                    : Colors.grey.shade400,
                              ),
                            );
                          }),
                        ),

                        if (selectedRating == 0)
                          const Center(
                            child: Text(
                              'Vui lòng chọn số sao',
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ),

                        const SizedBox(height: 20),
                        const Text(
                          'Nhận xét chi tiết',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 10),

                        TextFormField(
                          controller: commentController,
                          enabled: !submitting,
                          minLines: 4,
                          maxLines: 6,
                          maxLength: 1000,
                          decoration: InputDecoration(
                            hintText:
                                'Sân đẹp, đèn sáng, chủ sân nhiệt tình...',
                            filled: true,
                            fillColor: const Color(0xFFF9FAFB),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: Colors.grey.shade300,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: Colors.grey.shade300,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: primaryColor,
                                width: 1.5,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Vui lòng nhập nhận xét';
                            }

                            return null;
                          },
                        ),

                        const SizedBox(height: 18),

                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: submitting
                                ? null
                                : () async {
                                    final valid =
                                        formKey.currentState?.validate() ??
                                        false;

                                    if (!valid || selectedRating == 0) {
                                      setModalState(() {});
                                      return;
                                    }

                                    setModalState(() {
                                      submitting = true;
                                    });

                                    try {
                                      await reviewService.submitReview(
                                        rentalAreaId: widget.rentalAreaId,
                                        rating: selectedRating,
                                        comment: commentController.text,
                                      );

                                      if (!bottomSheetContext.mounted) {
                                        return;
                                      }

                                      Navigator.of(
                                        bottomSheetContext,
                                      ).pop(true);
                                    } catch (error) {
                                      if (!bottomSheetContext.mounted) {
                                        return;
                                      }

                                      setModalState(() {
                                        submitting = false;
                                      });

                                      ScaffoldMessenger.of(
                                        this.context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(_cleanError(error)),
                                          backgroundColor: Colors.red,
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryColor,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: primaryColor.withOpacity(
                                0.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: submitting
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    isEditing
                                        ? 'Cập nhật đánh giá'
                                        : 'Gửi đánh giá ngay',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    commentController.dispose();

    if (saved != true || !mounted) {
      return;
    }

    _showMessage(
      isEditing ? 'Cập nhật đánh giá thành công!' : 'Gửi đánh giá thành công!',
    );

    await _loadReviews();

    if (!mounted) return;

    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;

    await _loadUserData(isLoggedIn);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 20),

          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 70),
              child: Center(
                child: CircularProgressIndicator(color: primaryColor),
              ),
            )
          else if (errorMessage != null)
            _buildError()
          else if (combinedReviews.isEmpty)
            _buildEmpty()
          else ...[
            ...combinedReviews.map(_buildReviewItem),
            if (totalPages > 1) ...[
              const SizedBox(height: 12),
              _buildPagination(),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final bool showReviewButton = myReview == null && !loadingUserData;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 5,
          height: 24,
          decoration: BoxDecoration(
            color: primaryColor,
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(
          child: Text(
            'Đánh giá từ khách hàng',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
        ),
        if (showReviewButton)
          ElevatedButton.icon(
            onPressed: () {
              if (isEligible) {
                _openReviewModal();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Vui lòng đặt lịch và trải nghiệm sân để đánh giá!',
                    ),
                    backgroundColor: accentColor,
                    behavior: SnackBarBehavior.floating,
                  ),
                );

                widget.onNavigateToBooking?.call();
              }
            },
            icon: const Icon(Icons.edit_outlined, size: 17),
            label: const Text('Viết đánh giá'),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildReviewItem(ReviewData review) {
    final bool isMine =
        myReview != null &&
        review.reviewId != null &&
        review.reviewId == myReview!.reviewId;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isMine ? const Color(0xFFFAF5FF) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isMine ? const Color(0xFFE9D5FF) : const Color(0xFFF0F0F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.025),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: isMine ? primaryColor : Colors.grey.shade300,
            child: const Icon(Icons.person_outline, color: Colors.white),
          ),
          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Flexible(
                      child: Wrap(
                        spacing: 7,
                        runSpacing: 5,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            review.userName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          if (isMine)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: primaryColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'BẠN',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDate(review.createdAt),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade500,
                      ),
                    ),
                    if (isMine)
                      PopupMenuButton<String>(
                        padding: EdgeInsets.zero,
                        iconSize: 21,
                        tooltip: 'Tùy chọn',
                        onSelected: (value) {
                          if (value == 'edit') {
                            _openReviewModal();
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit_outlined, size: 19),
                                SizedBox(width: 9),
                                Text('Sửa đánh giá'),
                              ],
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 5),
                _buildStars(review.rating),
                const SizedBox(height: 7),
                Text(
                  review.comment,
                  style: const TextStyle(
                    color: Color(0xFF5F6368),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStars(int rating) {
    return Row(
      children: List.generate(5, (index) {
        final bool selected = index < rating;

        return Icon(
          selected ? Icons.star_rounded : Icons.star_border_rounded,
          size: 19,
          color: selected ? accentColor : Colors.grey.shade300,
        );
      }),
    );
  }

  Widget _buildPagination() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          tooltip: 'Trang trước',
          onPressed: currentPage > 1
              ? () => _changePage(currentPage - 1)
              : null,
          icon: const Icon(Icons.chevron_left_rounded),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF3E8FF),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '$currentPage / $totalPages',
            style: const TextStyle(
              color: primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        IconButton(
          tooltip: 'Trang sau',
          onPressed: currentPage < totalPages
              ? () => _changePage(currentPage + 1)
              : null,
          icon: const Icon(Icons.chevron_right_rounded),
        ),
      ],
    );
  }

  Widget _buildEmpty() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.rate_review_outlined,
              size: 52,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 12),
            const Text(
              'Chưa có đánh giá nào cho sân này.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 50),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.error_outline, size: 45, color: Colors.redAccent),
            const SizedBox(height: 10),
            Text(
              errorMessage ?? 'Không thể tải đánh giá.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _loadReviews,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) {
      return '';
    }

    return DateFormat('dd/MM/yyyy').format(date.toLocal());
  }

  String _cleanError(dynamic error) {
    return error.toString().replaceFirst('Exception: ', '').trim();
  }

  void _showMessage(String message) {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();

    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
