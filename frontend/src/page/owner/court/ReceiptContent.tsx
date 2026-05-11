import React, { forwardRef } from "react";
import dayjs from "dayjs";
import { useAuth } from "../../../context/AuthContext"; // Điều chỉnh path cho đúng

interface ReceiptContentProps {
  receiptData: any;
  formatCurrency: (v: number) => string;
}

export const ReceiptContent = forwardRef<HTMLDivElement, ReceiptContentProps>(
  ({ receiptData, formatCurrency }, ref) => {
    const { user } = useAuth();

    return (
      <div className="p-4 bg-white" ref={ref}>
        <div style={{ fontFamily: "Arial, sans-serif", color: "#000" }}>
          <div className="text-center mb-4">
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
              HỆ THỐNG QUẢN LÝ Lace Up
            </h2>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>
              Địa chỉ: Chi nhánh Hồ Chí Minh
            </p>
            <p style={{ margin: 0, fontSize: "14px" }}>
              Điện thoại hệ thống: 0900000001
            </p>
          </div>

          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "10px 0",
              margin: "10px 0",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <div>
              <p style={{ margin: "2px 0" }}>
                Mã đặt: <b>{receiptData.bookingCode}</b>
              </p>
              <p style={{ margin: "2px 0" }}>
                Ngày xuất: {receiptData.createdDate}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "2px 0" }}>
                Người xuất: <b>{user?.userName || "Admin"}</b>
              </p>
              <p style={{ margin: "2px 0" }}>SĐT chủ: {user?.phone || "N/A"}</p>
            </div>
          </div>

          <div className="text-center my-6">
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
              PHIẾU ĐẶT PHÒNG/SÂN
            </h3>
          </div>

          <div style={{ fontSize: "13px", marginBottom: "15px" }}>
            <p style={{ margin: "4px 0" }}>
              <b>Khách hàng:</b> {receiptData.customerName || "Khách lẻ"}
            </p>
            <p style={{ margin: "4px 0" }}>
              <b>Điện thoại khách:</b> {receiptData.phone}
            </p>
          </div>

          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse", marginBottom: "15px" }}>
            <thead>
              <tr style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000" }}>
                <th style={{ textAlign: "left", padding: "8px 0" }}>Nội dung</th>
                <th style={{ textAlign: "center", padding: "8px 0" }}>SL</th>
                <th style={{ textAlign: "right", padding: "8px 0" }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.slots.map((slot: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: "8px 0", borderBottom: "1px dashed #ccc" }}>
                    <b>{slot.courtCode}</b>
                    <div style={{ fontSize: "12px" }}>{slot.startDisplay} - {slot.endDisplay}</div>
                  </td>
                  <td style={{ textAlign: "center", borderBottom: "1px dashed #ccc" }}>1</td>
                  <td style={{ textAlign: "right", borderBottom: "1px dashed #ccc" }}>-</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "13px" }}>
            <table style={{ width: "250px" }}>
              <tbody>
                <tr>
                  <td>Tổng cộng:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(receiptData.totalPrice)}</td>
                </tr>
                <tr>
                  <td>Đã trả:</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(receiptData.paidAmount)}</td>
                </tr>
                <tr style={{ borderTop: "1px dashed #000" }}>
                  <td><b>Còn lại:</b></td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(receiptData.totalPrice - receiptData.paidAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-center mt-10" style={{ fontSize: "12px", fontStyle: "italic" }}>
             Cảm ơn bạn đã sử dụng dịch vụ của Lace Up!
          </div>
        </div>
      </div>
    );
  }
);