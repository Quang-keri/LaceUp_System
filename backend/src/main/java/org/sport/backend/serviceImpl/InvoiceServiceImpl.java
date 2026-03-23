package org.sport.backend.serviceImpl;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
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


    private static final String FONT_PATH = "src/main/resources/fonts/NotoSans-Regular.ttf";


    private static final DeviceRgb BRAND_COLOR = new DeviceRgb(44, 62, 80);
    private static final DeviceRgb SUCCESS_COLOR = new DeviceRgb(39, 174, 96);

    @Override
    public byte[] generateInvoicePdf(BookingResponse booking) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(30, 36, 30, 36);


            PdfFont font = PdfFontFactory.createFont(FONT_PATH, PdfEncodings.IDENTITY_H);
            PdfFont boldFont = PdfFontFactory.createFont(FONT_PATH, PdfEncodings.IDENTITY_H);
            document.setFont(font);


            DecimalFormat df = new DecimalFormat("#,###");


            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            headerTable.setBorder(Border.NO_BORDER);

            headerTable.addCell(new Cell().add(new Paragraph("HỆ THỐNG LACE UP")
                            .setFont(boldFont).setFontSize(24).setFontColor(BRAND_COLOR))
                    .setBorder(Border.NO_BORDER));

            headerTable.addCell(new Cell().add(new Paragraph("HÓA ĐƠN DỊCH VỤ")
                            .setFont(boldFont).setFontSize(18).setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.BOTTOM));

            document.add(headerTable);
            document.add(new Paragraph("\n"));


            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();


            Cell customerCell = new Cell().add(new Paragraph("Khách hàng: ").setFont(boldFont)
                            .add(new Paragraph(booking.getUserName() != null ? booking.getUserName() : "Khách vãng lai").setFont(font)))
                    .add(new Paragraph("Điện thoại: ").setFont(boldFont)
                            .add(new Paragraph(booking.getPhoneNumber() != null ? booking.getPhoneNumber() : "---").setFont(font)))
                    .setBorder(Border.NO_BORDER);


            String shortId = booking.getBookingId().toString().split("-")[0].toUpperCase();
            Cell bookingCell = new Cell().add(new Paragraph("Mã đơn: #" + shortId).setFont(font))
                    .add(new Paragraph("Ngày in: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).setFont(font))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(Border.NO_BORDER);

            infoTable.addCell(customerCell);
            infoTable.addCell(bookingCell);
            document.add(infoTable);
            document.add(new Paragraph("\n"));


            float[] columnWidths = {3, 4, 4, 3};
            Table table = new Table(UnitValue.createPercentArray(columnWidths)).useAllAvailableWidth();


            String[] headers = {"Sân", "Bắt đầu", "Kết thúc", "Giá (VNĐ)"};
            for (String h : headers) {
                table.addHeaderCell(new Cell().add(new Paragraph(h).setFont(boldFont).setFontColor(ColorConstants.WHITE))
                        .setBackgroundColor(BRAND_COLOR)
                        .setPadding(8)
                        .setTextAlignment(TextAlignment.CENTER));
            }


            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM HH:mm");
            if (booking.getSlots() != null) {
                for (SlotResponse slot : booking.getSlots()) {
                    BigDecimal slotPrice = slot.getPrice() != null ? slot.getPrice() : BigDecimal.ZERO;

                    table.addCell(new Cell().add(new Paragraph(slot.getCourtCode())).setTextAlignment(TextAlignment.CENTER).setPadding(5));
                    table.addCell(new Cell().add(new Paragraph(slot.getStartTime().format(timeFormatter))).setTextAlignment(TextAlignment.CENTER));
                    table.addCell(new Cell().add(new Paragraph(slot.getEndTime().format(timeFormatter))).setTextAlignment(TextAlignment.CENTER));
                    table.addCell(new Cell().add(new Paragraph(df.format(slotPrice))).setTextAlignment(TextAlignment.RIGHT).setPaddingRight(10));
                }
            }
            document.add(table);


            document.add(new Paragraph("\n"));
            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            summaryTable.setBorder(Border.NO_BORDER);

            summaryTable.addCell(new Cell().add(new Paragraph("Ghi chú: ...........................................")
                            .setFont(font).setItalic())
                    .setBorder(Border.NO_BORDER));


            BigDecimal total = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal remaining = booking.getRemainingAmount() != null ? booking.getRemainingAmount() : BigDecimal.ZERO;
            BigDecimal paid = total.subtract(remaining);

            Cell moneyCell = new Cell()
                    .add(new Paragraph("Tổng cộng: " + df.format(total) + " VNĐ").setFont(boldFont).setFontSize(14))
                    .add(new Paragraph("Đã thanh toán: " + df.format(paid) + " VNĐ").setFont(font).setFontColor(SUCCESS_COLOR))
                    .add(new Paragraph("Còn lại: " + df.format(remaining) + " VNĐ")
                            .setFont(boldFont)
                            .setFontColor(remaining.compareTo(BigDecimal.ZERO) > 0 ? ColorConstants.RED : BRAND_COLOR))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(Border.NO_BORDER);

            summaryTable.addCell(moneyCell);
            document.add(summaryTable);


            document.add(new Paragraph("\n\n"));
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                document.add(new Paragraph("--- ĐÃ THANH TOÁN XONG ---")
                        .setFont(boldFont).setFontColor(SUCCESS_COLOR)
                        .setTextAlignment(TextAlignment.CENTER));
            }

            document.add(new Paragraph("Cảm ơn quý khách đã tin tưởng LACE UP!")
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30));

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi xuất hóa đơn PDF: " + e.getMessage());
        }
    }
}