import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
} from "antd";
import adminReviewService from "../../../service/admin/reviewAdminService";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

export default function ReviewsManagement() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // State quản lý form search
  const [tempFilters, setTempFilters] = useState<any>({});
  const [timeRangeType, setTimeRangeType] = useState<string>("all");
  const [customDates, setCustomDates] = useState<any>(null);

  // State gửi xuống API
  const [filters, setFilters] = useState<any>({});

  const fetchStats = async () => {
    try {
      const res = await adminReviewService.getStats();
      if (res.data && res.data.result) setStats(res.data.result);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await adminReviewService.list({
        page: page - 1,
        size: pageSize,
        ...filters,
      });
      if (res.data && res.data.result) {
        const pr = res.data.result;
        setData(pr.data || []);
        setTotal(pr.totalElements || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchList();
  }, [page, filters]);

  const handleSearch = () => {
    let startDate = undefined;
    let endDate = undefined;
    const formatStr = "YYYY-MM-DDTHH:mm:ss";

    switch (timeRangeType) {
      case "today":
        startDate = dayjs().startOf("day").format(formatStr);
        endDate = dayjs().endOf("day").format(formatStr);
        break;
      case "yesterday":
        startDate = dayjs().subtract(1, "day").startOf("day").format(formatStr);
        endDate = dayjs().subtract(1, "day").endOf("day").format(formatStr);
        break;
      case "last7days":
        startDate = dayjs().subtract(7, "day").startOf("day").format(formatStr);
        endDate = dayjs().endOf("day").format(formatStr);
        break;
      case "lastMonth":
        startDate = dayjs()
          .subtract(1, "month")
          .startOf("month")
          .format(formatStr);
        endDate = dayjs().subtract(1, "month").endOf("month").format(formatStr);
        break;
      case "last3months":
        startDate = dayjs()
          .subtract(3, "month")
          .startOf("day")
          .format(formatStr);
        endDate = dayjs().endOf("day").format(formatStr);
        break;
      case "last6months":
        startDate = dayjs()
          .subtract(6, "month")
          .startOf("day")
          .format(formatStr);
        endDate = dayjs().endOf("day").format(formatStr);
        break;
      case "thisYear":
        startDate = dayjs().startOf("year").format(formatStr);
        endDate = dayjs().endOf("day").format(formatStr);
        break;
      case "lastYear":
        startDate = dayjs()
          .subtract(1, "year")
          .startOf("year")
          .format(formatStr);
        endDate = dayjs().subtract(1, "year").endOf("year").format(formatStr);
        break;
      case "custom":
        if (customDates && customDates.length === 2) {
          startDate = customDates[0].format(formatStr);
          endDate = customDates[1].format(formatStr);
        }
        break;
      default:
        break;
    }

    setFilters({
      ...tempFilters,
      startDate,
      endDate,
    });
    setPage(1);
  };

  // Cập nhật lại các Cột hiển thị trong Bảng
  const columns: ColumnsType<any> = [
    { title: "ID", dataIndex: "reviewId", key: "reviewId", width: 60 },
    { title: "Người dùng", dataIndex: "userName", key: "userName", width: 120 },
    {
      title: "Tên tòa nhà",
      dataIndex: "rentalName",
      key: "rentalName",
      width: 150,
    },
    { title: "Địa chỉ", dataIndex: "address", key: "address", width: 200 },
    { title: "Rating", dataIndex: "rating", key: "rating", width: 80 },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
      render: (t) => <div className="max-w-[300px] truncate">{t}</div>,
    },
    {
      title: "Ngày Đánh giá",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : ""),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý Đánh giá</h2>

      {/* Cards thống kê (Giữ nguyên) */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card>
            <Statistic title="Tổng đánh giá" value={stats.totalReviews || 0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Trung bình"
              value={stats.averageRating || 0}
              suffix="/5"
            />
          </Card>
        </Col>

        <Col span={4}>
          <Card>
            <Statistic
              title="Tiêu cực %"
              value={
                (stats.negativeRate || 0).toFixed
                  ? (stats.negativeRate || 0).toFixed(1)
                  : stats.negativeRate || 0
              }
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ Lọc (Filters) */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            placeholder="Đánh giá (Sao)"
            style={{ width: 140 }}
            onChange={(v) => setTempFilters((s: any) => ({ ...s, rating: v }))}
            allowClear
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Select.Option key={star} value={star}>
                {star} Sao
              </Select.Option>
            ))}
          </Select>

          {/* Các input mới được thiết kế trực quan hơn */}
          <Input
            placeholder="Tên người dùng"
            style={{ width: 150 }}
            onChange={(e) =>
              setTempFilters((s: any) => ({ ...s, userName: e.target.value }))
            }
            allowClear
          />
          <Input
            placeholder="Tên tòa nhà"
            style={{ width: 150 }}
            onChange={(e) =>
              setTempFilters((s: any) => ({ ...s, rentalName: e.target.value }))
            }
            allowClear
          />
          <Input
            placeholder="Địa chỉ"
            style={{ width: 200 }}
            onChange={(e) =>
              setTempFilters((s: any) => ({ ...s, address: e.target.value }))
            }
            allowClear
          />

          <Select
            value={timeRangeType}
            style={{ width: 160 }}
            onChange={(value) => setTimeRangeType(value)}
          >
            <Select.Option value="all">Tất cả thời gian</Select.Option>
            <Select.Option value="today">Hôm nay</Select.Option>
            <Select.Option value="yesterday">Hôm qua</Select.Option>
            <Select.Option value="last7days">7 ngày trước</Select.Option>
            <Select.Option value="lastMonth">Tháng trước</Select.Option>
            <Select.Option value="last3months">3 tháng trước</Select.Option>
            <Select.Option value="last6months">6 tháng trước</Select.Option>
            <Select.Option value="thisYear">Năm nay</Select.Option>
            <Select.Option value="lastYear">Năm trước</Select.Option>
            <Select.Option value="custom">Tùy chỉnh</Select.Option>
          </Select>

          {timeRangeType === "custom" && (
            <DatePicker.RangePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              onChange={(dates) => setCustomDates(dates)}
            />
          )}

          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => r.reviewId}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
