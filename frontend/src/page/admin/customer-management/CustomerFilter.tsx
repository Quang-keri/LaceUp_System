import React from "react";
import { Input, Select, Card, Button } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

interface CustomerFilterProps {
  keyword: string;
  tierFilter?: string;
  scoreRange?: string;
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
}

const CustomerFilter: React.FC<CustomerFilterProps> = ({
  keyword,
  tierFilter,
  scoreRange,
  onFilterChange,
  onReset,
}) => {
  return (
    <Card className="shadow-sm border-gray-100 h-full">
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 font-medium">Tìm kiếm</div>
          <Input
            placeholder="Tìm tên hoặc SĐT..."
            value={keyword}
            onChange={(e) => onFilterChange("keyword", e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>

        <div>
          <div className="mb-2 font-medium">Hạng thành viên</div>
          <Select
            style={{ width: "100%" }}
            placeholder="Tất cả hạng"
            value={tierFilter}
            onChange={(val) => onFilterChange("tierFilter", val)}
            allowClear
          >
            <Option value="BRONZE">Đồng (BRONZE)</Option>
            <Option value="SILVER">Bạc (SILVER)</Option>
            <Option value="GOLD">Vàng (GOLD)</Option>
            <Option value="DIAMOND">Kim Cương (DIAMOND)</Option>
          </Select>
        </div>

        <div>
          <div className="mb-2 font-medium">Vùng điểm uy tín</div>
          <Select
            style={{ width: "100%" }}
            placeholder="Tất cả"
            value={scoreRange}
            onChange={(val) => onFilterChange("scoreRange", val)}
            allowClear
          >
            <Option value="90-100">Rất tốt (90 - 100)</Option>
            <Option value="70-89">Khá (70 - 89)</Option>
            <Option value="50-69">Trung bình (50 - 69)</Option>
            <Option value="30-49">Cảnh báo (30 - 49)</Option>
            <Option value="0-29">Blacklist (Dưới 30)</Option>
          </Select>
        </div>

        <Button icon={<ReloadOutlined />} onClick={onReset} block>
          Làm mới
        </Button>
      </div>
    </Card>
  );
};

export default CustomerFilter;
