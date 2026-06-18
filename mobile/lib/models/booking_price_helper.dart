import 'package:flutter/cupertino.dart';

import '../models/selected_booking_slot.dart';

int timeToMinutes(String time) {
  final parts = time.split(':');
  return int.parse(parts[0]) * 60 + int.parse(parts[1]);
}

double calculateSlotPrice(SelectedBookingSlot item) {
  double total = 0;

  final startMin = timeToMinutes(item.startTime);
  final endMin = timeToMinutes(item.endTime);

  final isWeekend =
      item.date.weekday == DateTime.saturday ||
      item.date.weekday == DateTime.sunday;

  final dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY';

  final rules = item.court.priceRules;
  final fallbackPrice = item.court.minPrice > 0
      ? item.court.minPrice
      : item.court.pricePerHour;

  for (int current = startMin; current < endMin; current += 30) {
    final matched = rules.where((rule) {
      if (rule.startTime == null || rule.endTime == null) return false;

      bool matchDateRange = true;

      if (rule.startDate != null && rule.endDate != null) {
        try {
          final start = DateTime.parse(rule.startDate!);
          final end = DateTime.parse(rule.endDate!);

          final checkDate = DateTime(
            item.date.year,
            item.date.month,
            item.date.day,
          );
          final normalizedStart = DateTime(start.year, start.month, start.day);
          final normalizedEnd = DateTime(end.year, end.month, end.day);

          if (checkDate.isBefore(normalizedStart) ||
              checkDate.isAfter(normalizedEnd)) {
            matchDateRange = false;
          }
        } catch (e) {
          debugPrint('Lỗi parse ngày trong price rule: $e');
        }
      }

      final ruleStart = timeToMinutes(rule.startTime!);
      final ruleEnd = timeToMinutes(rule.endTime!);
      final matchTime = current >= ruleStart && current < ruleEnd;

      final matchDay =
          rule.dayType == null ||
          rule.dayType == 'ALL' ||
          rule.dayType == dayType;

      return matchTime && matchDay && matchDateRange;
    }).toList();

    matched.sort((a, b) => b.priority.compareTo(a.priority));

    final pricePerHour = matched.isNotEmpty
        ? matched.first.pricePerHour
        : fallbackPrice;

    total += pricePerHour * 0.5;
  }

  return total;
}

double calculateTotalPrice(List<SelectedBookingSlot> slots) {
  return slots.fold<double>(0, (sum, item) => sum + calculateSlotPrice(item));
}
