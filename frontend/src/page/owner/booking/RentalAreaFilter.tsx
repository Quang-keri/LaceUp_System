import { Card, Row, Col, Select, Input } from "antd";
import type { RentalAreaResponse } from "../../../types/rental";

interface Props {
  buildings: RentalAreaResponse[];
  selectedBuildingId: string | null;
  filterStatus?: string;
  onBuildingChange: (id: string) => void;
  onStatusChange: (status?: string) => void;
  onSearch: (value: string) => void;
}

export default function RentalAreaFilter({
  buildings,
  selectedBuildingId,
  filterStatus,
  onBuildingChange,
  onStatusChange,
  onSearch,
}: Props) {
  return (
    <Card title="Bộ lọc tìm kiếm" size="small" style={{ marginBottom: 5 }}>
      <Row gutter={16}>
        <Col span={8}>
          <Select
            placeholder="Chọn tòa nhà"
            value={selectedBuildingId}
            onChange={onBuildingChange}
            style={{ width: "100%" }}
            options={buildings.map((b) => ({
              label: b.rentalAreaName,
              value: b.rentalAreaId,
            }))}
          />
        </Col>
        <Col span={8}>
          <Select
            placeholder="Trạng thái"
            allowClear
            value={filterStatus}
            onChange={onStatusChange}
            style={{ width: "100%" }}
            options={[
              { label: "Chờ xác nhận", value: "PENDING" },
              { label: "Đã xác nhận", value: "CONFIRMED" },
              { label: "Hoàn thành", value: "COMPLETED" },
              { label: "Hủy", value: "CANCELLED" },
            ]}
          />
        </Col>
        <Col span={8}>
          <Input.Search
            placeholder="Tìm tên khách, SĐT..."
            allowClear
            onSearch={onSearch}
            enterButton
          />
        </Col>
      </Row>
    </Card>
  );
}
