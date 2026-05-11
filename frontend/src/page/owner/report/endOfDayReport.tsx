import React, { useState, useEffect } from "react";
import type { EndOfDayReportResponse } from "../../../types/report";
import reportService from "../../../service/reportService";

const EndOfDayReport: React.FC = () => {
  const [report, setReport] = useState<EndOfDayReportResponse | null>(null);
  const [activeTab, setActiveTab] = useState<
    "bookings" | "services" | "payments"
  >("bookings");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    try {
        setLoading(true);
        const data = await reportService.getEndOfDayReport();
        setReport(data);
    } catch (error) {
        console.error("Lỗi khi tải báo cáo cuối ngày:", error);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchReport();
}, []);

  if (loading)
    return (
      <div className="text-center p-4 text-purple-600">Đang tải báo cáo...</div>
    );
  if (!report) return null;

  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      {/* TÍCH HỢP VÀO CARD TỔNG QUAN: Các thông số này có thể đưa trực tiếp vào card doanh thu phía trên của bạn */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-800 font-medium">
            Doanh thu Sân (Hôm nay)
          </p>
          <p className="text-lg font-bold text-purple-700">
            {report.totalBookingRevenue?.toLocaleString("vi-VN")} đ
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-800 font-medium">
            Bán Hàng & Dịch Vụ
          </p>
          <p className="text-lg font-bold text-orange-600">
            {report.totalServiceRevenue?.toLocaleString("vi-VN")} đ
          </p>
        </div>
      </div>

      {/* DANH SÁCH CHI TIẾT */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "bookings"
                ? "text-purple-700 border-b-2 border-purple-700"
                : "text-gray-500"
            }`}
          >
            Lịch Đặt ({report.bookings?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "services"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-500"
            }`}
          >
            Hàng Hóa ({report.serviceItems?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "payments"
                ? "text-purple-700 border-b-2 border-purple-700"
                : "text-gray-500"
            }`}
          >
            Thanh Toán ({report.payments?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-3 max-h-96 overflow-y-auto">
          {activeTab === "bookings" && (
            <div className="flex flex-col gap-3">
              {report.bookings?.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-purple-500"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {booking.userName || "Khách lẻ"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.startTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(booking.endTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-700 text-sm">
                      {booking.totalPrice?.toLocaleString("vi-VN")} đ
                    </p>
                    <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                      {booking.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "services" && (
            <div className="flex flex-col gap-3">
              {report.serviceItems?.map((item, idx) => (
                <div
                  key={item.serviceId || idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-orange-400"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {item.serviceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Số lượng:{" "}
                      <span className="font-bold text-orange-600">
                        {item.quantity}
                      </span>
                    </p>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="flex flex-col gap-3">
              {report.payments?.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border-l-4 border-purple-500"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {payment.paymentMethod}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.transactionDate).toLocaleTimeString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">
                      +{payment.amount?.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {payment.transactionCode || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndOfDayReport;
