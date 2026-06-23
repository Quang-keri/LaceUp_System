import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../../../models/match.dart';
import '../../../models/user.dart';
import '../../../services/match_service.dart';

class ReportDialog extends StatefulWidget {
  final String matchId;
  final List<UserResponse> allPlayers;

  const ReportDialog({
    Key? key,
    required this.matchId,
    required this.allPlayers,
  }) : super(key: key);

  @override
  State<ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<ReportDialog> {
  String reasonType = 'ABSENT';
  List<String> reportedUserIds = [];
  TextEditingController descController = TextEditingController();
  bool isLoading = false;

  String? _errorMessage;

  Future<void> _handleSubmit() async {
    setState(() => _errorMessage = null);

    if (reportedUserIds.isEmpty) {
      setState(() => _errorMessage = "Vui lòng chọn người vi phạm / vắng mặt!");
      return;
    }

    if (descController.text.trim().isEmpty) {
      setState(() => _errorMessage = "Vui lòng nhập mô tả chi tiết!");
      return;
    }

    setState(() => isLoading = true);
    try {
      final req = ReportRequest(
        matchId: widget.matchId,
        reportedUserIds: reportedUserIds,
        reasonType: reasonType,
        description: descController.text.trim(),
        evidenceImages: [],
      );
      await matchService.reportViolation(req);

      if (!mounted) return;

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Đã gửi báo cáo thành công!"),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      String parsedError = "Đã xảy ra lỗi không xác định!";

      if (e is DioException) {
        if (e.response != null && e.response?.data != null) {
          final data = e.response!.data;
          if (data is Map<String, dynamic> && data['message'] != null) {
            parsedError = data['message'];
          } else {
            parsedError = "Lỗi từ máy chủ: ${e.response?.statusCode}";
          }
        } else {
          parsedError = e.message ?? "Lỗi kết nối mạng";
        }
      } else {
        parsedError = e.toString().replaceAll('Exception: ', '').trim();
      }

      setState(() {
        _errorMessage = parsedError;
      });
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      backgroundColor: Colors.white,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: Icon(
                    Icons.flag_rounded,
                    color: Colors.red.shade500,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    "Báo cáo vi phạm",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade100),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 18,
                    color: Colors.red.shade400,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      "Hành vi gian lận, phá hoại hoặc vắng mặt sẽ bị xử lý nghiêm. Trận đấu vẫn diễn ra bình thường.",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.black87,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              "LOẠI VI PHẠM",
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: reasonType,
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.purple),
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'ABSENT',
                  child: Text(
                    "Vắng mặt / Bỏ bom (Không đến)",
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                DropdownMenuItem(
                  value: 'BAD_BEHAVIOR',
                  child: Text(
                    "Hành vi tiêu cực / Chửi bới",
                    style: TextStyle(fontSize: 14),
                  ),
                ),
                DropdownMenuItem(
                  value: 'OTHER',
                  child: Text("Lý do khác", style: TextStyle(fontSize: 14)),
                ),
              ],
              onChanged: (val) {
                setState(() {
                  reasonType = val!;
                  reportedUserIds.clear();
                  _errorMessage = null;
                });
              },
            ),
            const SizedBox(height: 20),

            const Text(
              "NGƯỜI BỊ BÁO CÁO *",
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: widget.allPlayers.map((p) {
                bool isSelected = reportedUserIds.contains(p.userId);
                return FilterChip(
                  label: Text(
                    p.userName,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: isSelected ? Colors.red.shade700 : Colors.black87,
                    ),
                  ),
                  selected: isSelected,
                  showCheckmark: false,
                  backgroundColor: Colors.grey.shade100,
                  selectedColor: Colors.red.shade50,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(
                      color: isSelected
                          ? Colors.red.shade300
                          : Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 8,
                  ),
                  onSelected: (bool selected) {
                    setState(() {
                      if (selected) {
                        reportedUserIds.add(p.userId);
                      } else {
                        reportedUserIds.remove(p.userId);
                      }
                      _errorMessage = null;
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            const Text(
              "MÔ TẢ CHI TIẾT *",
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: descController,
              maxLines: 3,
              onChanged: (_) => setState(() => _errorMessage = null),
              decoration: InputDecoration(
                hintText: "Vui lòng mô tả rõ sự việc xảy ra...",
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding: const EdgeInsets.all(16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.purple),
                ),
              ),
            ),

            const SizedBox(height: 24),

            if (_errorMessage != null)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      color: Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "Đóng",
                      style: TextStyle(
                        color: Colors.grey,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Colors.orange, Colors.purple],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.purple.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Text(
                              "Gửi Báo Cáo",
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
