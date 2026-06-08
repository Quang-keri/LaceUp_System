class DeleteAccountResponse {
  final String status;
  final String message;
  final List<String> blockers;

  const DeleteAccountResponse({
    required this.status,
    required this.message,
    required this.blockers,
  });

  bool get isCompleted => status == 'COMPLETED';

  bool get isWaiting =>
      status == 'WAITING_FOR_OBLIGATIONS';

  factory DeleteAccountResponse.fromJson(
      Map<String, dynamic> json,
      ) {
    final rawBlockers = json['blockers'];

    return DeleteAccountResponse(
      status: json['status']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      blockers: rawBlockers is List
          ? rawBlockers
          .map((item) => item.toString())
          .toList()
          : <String>[],
    );
  }
}

class AccountDeletionException implements Exception {
  final String message;

  const AccountDeletionException(this.message);

  @override
  String toString() => message;
}