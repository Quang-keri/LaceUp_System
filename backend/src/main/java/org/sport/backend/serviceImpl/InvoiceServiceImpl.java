package org.sport.backend.serviceImpl;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.DashedBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.service.InvoiceService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private static final String FONT_PATH = "backend/src/main/resources/fonts/NotoSans-Regular.ttf";

    @Override
    public byte[] generateInvoicePdf(BookingResponse booking) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);

            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(40, 50, 40, 50);

            PdfFont font = PdfFontFactory.createFont(FONT_PATH, PdfEncodings.IDENTITY_H);
            PdfFont boldFont = PdfFontFactory.createFont(FONT_PATH, PdfEncodings.IDENTITY_H); // Nếu có NotoSans-Bold thì thay vào đây, tạm thời iText sẽ tự đậm nếu cần hoặc ta dùng giả lập đậm.
            document.setFont(font);
            document.setFontSize(11);

            DecimalFormat df = new DecimalFormat("#,###");
            Border dashedBorder = new DashedBorder(ColorConstants.BLACK, 1f);
            Border noBorder = Border.NO_BORDER;


            document.add(new Paragraph("HỆ THỐNG QUẢN LÝ LACE UP")
                    .setFont(boldFont).setFontSize(16).setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
            document.add(new Paragraph("Địa chỉ: "+booking.getRentalArea().getAddress().getStreet() + ", " + booking.getRentalArea().getAddress().getWard() +", " + booking.getRentalArea().getAddress().getCity().getCityName())
                    .setFont(font).setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginBottom(0));
            document.add(new Paragraph("Điện thoại: "+booking.getRentalArea().getContactPhone())
                    .setFont(font).setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginBottom(15));


            String shortId = booking.getBookingId().toString().split("-")[0].toUpperCase();
            String formattedDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

            Table metaTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            metaTable.setMarginBottom(20);

            Cell leftMeta = new Cell().add(new Paragraph("Mã đặt sân: #" + shortId + "\nNgày xuất: " + formattedDate).setMargin(0))
                    .setBorder(noBorder).setBorderTop(dashedBorder).setBorderBottom(dashedBorder).setPaddingTop(8).setPaddingBottom(8).setFontSize(10);

            Cell rightMeta = new Cell().add(new Paragraph("Người xuất phiếu: chủ sân").setMargin(0))
                    .setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderTop(dashedBorder).setBorderBottom(dashedBorder).setPaddingTop(8).setPaddingBottom(8).setFontSize(10);

            metaTable.addCell(leftMeta);
            metaTable.addCell(rightMeta);
            document.add(metaTable);


            document.add(new Paragraph("PHIẾU ĐẶT SÂN")
                    .setFont(boldFont).setFontSize(16).setTextAlignment(TextAlignment.CENTER).setMarginBottom(15));


            document.add(new Paragraph("Khách hàng: " + (booking.getUserName() != null ? booking.getUserName() : "Khách lẻ")).setMargin(0).setFontSize(10));
            document.add(new Paragraph("Điện thoại: " + (booking.getPhoneNumber() != null ? booking.getPhoneNumber() : "---")).setMargin(0).setFontSize(10));
            document.add(new Paragraph("\n"));


            Table table = new Table(UnitValue.createPercentArray(new float[]{4, 1, 2, 2})).useAllAvailableWidth();
            table.setMarginBottom(20);


            String[] headers = {"Nội dung", "SL", "Đơn giá", "Thành tiền"};
            for (int i = 0; i < headers.length; i++) {
                Cell hCell = new Cell().add(new Paragraph(headers[i]).setFont(boldFont).setFontSize(10))
                        .setBorder(noBorder).setBorderTop(dashedBorder).setBorderBottom(dashedBorder).setPaddingTop(5).setPaddingBottom(5);
                if (i == 1) hCell.setTextAlignment(TextAlignment.CENTER);
                if (i >= 2) hCell.setTextAlignment(TextAlignment.RIGHT);
                table.addHeaderCell(hCell);
            }

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            DateTimeFormatter timeOnlyFormatter = DateTimeFormatter.ofPattern("HH:mm");

            if (booking.getSlots() != null) {
                for (SlotResponse slot : booking.getSlots()) {
                    BigDecimal slotPrice = slot.getPrice() != null ? slot.getPrice() : BigDecimal.ZERO;
                    String timeRange = slot.getStartTime().format(timeFormatter) + " - " + slot.getEndTime().format(timeOnlyFormatter);

                    Cell c1 = new Cell().add(new Paragraph(slot.getCourtCode()).setFont(boldFont).setFontSize(10).setMargin(0))
                            .add(new Paragraph(timeRange).setFontSize(9).setMargin(0))
                            .setBorder(noBorder).setBorderBottom(dashedBorder).setPaddingTop(5).setPaddingBottom(5);
                    Cell c2 = new Cell().add(new Paragraph("1").setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.CENTER).setBorder(noBorder).setBorderBottom(dashedBorder);
                    Cell c3 = new Cell().add(new Paragraph(df.format(slotPrice)).setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderBottom(dashedBorder);
                    Cell c4 = new Cell().add(new Paragraph(df.format(slotPrice)).setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderBottom(dashedBorder);

                    table.addCell(c1); table.addCell(c2); table.addCell(c3); table.addCell(c4);
                }
            }

            if (booking.getExtraServiceResponses() != null && !booking.getExtraServiceResponses().isEmpty()) {
                for (BookingResponse.BookingServiceResponse service : booking.getExtraServiceResponses()) {
                    BigDecimal rowTotal = service.getPrice().multiply(BigDecimal.valueOf(service.getQuantity()));

                    Cell c1 = new Cell().add(new Paragraph(service.getServiceName()).setFont(boldFont).setFontSize(10).setMargin(0))
                            .setBorder(noBorder).setBorderBottom(dashedBorder).setPaddingTop(5).setPaddingBottom(5);
                    Cell c2 = new Cell().add(new Paragraph(String.valueOf(service.getQuantity())).setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.CENTER).setBorder(noBorder).setBorderBottom(dashedBorder);
                    Cell c3 = new Cell().add(new Paragraph(df.format(service.getPrice())).setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderBottom(dashedBorder);
                    Cell c4 = new Cell().add(new Paragraph(df.format(rowTotal)).setMargin(0)).setFontSize(10).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderBottom(dashedBorder);

                    table.addCell(c1); table.addCell(c2); table.addCell(c3); table.addCell(c4);
                }
            }
            document.add(table);

            BigDecimal total = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal remaining = booking.getRemainingAmount() != null ? booking.getRemainingAmount() : BigDecimal.ZERO;
            BigDecimal paid = total.subtract(remaining);

            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{5, 5})).useAllAvailableWidth();

            Cell emptyCell = new Cell().setBorder(noBorder);

            Table mathTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();

            mathTable.addCell(new Cell().add(new Paragraph("Tổng tiền hàng:").setMargin(0)).setBorder(noBorder).setFontSize(10));
            mathTable.addCell(new Cell().add(new Paragraph(df.format(total)).setMargin(0)).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setFontSize(10).setFont(boldFont));

            mathTable.addCell(new Cell().add(new Paragraph("Đã thanh toán:").setMargin(0)).setBorder(noBorder).setFontSize(10));
            mathTable.addCell(new Cell().add(new Paragraph(df.format(paid)).setMargin(0)).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setFontSize(10));

            mathTable.addCell(new Cell().add(new Paragraph("Còn lại:").setFont(boldFont).setMargin(0)).setBorder(noBorder).setBorderTop(dashedBorder).setFontSize(10).setPaddingTop(3));
            mathTable.addCell(new Cell().add(new Paragraph(df.format(remaining)).setFont(boldFont).setMargin(0)).setTextAlignment(TextAlignment.RIGHT).setBorder(noBorder).setBorderTop(dashedBorder).setFontSize(10).setPaddingTop(3));

            summaryTable.addCell(emptyCell);
            summaryTable.addCell(new Cell().add(mathTable).setBorder(noBorder));

            document.add(summaryTable);

            document.add(new Paragraph("\n\n Trong vô vàng lựa chọn cảm ơn ơn bạn đã chọn chúng tôi , chúc bạn sức khỏe và có những trải nghiệm tuyệt vời tại Lace Up")
                    .setFont(font).setFontSize(10).setItalic().setTextAlignment(TextAlignment.CENTER).setMarginBottom(0));
            document.add(new Paragraph("Hệ thống Lace Up")
                    .setFont(font).setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi xuất hóa đơn PDF: " + e.getMessage());
        }
    }
}