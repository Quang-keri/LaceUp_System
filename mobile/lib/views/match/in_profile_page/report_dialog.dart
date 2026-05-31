import 'package:flutter/material.dart';

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
  String reasonType = 'BAD_BEHAVIOR';
  List<String> reportedUserIds = [];
  TextEditingController descController = TextEditingController();
  bool isLoading = false;

  Future<void> _handleSubmit() async {
    if (descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Vui lòng nhập mô tả!")));
      return;
    }

    setState(() => isLoading = true);
    try {
      final req = ReportRequest(
        matchId: widget.matchId,
        reportedUserIds: reportedUserIds,
        reasonType: reasonType,
        description: descController.text.trim(),
        evidenceImages:
            [], // Chưa tích hợp upload image trong Flutter context này
      );
      await matchService.reportViolation(req);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Đã gửi báo cáo thành công!")),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Lỗi gửi báo cáo: $e")));
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isEarlyAbsent = reasonType == 'EARLY_ABSENT';
    Color themeColor = isEarlyAbsent ? Colors.orange : Colors.red;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isEarlyAbsent ? Icons.warning : Icons.flag,
                  color: themeColor,
                ),
                const SizedBox(width: 8),
                Text(
                  isEarlyAbsent ? "Hủy trận khẩn cấp" : "Báo cáo vi phạm",
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: reasonType,
              decoration: const InputDecoration(
                labelText: "Loại yêu cầu",
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'EARLY_ABSENT',
                  child: Text(
                    "Hủy trận khẩn cấp (Thiếu người)",
                    style: TextStyle(color: Colors.orange, fontSize: 13),
                  ),
                ),
                DropdownMenuItem(
                  value: 'ABSENT',
                  child: Text(
                    "Vắng mặt (Vẫn đá xong)",
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                DropdownMenuItem(
                  value: 'BAD_BEHAVIOR',
                  child: Text(
                    "Hành vi tiêu cực / Chửi bới",
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                DropdownMenuItem(
                  value: 'LATE',
                  child: Text(
                    "Đến muộn quá quy định",
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                DropdownMenuItem(
                  value: 'OTHER',
                  child: Text("Khác", style: TextStyle(fontSize: 13)),
                ),
              ],
              onChanged: (val) {
                setState(() {
                  reasonType = val!;
                  reportedUserIds.clear(); // Reset list khi đổi loại
                });
              },
            ),
            const SizedBox(height: 16),

            // Flutter hiện chưa có Select Multiple tiêu chuẩn tiện lợi như AntD,
            // Tui thay bằng việc hiển thị Wrap các FilterChip cho Mobile
            const Text(
              "Người bị báo cáo:",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: widget.allPlayers.map((p) {
                bool isSelected = reportedUserIds.contains(p.userId);
                return FilterChip(
                  label: Text(p.userName),
                  selected: isSelected,
                  selectedColor: themeColor.withOpacity(0.2),
                  checkmarkColor: themeColor,
                  onSelected: (bool selected) {
                    setState(() {
                      if (selected) {
                        reportedUserIds.add(p.userId);
                      } else {
                        reportedUserIds.remove(p.userId);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: descController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: "Mô tả chi tiết *",
                alignLabelWithHint: true,
                border: const OutlineInputBorder(),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: isEarlyAbsent ? Colors.orange : Colors.purple,
                    width: 2,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      "Hủy",
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isEarlyAbsent
                            ? [Colors.orange, Colors.red]
                            : [Colors.orange, Colors.purple],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                      ),
                      child: isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              isEarlyAbsent ? "Gửi Yêu Cầu Hủy" : "Gửi Báo Cáo",
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
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
