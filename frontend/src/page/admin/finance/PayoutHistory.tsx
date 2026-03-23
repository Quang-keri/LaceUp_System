import React, { useState, useEffect } from "react";
import { Table, Typography, Button, message, Tag } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { financeService } from "../../../service/financeService";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const PayoutHistory: React.FC = () => {
  const { rentalAreaId } = useParams<{ rentalAreaId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    if (rentalAreaId) {
      fetchHistory(rentalAreaId);
    }
  }, [rentalAreaId]);

  const fetchHistory = async (id: string) => {
    try {
      setLoading(true);
      const result = await financeService.getPayoutHistory(id);
      setHistoryData(result);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Kỳ Đối Soát",
      key: "period",
      render: (_: any, record: any) => `Tháng ${record.month}/${record.year}`,
    },
    {
      title: "Ngày Thanh Toán",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Số Tiền Chuyển",
      dataIndex: "payoutAmount",
      key: "payoutAmount",
      render: (val: number) => (
        <strong style={{ color: "green" }}>{val?.toLocaleString()} đ</strong>
      ),
    },
    {
      title: "Mã Giao Dịch",
      dataIndex: "transactionReference",
      key: "transactionReference",
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Tag color={val === "COMPLETED" ? "success" : "warning"}>{val}</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/settlements")}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          Lịch sử thanh toán - Tòa nhà ID: {rentalAreaId}
        </Title>
      </div>

      <Table
        columns={columns}
        dataSource={historyData}
        rowKey="payoutId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default PayoutHistory;
