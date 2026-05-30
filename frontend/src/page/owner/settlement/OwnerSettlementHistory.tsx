import React, { useEffect, useState } from "react";
import { Table, Typography, Tag, message, Select, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { financeService } from "../../../service/financeService";
import rentalService from "../../../service/rental/rentalService";

const { Title } = Typography;

const formatMoney = (value?: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const OwnerSettlementHistory: React.FC = () => {
  const { rentalAreaId } = useParams<{ rentalAreaId?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [rentalAreas, setRentalAreas] = useState<any[]>([]);

  const selectedRentalAreaId = rentalAreaId;

  const fetchMyRentalAreas = async () => {
    try {
      setLoadingRentals(true);

      const res = await rentalService.getMyRentalAreas(1, 100);
      const rentals =
        res.result?.data|| res.result || [];

      setRentalAreas(rentals);

      if (!rentalAreaId && rentals.length > 0) {
        navigate(`/owner/settlements/${rentals[0].rentalAreaId}`, {
          replace: true,
        });
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải danh sách khu sân",
      );
    } finally {
      setLoadingRentals(false);
    }
  };

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const result = await financeService.getOwnerSettlements(id);
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
    fetchMyRentalAreas();
  }, []);

  useEffect(() => {
    if (rentalAreaId) {
      fetchData(rentalAreaId);
    }
  }, [rentalAreaId]);

  const handleChangeRentalArea = (id: string) => {
    navigate(`/owner/settlements/${id}`);
  };

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
      title: "Doanh nghiệp nhận",
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
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Lịch sử tiền nhận từ hệ thống
        </Title>

        <Select
          style={{ width: 320 }}
          placeholder="Chọn khu sân"
          loading={loadingRentals}
          value={selectedRentalAreaId}
          onChange={handleChangeRentalArea}
          options={rentalAreas.map((item) => ({
            value: item.rentalAreaId,
            label: item.rentalAreaName,
          }))}
        />
      </Space>

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
