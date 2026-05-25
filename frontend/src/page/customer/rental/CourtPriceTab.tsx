import { Table } from "antd";
import dayjs from "dayjs";

export default function CourtPriceTab({ activeCourt }: { activeCourt: any }) {
  const priceColumns = [
    {
      title: "Ngày",
      dataIndex: "dateLabel",
      key: "dateLabel",
      className: "font-medium text-gray-700 bg-gray-50",
      align: "center" as const,
      onCell: (record: any) => ({ rowSpan: record.dateRowSpan }),
    },
    {
      title: "Thứ",
      dataIndex: "typeLabel",
      key: "typeLabel",
      className: "font-semibold text-gray-800 bg-gray-50",
      align: "center" as const,
      onCell: (record: any) => ({ rowSpan: record.typeRowSpan }),
    },
    {
      title: "Khung giờ",
      dataIndex: "time",
      key: "time",
      className: "font-medium text-gray-700",
      align: "center" as const,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      align: "center" as const,
      render: (val: number) => (
        <span className="text-[#ea580c] font-bold text-base">
          {val.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
  ];

  const getPriceData = (rules: any[]) => {
    if (!rules || rules.length === 0) return [];

    const mappedRules = rules.map((rule, index) => {
      const formatTime = (timeStr: string) => {
        if (!timeStr) return "";
        const [h, m] = String(timeStr).split(":");
        return m === "00" ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`;
      };

      let dateLabel = "Ngày thường";
      if (rule.startDate && rule.endDate) {
        dateLabel = `${dayjs(rule.startDate).format("DD/MM/YYYY")} - ${dayjs(
          rule.endDate,
        ).format("DD/MM/YYYY")}`;
      } else if (rule.specificDate) {
        dateLabel = dayjs(rule.specificDate).format("DD/MM/YYYY");
      }

      let typeLabel = "Tất cả";
      if (rule.dayType === "WEEKDAY") typeLabel = "T2 - T6";
      else if (rule.dayType === "WEEKEND") typeLabel = "T7 - CN";
      else if (!rule.dayType) {
        if (rule.priceType === "WEEKEND") typeLabel = "T7 - CN";
        else typeLabel = "T2 - T6";
      }

      return {
        ...rule,
        key: rule.courtPriceId || index,
        dateLabel,
        typeLabel,
        time: `${formatTime(rule.startTime)} - ${formatTime(rule.endTime)}`,
        price: rule.pricePerHour,
        dateRowSpan: 1,
        typeRowSpan: 1,
      };
    });

    mappedRules.sort((a, b) => {
      if (a.dateLabel !== b.dateLabel) {
        if (a.dateLabel === "Ngày thường") return 1;
        if (b.dateLabel === "Ngày thường") return -1;
        return a.dateLabel.localeCompare(b.dateLabel);
      }
      if (a.typeLabel !== b.typeLabel) {
        if (a.typeLabel === "T2 - T6") return -1;
        if (b.typeLabel === "T2 - T6") return 1;
        if (a.typeLabel === "T7 - CN") return -1;
        if (b.typeLabel === "T7 - CN") return 1;
        return a.typeLabel.localeCompare(b.typeLabel);
      }
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

    let currentDateKey: string | null = null;
    let dateStartIndex = 0;
    let currentTypeKey: string | null = null;
    let typeStartIndex = 0;

    for (let i = 0; i < mappedRules.length; i++) {
      const row = mappedRules[i];
      if (row.dateLabel === currentDateKey) {
        row.dateRowSpan = 0;
        mappedRules[dateStartIndex].dateRowSpan += 1;
      } else {
        currentDateKey = row.dateLabel;
        dateStartIndex = i;
        currentTypeKey = null;
      }

      const typeKey = `${row.dateLabel}_${row.typeLabel}`;
      if (typeKey === currentTypeKey) {
        row.typeRowSpan = 0;
        mappedRules[typeStartIndex].typeRowSpan += 1;
      } else {
        currentTypeKey = typeKey;
        typeStartIndex = i;
      }
    }
    return mappedRules;
  };

  const priceData = activeCourt ? getPriceData(activeCourt.priceRules) : [];

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <h3 className="text-xl font-bold text-gray-800 mb-6">
        <span className="bg-[#1677ff] text-white px-1.5 py-0.5 rounded-sm">
          Bảng giá
        </span>{" "}
        - <span className="text-[#ea580c]">{activeCourt?.courtName}</span>
      </h3>
      {priceData.length > 0 ? (
        <Table
          columns={priceColumns}
          dataSource={priceData}
          pagination={false}
          bordered
          size="middle"
          className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
        />
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 italic">
            Sân này hiện chưa có thông tin bảng giá chi tiết.
          </p>
        </div>
      )}
    </div>
  );
}
