import React, { useEffect, useState } from "react";
import { Table, Typography, Tag, message } from "antd";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { financeService } from "../../../service/financeService";

const { Title } = Typography;

const formatMoney = (value?: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const OwnerSettlementHistory: React.FC = () => {
  const { rentalAreaId } = useParams<{ rentalAreaId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!rentalAreaId) return;

    try {
      setLoading(true);
      const result = await financeService.getOwnerSettlements(rentalAreaId);
      setData(result || []);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải lịch sử nhận tiền",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [rentalAreaId]);

  const columns = [
    {
      title: "Ngày đối soát",
      dataIndex: "settlementDate",
      key: "settlementDate",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY"),
    },
    {
      title: "Tổng thu",
      dataIndex: "grossAmount",
      key: "grossAmount",
      render: formatMoney,
    },
    {
      title: "Phí hệ thống",
      dataIndex: "commissionAmount",
      key: "commissionAmount",
      render: (val: number, record: any) => (
        <span>
          {formatMoney(val)}{" "}
          <Tag color="blue">
            {((record.commissionRate || 0) * 100).toFixed(1)}%
          </Tag>
        </span>
      ),
    },
    {
      title: "Owner thực nhận",
      dataIndex: "ownerAmount",
      key: "ownerAmount",
      render: (val: number) => (
        <strong style={{ color: "green" }}>{formatMoney(val)}</strong>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Tag color={val === "PAID" ? "success" : "warning"}>
          {val === "PAID" ? "Đã chuyển" : "Chờ chuyển"}
        </Tag>
      ),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "transferCode",
      key: "transferCode",
      render: (val: string) => val || "-",
    },
    {
      title: "Thời gian chuyển",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (val: string) =>
        val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
      <Title level={4}>Lịch sử tiền nhận từ hệ thống</Title>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="settlementId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default OwnerSettlementHistory;
