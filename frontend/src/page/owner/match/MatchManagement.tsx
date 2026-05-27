import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Space, Button, Typography, message, Tooltip } from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  PlusOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import matchService from "../../../service/match/matchService.ts";
import type { MatchResponse } from "../../../types/match.ts";
import dayjs from "dayjs";
import MatchDetailModal from "./MatchDetailModal.tsx";
import CreateMatchModal from "./CreateMatchModal.tsx";
import MatchFilter from "./MatchFilter.tsx";

const { Title } = Typography;

const MatchManagement: React.FC = () => {
  const [data, setData] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(
    null,
  );
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    size: 10,
    status: undefined as string | undefined,
    category: undefined as string | undefined,
    keyword: "",
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await matchService.getOwnerMatches(
        params.page,
        params.size,
        params.status,
        params.category,
        params.keyword,
        params.startDate,
        params.endDate,
      );

      if (res.code === 200) {
        setData(res.result.data);
        setTotalElements(res.result.totalElements);
      }
    } catch (error) {
      console.error("Lỗi fetch matches:", error);
      message.error("Không thể tải danh sách trận đấu của bạn");
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleViewDetail = async (matchId: string) => {
    try {
      const res = await matchService.getMatchDetail(matchId);
      if (res.code === 200) {
        setSelectedMatch(res.result);
        setIsModalVisible(true);
      }
    } catch (error) {
      message.error("Không thể lấy thông tin chi tiết");
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleTableChange = (pagination: any) => {
    setParams({
      ...params,
      page: pagination.current,
      size: pagination.pageSize,
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setParams({ ...params, [key]: value, page: 1 });
  };

  const handleDateRangeChange = (dates: any) => {
    setParams({
      ...params,
      startDate: dates ? dates[0]?.startOf("day").toISOString() : undefined,
      endDate: dates ? dates[1]?.endOf("day").toISOString() : undefined,
      page: 1,
    });
  };

  const columns: ColumnsType<MatchResponse> = [
    {
      title: "Tên trận / Sân",
      key: "courtName",
      render: (record: MatchResponse) => (
        <div>
          <div className="font-bold text-blue-600">
            {record.title || "Trận vãng lai"}
          </div>
          <div className="text-xs text-gray-400">{record.courtName}</div>
        </div>
      ),
    },
    {
      title: "Môn thi đấu",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (cat) => <Tag color="blue">{cat || "N/A"}</Tag>,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (record: MatchResponse) => (
        <div className="text-xs">
          <div>
            <CalendarOutlined /> {dayjs(record.startTime).format("DD/MM/YYYY")}
          </div>
          <div className="text-gray-500">
            {dayjs(record.startTime).format("HH:mm")} -{" "}
            {dayjs(record.endTime).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (record: MatchResponse) => {
        let color = "default";
        if (record.status === "OPEN") color = "processing";
        if (record.status === "CONFIRMED" || record.status === "READY")
          color = "success";
        if (record.status === "FULL") color = "warning";
        if (record.status === "CANCELLED") color = "error";
        if (record.status === "COMPLETED") color = "default";

        // Kiểm tra xem trận đấu có báo cáo chưa xử lý không
        const hasPendingReport = record.reports?.some(
          (r: any) => r.status === "PENDING",
        );

        return (
          <Space direction="vertical" size={2}>
            <Tag color={color} className="m-0">
              {record.status}
            </Tag>
            {hasPendingReport && (
              <Tooltip title="Trận đấu có báo cáo đang chờ bạn xử lý!">
                <Tag
                  color="red"
                  icon={<AlertOutlined />}
                  className="m-0 font-bold border-red-300"
                >
                  CÓ BÁO CÁO
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record.matchId)}
            // Nếu có báo cáo thì highlight nút Chi tiết lên
            type={
              record.reports?.some((r: any) => r.status === "PENDING")
                ? "primary"
                : "default"
            }
            danger={record.reports?.some((r: any) => r.status === "PENDING")}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="!mb-0">
            Quản lý Trận đấu Vãng lai
          </Title>
          <Typography.Text type="secondary">
            Quản lý, theo dõi các kèo ghép sân cộng đồng và xử lý tranh chấp
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchMatches()}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Tạo Trận Đấu
          </Button>
        </Space>
      </div>

      <MatchFilter
        onFilterChange={handleFilterChange}
        onDateRangeChange={handleDateRangeChange}
      />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="matchId"
        loading={loading}
        pagination={{
          current: params.page,
          pageSize: params.size,
          total: totalElements,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total) => `Tổng cộng ${total} trận`,
        }}
        onChange={handleTableChange}
        className="shadow-sm border rounded-lg"
      />

      <MatchDetailModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        match={selectedMatch}
        onSuccess={() => fetchMatches()}
      />

      <CreateMatchModal
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onSuccess={() => {
          setIsCreateModalVisible(false);
          if (params.page === 1) {
            fetchMatches();
          } else {
            setParams({ ...params, page: 1 });
          }
        }}
      />
    </div>
  );
};

export default MatchManagement;
