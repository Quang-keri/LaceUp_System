import React from "react";
import { Select, Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;

interface UserFilterProps {
  filters: {
    role: string | undefined;
    active: boolean | undefined;
  };
  onFilterChange: (key: string, value: any) => void;
  onCreate: () => void; // Thêm prop để mở Modal tạo mới
}

const UserFilter: React.FC<UserFilterProps> = ({
  filters,
  onFilterChange,
  onCreate,
}) => {
  return (
    <div className="mb-4 flex gap-4 flex-wrap items-center">
      <Select
        placeholder="Chọn vai trò"
        style={{ width: 200 }}
        allowClear
        onChange={(value) => onFilterChange("role", value)}
        value={filters.role}
      >
        <Option value="ADMIN">Quản trị viên (ADMIN)</Option>
        <Option value="OWNER">Chủ nhà (OWNER)</Option>
        <Option value="RENTER">Khách thuê (RENTER)</Option>
      </Select>

      <Select
        placeholder="Trạng thái"
        style={{ width: 200 }}
        onChange={(value) => onFilterChange("active", value)}
        value={filters.active}
      >
        <Option value={undefined}>Tất cả trạng thái</Option>
        <Option value={true}>Đang hoạt động</Option>
        <Option value={false}>Đã bị khóa</Option>
      </Select>

      <Search
        placeholder="Tìm theo tên, email, sđt..."
        allowClear
        enterButton="Tìm kiếm"
        size="middle"
        style={{ width: 300 }}
        onSearch={(value) => onFilterChange("keyword", value)}
      />

      {/* Nút Thêm mới đặt ngay sau nút Tìm kiếm */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        className="bg-green-600 border-green-600 hover:bg-green-700"
        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
      >
        Thêm mới
      </Button>
    </div>
  );
};

export default UserFilter;
