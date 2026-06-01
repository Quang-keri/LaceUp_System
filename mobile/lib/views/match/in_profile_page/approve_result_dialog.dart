import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../models/match.dart';
import '../../../models/match_result.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/match_result_service.dart';

class ApproveResultDialog extends StatefulWidget {
  final MatchResponse match;
  final VoidCallback onSuccess;

  const ApproveResultDialog({
    Key? key,
    required this.match,
    required this.onSuccess,
  }) : super(key: key);

  @override
  State<ApproveResultDialog> createState() => _ApproveResultDialogState();
}

class _ApproveResultDialogState extends State<ApproveResultDialog> {
  bool isLoading = true;
  bool isSubmitting = false;
  MatchResultResponse? pendingResult;

  @override
  void initState() {
    super.initState();
    _fetchResult();
  }

  Future<void> _fetchResult() async {
    try {
      final results = await matchResultService.getResultsByMatch(
        widget.match.matchId,
      );
      if (results.isNotEmpty) {
        setState(() => pendingResult = results[0]);
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Lỗi tải kết quả: $e")));
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _handleRespond(bool isAccepted) async {
    if (pendingResult == null) return;
    setState(() => isSubmitting = true);
    try {
      await matchResultService.respondToResult(
        pendingResult!.resultId,
        isAccepted,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isAccepted ? "Đã xác nhận kết quả!" : "Đã từ chối kết quả!",
          ),
        ),
      );
      widget.onSuccess();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Lỗi xử lý: $e")));
    } finally {
      setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Dialog(
        child: Padding(
          padding: EdgeInsets.all(30),
          child: CircularProgressIndicator(color: Colors.purple),
        ),
      );
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final myUserId = authProvider.user?['userId']?.toString() ?? "";

    bool isSubmitter = pendingResult?.submitterId == myUserId;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              isSubmitter ? Icons.hourglass_empty : Icons.verified_user,
              color: isSubmitter ? Colors.purple : Colors.orange,
              size: 40,
            ),
            const SizedBox(height: 12),
            Text(
              isSubmitter ? "Đã gửi KQ - Chờ duyệt" : "Duyệt kết quả",
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            if (isSubmitter)
              const Text(
                "Hệ thống đang chờ đối thủ xác nhận để tính điểm Rank.",
                textAlign: TextAlign.center,
              )
            else ...[
              Container(
                padding: const EdgeInsets.all(12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Text(
                  "Đối thủ báo ĐỘI ${pendingResult?.winningTeamNumber ?? '?'} THẮNG",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Hãy kiểm tra kỹ, nếu sai sự thật hãy bấm Từ chối.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: isSubmitting
                          ? null
                          : () => _handleRespond(false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                      ),
                      child: const Text("Từ chối"),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () => _handleRespond(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                      ),
                      child: const Text(
                        "Xác nhận đúng",
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ],

            if (isSubmitter)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Đóng"),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
