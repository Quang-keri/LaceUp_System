class MatchResultRequest {
  final String matchId;
  final int winningTeamNumber;
  final List<String>? absentUserIds;

  MatchResultRequest({
    required this.matchId,
    required this.winningTeamNumber,
    this.absentUserIds,
  });

  Map<String, dynamic> toJson() {
    return {
      'matchId': matchId,
      'winningTeamNumber': winningTeamNumber,
      'absentUserIds': absentUserIds ?? [],
    };
  }
}

class MatchResultResponse {
  final String resultId;
  final String matchId;
  final String submitterId;
  final int winningTeamNumber;
  final List<String> winnerIds;
  final List<String> loserIds;
  final String status;
  final List<String> absentUserIds;
  final Map<String, int>? rankChanges;

  MatchResultResponse({
    required this.resultId,
    required this.matchId,
    required this.submitterId,
    required this.winningTeamNumber,
    required this.winnerIds,
    required this.loserIds,
    required this.status,
    required this.absentUserIds,
    this.rankChanges,
  });

  factory MatchResultResponse.fromJson(Map<String, dynamic> json) {
    return MatchResultResponse(
      resultId: json['resultId']?.toString() ?? '',
      matchId: json['matchId']?.toString() ?? '',
      submitterId: json['submitterId']?.toString() ?? '',
      winningTeamNumber: int.tryParse(json['winningTeamNumber']?.toString() ?? '0') ?? 0,
      winnerIds: List<String>.from(json['winnerIds'] ?? []),
      loserIds: List<String>.from(json['loserIds'] ?? []),
      status: json['status']?.toString() ?? 'PENDING',
      absentUserIds: List<String>.from(json['absentUserIds'] ?? []),
      rankChanges: json['rankChanges'] != null ? Map<String, int>.from(json['rankChanges']) : null,
    );
  }
}