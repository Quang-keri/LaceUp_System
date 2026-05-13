package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.payment.PaymentResponse;
import org.sport.backend.dto.response.report.ReportResponse;
import org.sport.backend.service.ExcelService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExcelServiceImpl implements ExcelService {

    @Override
    public byte[] exportBookingsToExcel(List<BookingResponse> bookings) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            createGroupedRevenueSheet(workbook, "Doanh_Thu_Tong_Hop", bookings);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateRevenueReport(ReportResponse data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Sheet 1: Báo cáo Doanh Thu Tổng Hợp (Được Group theo Sân giống giao diện web)
            if (data.getBookings() != null && !data.getBookings().isEmpty()) {
                createGroupedRevenueSheet(workbook, "Doanh_Thu", data.getBookings());
            }

            // (Tuỳ chọn) Bạn vẫn có thể giữ lại các sheet phụ chi tiết nếu muốn đối soát
            CellStyle headerStyle = createHeaderStyle(workbook);
            if (data.getServiceItems() != null && !data.getServiceItems().isEmpty()) {
                createServiceSheet(workbook, data.getServiceItems(), headerStyle);
            }
            if (data.getPayments() != null && !data.getPayments().isEmpty()) {
                createPaymentSheet(workbook, data.getPayments(), headerStyle);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ================= MAIN LOGIC: TẠO BẢNG GROUP THEO SÂN =================

    private void createGroupedRevenueSheet(Workbook workbook, String sheetName, List<BookingResponse> bookings) {
        Sheet sheet = workbook.createSheet(sheetName);

        // 1. Nhóm dữ liệu giống hệt logic trên Frontend
        Map<String, CourtSummary> groupedData = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (BookingResponse b : bookings) {
            String courtName = (b.getSlots() != null && !b.getSlots().isEmpty() && b.getSlots().getFirst().getCourtName() != null)
                    ? b.getSlots().getFirst().getCourtName()
                    : "Chưa phân sân";

            CourtSummary summary = groupedData.computeIfAbsent(courtName, CourtSummary::new);

            // Tính tiền dịch vụ
            BigDecimal serviceFee = BigDecimal.ZERO;
            if (b.getExtraServiceResponses() != null) {
                for (var svc : b.getExtraServiceResponses()) {
                    if (svc.getPrice() != null && svc.getQuantity() != null) {
                        serviceFee = serviceFee.add(svc.getPrice().multiply(BigDecimal.valueOf(svc.getQuantity())));
                    }
                }
            }

            // Tính tiền sân và doanh thu tổng
            BigDecimal grandTotal = b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal courtFee = grandTotal.subtract(serviceFee);

            // Cộng dồn vào dòng tổng của Sân
            summary.invoiceCount++;
            summary.totalCourtFee = summary.totalCourtFee.add(courtFee);
            summary.totalServiceFee = summary.totalServiceFee.add(serviceFee);
            summary.totalRevenue = summary.totalRevenue.add(grandTotal);

            // Tạo chi tiết dòng con
            BookingDetail detail = new BookingDetail();
            String fullId = b.getBookingId() != null ? b.getBookingId().toString() : "";
            // Cắt ngắn UUID cho giống web, hoặc giữ nguyên
            detail.bookingId = fullId.length() > 8 ? fullId.substring(0, 8).toUpperCase() : fullId;
            detail.time = b.getStartTime() != null ? b.getStartTime().format(formatter) : "";
            detail.customerName = b.getUserName() != null ? b.getUserName() : "Khách lẻ";
            detail.courtFee = courtFee;
            detail.serviceFee = serviceFee;
            detail.revenue = grandTotal;

            summary.bookings.add(detail);
        }

        // 2. Chuẩn bị Styles cho Excel
        CellStyle mainHeaderStyle = createMainHeaderStyle(workbook);
        CellStyle groupRowStyle = createGroupRowStyle(workbook);
        CellStyle moneyStyle = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        moneyStyle.setDataFormat(format.getFormat("#,##0")); // Định dạng tiền tệ có dấu phẩy

        CellStyle groupMoneyStyle = createGroupRowStyle(workbook);
        groupMoneyStyle.setDataFormat(format.getFormat("#,##0"));

        // 3. Tạo Header chính
        String[] columns = {"Hạng phòng / Tên sân / Mã Giao Dịch", "SL Hóa đơn / Thời gian", "Khách hàng", "Tiền sân", "Tiền dịch vụ", "Doanh thu thuần"};
        int rowIdx = 0;
        Row headerRow = sheet.createRow(rowIdx++);
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(mainHeaderStyle);
        }

        // 4. Đổ dữ liệu ra các Row
        for (CourtSummary summary : groupedData.values()) {
            // -- DÒNG CHA (TỔNG CỦA SÂN) --
            Row groupRow = sheet.createRow(rowIdx++);

            Cell c0 = groupRow.createCell(0);
            c0.setCellValue("[-] " + summary.courtName);
            c0.setCellStyle(groupRowStyle);

            Cell c1 = groupRow.createCell(1);
            c1.setCellValue(summary.invoiceCount);
            c1.setCellStyle(groupRowStyle);

            Cell c2 = groupRow.createCell(2);
            c2.setCellValue("");
            c2.setCellStyle(groupRowStyle);

            Cell c3 = groupRow.createCell(3);
            c3.setCellValue(summary.totalCourtFee.doubleValue());
            c3.setCellStyle(groupMoneyStyle);

            Cell c4 = groupRow.createCell(4);
            c4.setCellValue(summary.totalServiceFee.doubleValue());
            c4.setCellStyle(groupMoneyStyle);

            Cell c5 = groupRow.createCell(5);
            c5.setCellValue(summary.totalRevenue.doubleValue());
            c5.setCellStyle(groupMoneyStyle);

            // -- CÁC DÒNG CON (CHI TIẾT HÓA ĐƠN) --
            for (BookingDetail detail : summary.bookings) {
                Row detailRow = sheet.createRow(rowIdx++);

                // Lùi vào một chút để thấy phân cấp
                detailRow.createCell(0).setCellValue("      " + detail.bookingId);
                detailRow.createCell(1).setCellValue(detail.time);
                detailRow.createCell(2).setCellValue(detail.customerName);

                Cell dc3 = detailRow.createCell(3);
                dc3.setCellValue(detail.courtFee.doubleValue());
                dc3.setCellStyle(moneyStyle);

                Cell dc4 = detailRow.createCell(4);
                dc4.setCellValue(detail.serviceFee.doubleValue());
                dc4.setCellStyle(moneyStyle);

                Cell dc5 = detailRow.createCell(5);
                dc5.setCellValue(detail.revenue.doubleValue());
                dc5.setCellStyle(moneyStyle);
            }
        }

        // Resize các cột cho đẹp
        sheet.setColumnWidth(0, 10000); // Rộng hơn cho tên và mã GD
        sheet.setColumnWidth(1, 6000);
        sheet.setColumnWidth(2, 6000);
        sheet.setColumnWidth(3, 4000);
        sheet.setColumnWidth(4, 4000);
        sheet.setColumnWidth(5, 5000);
    }

    // ================= HELPER CLASSES (Dùng để nhóm dữ liệu) =================

    private static class CourtSummary {
        String courtName;
        int invoiceCount = 0;
        BigDecimal totalCourtFee = BigDecimal.ZERO;
        BigDecimal totalServiceFee = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        List<BookingDetail> bookings = new ArrayList<>();

        public CourtSummary(String courtName) {
            this.courtName = courtName;
        }
    }

    private static class BookingDetail {
        String bookingId;
        String time;
        String customerName;
        BigDecimal courtFee;
        BigDecimal serviceFee;
        BigDecimal revenue;
    }

    // ================= HELPER METHODS STYLES & OLD SHEETS =================

    private CellStyle createMainHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        // Màu giống #bce6f8 (Xanh dương nhạt)
        style.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createGroupRowStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        // Màu giống #d7f1d4 (Xanh lá nhạt)
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void createServiceSheet(Workbook workbook, List<BookingResponse.BookingServiceResponse> services, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Chi_Tiet_Dich_Vu");
        String[] columns = {"STT", "Tên dịch vụ", "Số lượng", "Đơn giá", "Thành tiền"};

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (int i = 0; i < services.size(); i++) {
            BookingResponse.BookingServiceResponse svc = services.get(i);
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(svc.getServiceName() != null ? svc.getServiceName() : "");
            row.createCell(2).setCellValue(svc.getQuantity() != null ? svc.getQuantity() : 0);
            row.createCell(3).setCellValue(svc.getPrice() != null ? svc.getPrice().doubleValue() : 0);

            double total = (svc.getQuantity() != null && svc.getPrice() != null)
                    ? svc.getQuantity() * svc.getPrice().doubleValue() : 0;
            row.createCell(4).setCellValue(total);
        }

        for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);
    }

    private void createPaymentSheet(Workbook workbook, List<PaymentResponse> payments, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Lich_Su_Thanh_Toan");
        String[] columns = {"STT", "Mã Giao Dịch", "Mã Đơn (Booking)", "Thời gian", "Phương thức", "Số tiền", "Trạng thái"};

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (int i = 0; i < payments.size(); i++) {
            PaymentResponse payment = payments.get(i);
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(i + 1);
            row.createCell(1).setCellValue(payment.getPaymentId() != null ? payment.getPaymentId().toString() : "");
            row.createCell(2).setCellValue(payment.getBookingId() != null ? payment.getBookingId().toString() : "");
            row.createCell(3).setCellValue(payment.getTransactionDate() != null ? payment.getTransactionDate().toString() : "");
            row.createCell(4).setCellValue(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "");
            row.createCell(5).setCellValue(payment.getAmount() != null ? payment.getAmount().doubleValue() : 0);
            row.createCell(6).setCellValue(payment.getPaymentStatus() != null ? payment.getPaymentStatus().name() : "");
        }

        for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);
    }
}