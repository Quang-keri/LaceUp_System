import React from "react";
import { Space, Input, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface Props {
  keyword: string;
  setKeyword: (val: string) => void;
  setStatusFilter: (val: string | undefined) => void;
  onSearch: () => void;
}

const RentalAreaFilter: React.FC<Props> = ({
  keyword,
  setKeyword,
  setStatusFilter,
  onSearch,
}) => {
  return (
    <Space style={{ marginBottom: 16, display: "flex", flexWrap: "wrap" }}>
      <Input
        placeholder="Tìm tên, địa chỉ..."
        prefix={<SearchOutlined />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 300 }}
      />
      <Select
        placeholder="Trạng thái"
        style={{ width: 150 }}
        allowClear
        onChange={(val) => setStatusFilter(val)}
      >
        <Select.Option value="PENDING">Chờ duyệt</Select.Option>
        <Select.Option value="VERIFIED">Đã duyệt</Select.Option>
        <Select.Option value="REJECTED">Từ chối</Select.Option>
      </Select>
      <Button
        type="primary"
        onClick={onSearch}
        style={{ background: "#9156F1", borderColor: "#9156F1" }}
      >
        Tìm kiếm
      </Button>
    </Space>
  );
};

export default RentalAreaFilter;
