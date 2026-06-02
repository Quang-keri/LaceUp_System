import 'court.dart';
import 'court_copy.dart';

class SelectedBookingSlot {
  final String courtCopyId;
  final String courtCode;
  final String courtId;
  final String courtName;
  final String categoryName;
  final DateTime date;
  final int startIndex;
  final int endIndex;
  final String startTime;
  final String endTime;
  final double duration;
  final CourtResponse court;
  final CourtCopyResponse courtCopy;

  SelectedBookingSlot({
    required this.courtCopyId,
    required this.courtCode,
    required this.courtId,
    required this.courtName,
    required this.categoryName,
    required this.date,
    required this.startIndex,
    required this.endIndex,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.court,
    required this.courtCopy,
  });

  SelectedBookingSlot copyWith({
    int? startIndex,
    int? endIndex,
    String? startTime,
    String? endTime,
    double? duration,
  }) {
    return SelectedBookingSlot(
      courtCopyId: courtCopyId,
      courtCode: courtCode,
      courtId: courtId,
      courtName: courtName,
      categoryName: categoryName,
      date: date,
      startIndex: startIndex ?? this.startIndex,
      endIndex: endIndex ?? this.endIndex,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      duration: duration ?? this.duration,
      court: court,
      courtCopy: courtCopy,
    );
  }
}