import React, { useState } from "react";
import { Card, Row, Col, Input, Button, DatePicker, Space } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface CategoryFilterProps {
  onFilterChange: (filters: any) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    keyword: "",
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  });

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      keyword: e.target.value,
    }));
  };

  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    if (!dates || !dates[0] || !dates[1]) {
      setFilters((prev) => ({
        ...prev,
        from: undefined,
        to: undefined,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        from: dayjs(dates[0]).toISOString(),
        to: dayjs(dates[1]).toISOString(),
      }));
    }
  };

  const handleSearch = () => {
    onFilterChange(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      keyword: "",
      from: undefined,
      to: undefined,
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <Card className="shadow-sm">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Input
            placeholder="Tìm kiếm theo tên loại sân..."
            value={filters.keyword}
            onChange={handleKeywordChange}
            size="large"
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            onChange={handleDateChange}
            placeholder={["Từ ngày", "Đến ngày"]}
            format="DD/MM/YYYY"
            size="large"
          />
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Space style={{ width: "100%" }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              block
              size="large"
            >
              Tìm kiếm
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              size="large"
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default CategoryFilter;
