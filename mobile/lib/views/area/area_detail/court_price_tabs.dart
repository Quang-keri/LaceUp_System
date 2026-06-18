import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/court.dart';
import '../../../models/rental_area.dart';

class CourtPriceTab extends StatelessWidget {
  final RentalAreaResponse? rentalArea;
  final CourtResponse? activeCourt;
  final ValueChanged<CourtResponse>? onCourtSelected;

  const CourtPriceTab({
    super.key,
    required this.rentalArea,
    required this.activeCourt,
    this.onCourtSelected,
  });

  final Color primaryColor = const Color(0xFF9156F1);
  final Color selectedColor = const Color(0xFFEA580C);

  // Helper: Format "05:00:00" -> "5h" hoặc "05:30:00" -> "5h30"
  String _formatTime(String? time) {
    if (time == null || time.isEmpty) return '';
    try {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = parts[1];
        return minute == '00' ? '${hour}h' : '${hour}h$minute';
      }
    } catch (e) {
      return time;
    }
    return time;
  }

  // Helper: Trích xuất Ngày bắt đầu & kết thúc để làm Header
  String _getDateRange(dynamic rule) {
    try {
      final startDate = rule.startDate;
      final endDate = rule.endDate;

      if (startDate != null && endDate != null) {
        final start = DateTime.parse(startDate.toString());
        final end = DateTime.parse(endDate.toString());
        return '${DateFormat('dd/MM/yyyy').format(start)} - ${DateFormat('dd/MM/yyyy').format(end)}';
      }
    } catch (e) {
      // Bỏ qua nếu không parse được ngày
    }
    return 'Ngày thường';
  }

  @override
  Widget build(BuildContext context) {
    if (activeCourt == null || activeCourt!.priceRules.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: const Text(
            'Sân này hiện chưa có thông tin bảng giá chi tiết.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
          ),
        ),
      );
    }

    final rules = activeCourt!.priceRules!;
    final courts = rentalArea?.courts ?? [];

    CourtResponse? dropdownValue;
    if (courts.isNotEmpty) {
      try {
        dropdownValue = courts.firstWhere(
          (c) => c.courtId == activeCourt!.courtId,
        );
      } catch (_) {
        dropdownValue = null;
      }
    }

    Map<String, Map<String, List<dynamic>>> groupedRules = {};

    for (var rule in rules) {
      String dateRange = _getDateRange(rule);
      String dayType = rule.dayType == 'WEEKDAY'
          ? 'T2 - T6'
          : rule.dayType == 'WEEKEND'
          ? 'T7 - CN'
          : 'Tất cả';

      groupedRules.putIfAbsent(dateRange, () => {});
      groupedRules[dateRange]!.putIfAbsent(dayType, () => []);
      groupedRules[dateRange]![dayType]!.add(rule);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Bảng giá',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: selectedColor.withOpacity(0.3)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<CourtResponse>(
                      value: dropdownValue,
                      isExpanded: true,
                      icon: Icon(
                        Icons.keyboard_arrow_down,
                        color: selectedColor,
                      ),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: selectedColor,
                      ),
                      onChanged: (CourtResponse? newValue) {
                        if (newValue != null && onCourtSelected != null) {
                          onCourtSelected!(newValue);
                        }
                      },
                      items: courts.map<DropdownMenuItem<CourtResponse>>((
                        CourtResponse court,
                      ) {
                        return DropdownMenuItem<CourtResponse>(
                          value: court,
                          child: Text(
                            court.courtName,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 2. Render từng Bảng theo từng Cụm Ngày
          ...groupedRules.entries.map((dateEntry) {
            String dateRange = dateEntry.key;
            Map<String, List<dynamic>> dayTypeMap = dateEntry.value;

            return Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // HEADER: Cụm Ngày
                  Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 8,
                      horizontal: 12,
                    ),
                    decoration: BoxDecoration(
                      color: primaryColor,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8),
                      ),
                    ),
                    child: Text(
                      dateRange,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  // BODY: Bảng chia cột
                  Table(
                    border: TableBorder(
                      left: BorderSide(color: Colors.grey.shade300),
                      right: BorderSide(color: Colors.grey.shade300),
                      bottom: BorderSide(color: Colors.grey.shade300),
                      horizontalInside: BorderSide(color: Colors.grey.shade200),
                      verticalInside: BorderSide(color: Colors.grey.shade200),
                    ),
                    columnWidths: const {
                      0: FlexColumnWidth(1),
                      1: FlexColumnWidth(1.2),
                      2: FlexColumnWidth(1),
                    },
                    children: [
                      // Hàng Tiêu Đề
                      TableRow(
                        decoration: BoxDecoration(color: Colors.grey.shade50),
                        children: [
                          _buildCell('Thứ', isHeader: true),
                          _buildCell('Khung giờ', isHeader: true),
                          _buildCell('Giá', isHeader: true),
                        ],
                      ),
                      // Các hàng Dữ Liệu
                      ..._buildTableRows(dayTypeMap),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // Logic gen các hàng của bảng và xử lý "rowSpan" ảo
  List<TableRow> _buildTableRows(Map<String, List<dynamic>> dayTypeMap) {
    List<TableRow> rows = [];

    dayTypeMap.forEach((dayType, rulesList) {
      for (int i = 0; i < rulesList.length; i++) {
        final rule = rulesList[i];
        rows.add(
          TableRow(
            children: [
              // Ảo thuật RowSpan: Chỉ hiển thị tên "Thứ" ở dòng đầu tiên của cụm
              _buildCell(i == 0 ? dayType : '', isBold: i == 0),
              _buildCell(
                '${_formatTime(rule.startTime)} - ${_formatTime(rule.endTime)}',
              ),
              _buildCell(
                '${NumberFormat('#,###', 'vi_VN').format(rule.pricePerHour)} đ',
                textColor: selectedColor,
                isBold: true,
              ),
            ],
          ),
        );
      }
    });

    return rows;
  }

  Widget _buildCell(
    String text, {
    bool isHeader = false,
    bool isBold = false,
    Color? textColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: isHeader || isBold ? FontWeight.bold : FontWeight.normal,
          color: textColor ?? (isHeader ? Colors.black87 : Colors.black54),
          fontSize: isHeader ? 13 : 14,
        ),
      ),
    );
  }
}
