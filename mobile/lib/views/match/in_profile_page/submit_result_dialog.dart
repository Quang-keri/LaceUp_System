import 'package:flutter/material.dart';
import '../../../models/match.dart';
import '../../../services/match_service.dart';
import 'report_dialog.dart';

class SubmitResultDialog extends StatefulWidget {
  final MatchResponse match;
  final VoidCallback onSuccess;

  const SubmitResultDialog({
    Key? key,
    required this.match,
    required this.onSuccess,
  }) : super(key: key);

  @override
  State<SubmitResultDialog> createState() => _SubmitResultDialogState();
}

class _SubmitResultDialogState extends State<SubmitResultDialog> {
  int? winningTeam;
  List<String> absentUsers = [];
  bool isLoading = false;

  Future<void> _handleSubmit() async {
    if (winningTeam == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng chọn đội chiến thắng!")),
      );
      return;
    }

    setState(() => isLoading = true);
    try {
      await matchService.submitResult(
        matchId: widget.match.matchId,
        winningTeamNumber: winningTeam!,
        absentUserIds: absentUsers,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Đã gửi kết quả, chờ đối thủ xác nhận!")),
      );
      widget.onSuccess();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Lỗi: $e")));
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _openReportModal() {
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (context) => ReportDialog(
        matchId: widget.match.matchId,
        allPlayers: widget.match.participants,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.emoji_events, color: Colors.orange),
                SizedBox(width: 8),
                Text(
                  "Chốt Kết Quả",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              "1. Đội nào chiến thắng?",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => winningTeam = 1),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: winningTeam == 1
                            ? Colors.orange.shade50
                            : Colors.white,
                        border: Border.all(
                          color: winningTeam == 1
                              ? Colors.orange
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text(
                          "Đội 1",
                          style: TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => winningTeam = 2),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: winningTeam == 2
                            ? Colors.purple.shade50
                            : Colors.white,
                        border: Border.all(
                          color: winningTeam == 2
                              ? Colors.purple
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text(
                          "Đội 2",
                          style: TextStyle(
                            color: Colors.purple,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),
            const Text(
              "2. Điểm danh vắng mặt (Trừ uy tín)",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 8),

            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: widget.match.participants.length,
                itemBuilder: (context, index) {
                  final player = widget.match.participants[index];
                  final isChecked = absentUsers.contains(player.userId);
                  return CheckboxListTile(
                    title: Text(
                      player.userName,
                      style: const TextStyle(fontSize: 14),
                    ),
                    value: isChecked,
                    activeColor: Colors.red,
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    onChanged: (bool? value) {
                      setState(() {
                        if (value == true) {
                          absentUsers.add(player.userId);
                        } else {
                          absentUsers.remove(player.userId);
                        }
                      });
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: _openReportModal,
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text("Báo cáo khẩn cấp"),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Colors.orange, Colors.purple],
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
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            "Gửi KQ",
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
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
