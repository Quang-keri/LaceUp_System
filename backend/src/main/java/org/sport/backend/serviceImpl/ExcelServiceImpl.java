package org.sport.backend.serviceImpl;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.service.ExcelService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExcelServiceImpl implements ExcelService {

    @Override
    public byte[] exportBookingsToExcel(List<BookingResponse> bookings) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bookings");

            // Tạo Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"STT", "Mã đơn", "Khách hàng", "Điện thoại", "Khung Giờ", "Tổng tiền", "Đã cọc", "Còn lại", "Phương thức trả", "Trạng thái"};

            // Định dạng Header (In đậm, màu nền)
            CellStyle headerCellStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Ghi dữ liệu
            int rowIdx = 1;
            for (int i = 0; i < bookings.size(); i++) {
                BookingResponse booking = bookings.get(i);
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(booking.getBookingId().toString());
                row.createCell(2).setCellValue(booking.getUserName());
                row.createCell(3).setCellValue(booking.getPhoneNumber());
                row.createCell(4).setCellValue(booking.getStartTime() + " - " + booking.getEndTime());
                row.createCell(5).setCellValue(booking.getTotalPrice() != null ? booking.getTotalPrice().doubleValue() : 0);
                row.createCell(6).setCellValue(booking.getDepositAmount() != null ? booking.getDepositAmount().doubleValue() : 0);
                row.createCell(7).setCellValue(booking.getRemainingAmount() != null ? booking.getRemainingAmount().doubleValue() : 0);
                row.createCell(8).setCellValue(booking.getPaymentMethod());
                row.createCell(9).setCellValue(booking.getBookingStatus().toString());
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
