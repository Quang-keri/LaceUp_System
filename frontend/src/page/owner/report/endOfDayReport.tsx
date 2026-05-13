import React, { useState, useEffect, useMemo } from "react";
import type { EndOfDayReportResponse } from "../../../types/report";
import reportService from "../../../service/reportService";
import {
  DownloadIcon,
  FilterIcon,
  PlusSquare,
  MinusSquare,
} from "lucide-react";
import rentalService from "../../../service/rental/rentalService";

const EndOfDayReport: React.FC = () => {
  const [report, setReport] = useState<EndOfDayReportResponse | null>(null);

  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");

  const [expandedCourts, setExpandedCourts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRentalAreas = async () => {
      try {
        const res = await rentalService.getMyRentalAreas(1, 50);
        const areas =
          res.result?.data;
        setRentalAreas(areas);

        if (areas.length > 0) {
          setSelectedAreaId(areas[0].rentalAreaId);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách cơ sở:", error);
      }
    };

    fetchRentalAreas();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedAreaId) return;

      try {
        setLoading(true);
        const data = await reportService.getEndOfDayReport(
          startDate,
          endDate,
          selectedAreaId,
        );
        setReport(data);
      } catch (error) {
        console.error("Lỗi khi tải báo cáo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [startDate, endDate, selectedAreaId]);

  const toggleCourt = (courtName: string) => {
    setExpandedCourts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courtName)) {
        newSet.delete(courtName);
      } else {
        newSet.add(courtName);
      }
      return newSet;
    });
  };

  const handleExport = async () => {
    if (!selectedAreaId) {
        alert("Vui lòng chọn cơ sở trước khi xuất báo cáo!");
        return;
    }
    try {
      const selectedArea = rentalAreas.find(a => a.rentalAreaId === selectedAreaId);
      
      const areaNameForFile = selectedArea 
        ? selectedArea.rentalAreaName.replace(/\s+/g, '_') 
        : 'Co_So';

      const blob = await reportService.exportEndOfDayReport(startDate, endDate, selectedAreaId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      link.setAttribute(
        "download",
        `Bao_Cao_Doanh_Thu_${areaNameForFile}_${startDate}_den_${endDate}.xlsx`,
      );
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi tải file báo cáo:", error);
      alert("Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại!");
    }
  };

  const filteredBookings =
    report?.bookings?.filter((booking) => {
      if (statusFilter === "ALL") return true;
      return booking.bookingStatus?.toUpperCase() === statusFilter;
    }) || [];

  // Logic nhóm dữ liệu theo Sân (Court)
  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredBookings.forEach((booking) => {
      const courtName =
        booking.slots && booking.slots.length > 0
          ? booking.slots[0].courtName
          : "Chưa phân sân";

      if (!groups[courtName]) {
        groups[courtName] = {
          courtName: courtName,
          bookings: [],
          totalCount: 0,
          totalCourtFee: 0,
          totalServiceFee: 0,
          totalRevenue: 0,
        };
      }

      const serviceFee =
        booking.extraServiceResponses?.reduce(
          (sum: number, svc: any) => sum + svc.price * svc.quantity,
          0,
        ) || 0;

      const grandTotal = booking.totalPrice || 0;
      const courtFee = grandTotal - serviceFee;

      groups[courtName].bookings.push({
        ...booking,
        calculatedCourtFee: courtFee,
        calculatedServiceFee: serviceFee,
        calculatedTotal: grandTotal,
      });

      groups[courtName].totalCount += 1;
      groups[courtName].totalCourtFee += courtFee;
      groups[courtName].totalServiceFee += serviceFee;
      groups[courtName].totalRevenue += grandTotal;
    });

    return Object.values(groups);
  }, [filteredBookings]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4 items-start">
      {/* CỘT TRÁI: SIDEBAR BỘ LỌC */}
      <div className="w-full lg:w-1/4 xl:w-1/5 bg-white rounded-lg shadow-sm border border-gray-100 p-4 lg:sticky lg:top-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Báo cáo doanh thu
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-1">
            <FilterIcon className="w-4 h-4" />
            <span className="text-sm">Bộ lọc</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Cơ sở (Sân bãi)
            </label>
            <select
              className="w-full p-2 border border-purple-200 rounded-md text-sm cursor-pointer focus:outline-none focus:border-purple-500 text-gray-700 bg-white"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              disabled={rentalAreas.length === 0}
            >
              {rentalAreas.length === 0 ? (
                <option value="">Đang tải...</option>
              ) : (
                rentalAreas.map((area) => (
                  <option key={area.rentalAreaId} value={area.rentalAreaId}>
                    {area.rentalAreaName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Trạng thái
            </label>
            <select
              className="w-full p-2 border border-purple-200 rounded-md text-sm cursor-pointer focus:outline-none focus:border-purple-500 text-gray-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Từ ngày</label>
            <input
              type="date"
              className="w-full p-2 border border-purple-200 rounded-md text-sm cursor-pointer focus:outline-none focus:border-purple-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Đến ngày
            </label>
            <input
              type="date"
              className="w-full p-2 border border-purple-200 rounded-md text-sm cursor-pointer focus:outline-none focus:border-purple-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          <button
            onClick={handleExport}
            disabled={!selectedAreaId || loading}
            className={`w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-colors shadow-sm
              ${
                !selectedAreaId || loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
          >
            <DownloadIcon className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: NỘI DUNG CHÍNH */}
      <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-40 bg-white rounded-lg border border-gray-100 shadow-sm text-purple-600 font-medium">
            Đang tải dữ liệu báo cáo...
          </div>
        ) : !report ? (
          <div className="flex justify-center items-center h-40 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-500">
            Không có dữ liệu
          </div>
        ) : (
          <>
            {/* TỔNG QUAN DOANH THU & SỐ LƯỢNG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-purple-800 font-medium">
                    Doanh thu (Đã thanh toán)
                  </p>
                  <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {report.bookings?.length || 0} lượt đặt
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {report.totalPaid?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-orange-800 font-medium">
                    Bán Hàng & Dịch Vụ
                  </p>
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {report.serviceItems?.length || 0} mục
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {report.totalServiceRevenue?.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>

            {/* DANH SÁCH GIAO DỊCH (DẠNG BẢNG MỚI) */}
            <div className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[500px] overflow-x-auto">
              <h3 className="text-base font-bold text-gray-800 mb-2">
                Danh sách giao dịch
              </h3>

              {groupedData.length === 0 ? (
                <div className="text-center p-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Không có giao dịch nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="border border-gray-200 rounded min-w-[800px]">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#bce6f8] text-gray-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold border-b border-gray-200 w-1/3">
                          Tên sân
                        </th>
                        <th className="py-3 px-4 font-semibold border-b border-gray-200 text-center">
                          SL hóa đơn
                        </th>
                        <th className="py-3 px-4 font-semibold border-b border-gray-200 text-right">
                          Tiền sân
                        </th>
                        <th className="py-3 px-4 font-semibold border-b border-gray-200 text-right">
                          Tiền dịch vụ
                        </th>
                        <th className="py-3 px-4 font-semibold border-b border-gray-200 text-right">
                          Doanh thu thuần
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {groupedData.map((group) => {
                        const isExpanded = expandedCourts.has(group.courtName);

                        return (
                          <React.Fragment key={group.courtName}>
                            {/* Dòng cha: Thông tin tổng của Sân */}
                            <tr
                              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => toggleCourt(group.courtName)}
                            >
                              <td className="py-3 px-4 flex items-center gap-2 font-bold text-gray-700">
                                {isExpanded ? (
                                  <MinusSquare className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <PlusSquare className="w-4 h-4 text-gray-500" />
                                )}
                                {group.courtName}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-600">
                                {group.totalCount}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                {group.totalCourtFee.toLocaleString("vi-VN")}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-700 font-medium">
                                {group.totalServiceFee.toLocaleString("vi-VN")}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-800">
                                {group.totalRevenue.toLocaleString("vi-VN")}
                              </td>
                            </tr>

                            {/* Dòng con: Chi tiết các hóa đơn của Sân đó */}
                            {isExpanded && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-0 border-b border-gray-200"
                                >
                                  <table className="w-full text-sm">
                                    <thead className="bg-[#d7f1d4] text-gray-700">
                                      <tr>
                                        <th className="py-2 px-6 font-semibold w-1/5">
                                          Mã giao dịch
                                        </th>
                                        <th className="py-2 px-4 font-semibold">
                                          Thời gian
                                        </th>
                                        <th className="py-2 px-4 font-semibold">
                                          Khách hàng
                                        </th>
                                        <th className="py-2 px-4 font-semibold text-right">
                                          Tiền sân
                                        </th>
                                        <th className="py-2 px-4 font-semibold text-right">
                                          Tiền dịch vụ
                                        </th>
                                        <th className="py-2 px-4 font-semibold text-right">
                                          Doanh thu
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      {group.bookings.map((booking: any) => (
                                        <tr
                                          key={booking.bookingId}
                                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                        >
                                          <td className="py-2 px-6 text-blue-600 font-medium text-xs">
                                            {booking.bookingId
                                              .substring(0, 8)
                                              .toUpperCase()}
                                          </td>
                                          <td className="py-2 px-4 text-gray-600 text-xs">
                                            {new Date(
                                              booking.startTime,
                                            ).toLocaleString("vi-VN", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </td>
                                          <td className="py-2 px-4 text-gray-700">
                                            {booking.userName || "Khách lẻ"}
                                          </td>
                                          <td className="py-2 px-4 text-right text-gray-600">
                                            {booking.calculatedCourtFee.toLocaleString(
                                              "vi-VN",
                                            )}
                                          </td>
                                          <td className="py-2 px-4 text-right text-gray-600">
                                            {booking.calculatedServiceFee.toLocaleString(
                                              "vi-VN",
                                            )}
                                          </td>
                                          <td className="py-2 px-4 text-right font-medium text-gray-800">
                                            {booking.calculatedTotal.toLocaleString(
                                              "vi-VN",
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EndOfDayReport;
