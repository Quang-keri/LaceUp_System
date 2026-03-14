import { Card, Row, Col, Select } from "antd";
import type { RentalAreaResponse } from "../../../types/rental";

interface Props {
  buildings: RentalAreaResponse[];
  selectedBuildingId: string | null;
  filterStatus?: string;
  onBuildingChange: (id: string) => void;
  onStatusChange: (status?: string) => void;
}

export default function RentalAreaFilter({
  buildings,
  selectedBuildingId,
  filterStatus,
  onBuildingChange,
  onStatusChange,
}: Props) {
  return (
    <Card title="Lọc dữ liệu" size="small" style={{ marginBottom: 20 }}>
      <Row gutter={16}>
        <Col span={12}>
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

        <Col span={12}>
          <Select
            placeholder="Lọc trạng thái"
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
      </Row>
    </Card>
  );
}