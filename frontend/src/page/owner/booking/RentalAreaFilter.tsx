import {
  Card,
  Select,
  Input,
  DatePicker,
  Button,
  Space,
  Typography,
} from "antd";
import { ReloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import type { RentalAreaResponse } from "../../../types/rental";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface Props {
  buildings: RentalAreaResponse[];
  selectedBuildingId: string | null;
  filterStatus?: string;
  filterType?: string;
  dateRange: [string, string] | null;
  loading?: boolean;
  onBuildingChange: (id: string) => void;
  onStatusChange: (status?: string) => void;
  onTypeChange: (type?: string) => void;
  onSearch: (value: string) => void;
  onDateChange: (range: [string, string] | null) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function RentalAreaFilter({
  buildings,
  selectedBuildingId,
  filterStatus,
  filterType,
  dateRange,
  loading,
  onBuildingChange,
  onStatusChange,
  onTypeChange,
  onSearch,
  onDateChange,
  onRefresh,
  onExport,
}: Props) {
  return (
    <Card title="Bộ lọc & Thao tác" size="small">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Cơ sở
          </Text>
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
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Thời gian
          </Text>
          <RangePicker
            style={{ width: "100%" }}
            placeholder={["Từ ngày", "Đến ngày"]}
            value={
              dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null
            }
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onDateChange([
                  dates[0].startOf("day").format("YYYY-MM-DDTHH:mm:ss"),
                  dates[1].endOf("day").format("YYYY-MM-DDTHH:mm:ss"),
                ]);
              } else {
                onDateChange(null);
              }
            }}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Loại đặt sân
          </Text>
          <Select
            placeholder="Tất cả loại"
            allowClear
            value={filterType}
            onChange={onTypeChange}
            style={{ width: "100%" }}
            options={[
              { label: "Đặt sân thường (Private)", value: "PRIVATE" },
              { label: "Kèo Vãng lai (Shared)", value: "SHARED" },
              { label: "Trận đấu (Match)", value: "MATCH" },
            ]}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Trạng thái
          </Text>
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            value={filterStatus}
            onChange={onStatusChange}
            style={{ width: "100%" }}
            options={[
              { label: "Đã đặt", value: "BOOKED" },
              { label: "Đang sử dụng", value: "USING" },
              { label: "Hoàn thành", value: "COMPLETED" },
              { label: "Hủy", value: "CANCELLED" },
            ]}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Tìm kiếm
          </Text>
          <Input.Search
            placeholder="Tên khách, SĐT..."
            allowClear
            onSearch={onSearch}
            enterButton
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              block
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={onExport}
              block
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
              }}
            >
              Xuất Excel
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
