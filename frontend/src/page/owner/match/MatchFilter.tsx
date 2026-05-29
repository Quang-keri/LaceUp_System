import React, { useContext } from "react";
import { Input, Select, DatePicker, Card } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import { CategoryContext } from "../../../context/CategoryContext";

const { RangePicker } = DatePicker;

interface MatchFilterProps {
  onFilterChange: (key: string, value: any) => void;
  onDateRangeChange: (dates: any) => void;
}

const MatchFilter: React.FC<MatchFilterProps> = ({
  onFilterChange,
  onDateRangeChange,
}) => {
  const { categories, loading } = useContext(CategoryContext);

  return (
    <Card className="shadow-sm border-gray-100 h-full">
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 font-medium">Tìm kiếm</div>
          <Input
            placeholder="Tìm theo tên sân..."
            prefix={<SearchOutlined />}
            onChange={(e) => onFilterChange("keyword", e.target.value)}
            allowClear
          />
        </div>

        <div>
          <div className="mb-2 font-medium">Trạng thái</div>
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            className="w-full"
            onChange={(val) => onFilterChange("status", val)}
            options={[
              { label: "Đang mở (OPEN)", value: "OPEN" },
              { label: "Đủ người (READY)", value: "READY" },
              { label: "Đang đá (PLAYING)", value: "PLAYING" },
              {
                label: "Chờ duyệt kết quả (WAITING)",
                value: "WAITING_RESULT_APPROVAL",
              },
              { label: "Đã hoàn thành (COMPLETED)", value: "COMPLETED" },
              { label: "Đang khiếu nại (DISPUTED)", value: "DISPUTED" },
              { label: "Đã hủy (CANCELLED)", value: "CANCELLED" },
              { label: "Đã hết hạn (EXPIRED)", value: "EXPIRED" },
            ]}
          />
        </div>

        <div>
          <div className="mb-2 font-medium">Môn thể thao</div>
          <Select
            placeholder="Tất cả môn"
            allowClear
            className="w-full"
            loading={loading}
            onChange={(val) => onFilterChange("category", val)}
            options={categories.map((c) => ({
              label: c.categoryName,
              value: c.categoryName,
            }))}
          />
        </div>

        <div>
          <div className="mb-2 font-medium">Khoảng thời gian</div>
          <RangePicker className="w-full" onChange={onDateRangeChange} />
        </div>
      </div>
    </Card>
  );
};

export default MatchFilter;
