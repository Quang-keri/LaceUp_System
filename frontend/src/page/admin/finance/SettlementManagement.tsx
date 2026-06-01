import React, { useEffect, useState } from "react";
import {
  Table,
  DatePicker,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
} from "antd";
import dayjs from "dayjs";
import { financeService } from "../../../service/financeService";
import { CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

const formatMoney = (value?: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const SettlementManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [form] = Form.useForm();

  const dateString = selectedDate.format("YYYY-MM-DD");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settlements, summaryData] = await Promise.all([
        financeService.getSettlementsByDate(dateString),
        financeService.getSettlementSummary(dateString),
      ]);

      setData(settlements || []);
      setSummary(summaryData || {});
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tải đối soát");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateString]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await financeService.generateDailySettlements(dateString);
      message.success("Đã tạo đối soát trong ngày");
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tạo đối soát");
    } finally {
      setLoading(false);
    }
  };

  const openPaidModal = (record: any) => {
    setSelectedSettlement(record);
    setIsModalOpen(true);
  };

  const handleConfirmPaid = async (values: any) => {
    try {
      setLoading(true);
      await financeService.markSettlementAsPaid(
        selectedSettlement.settlementId,
        {
          transferCode: values.transferCode,
          note: values.note,
        },
      );

      message.success("Đã xác nhận chuyển khoản");
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi xác nhận");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tòa nhà",
      dataIndex: "rentalAreaName",
      key: "rentalAreaName",
      fixed: "left" as const,
      render: (text: string, record: any) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.rentalAreaId}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "settlementDate",
      key: "settlementDate",
      render: (val: string) => dayjs(val).format("DD/MM/YYYY"),
    },
    {
      title: "Doanh thu booking",
      dataIndex: "bookingRevenue",
      key: "bookingRevenue",
      render: (val: number) => <strong>{formatMoney(val)}</strong>,
    },
    {
      title: "User trả lần đầu",
      dataIndex: "initialPaidAmount",
      key: "initialPaidAmount",
      render: formatMoney,
    },
    {
      title: "Dịch vụ tại sân",
      dataIndex: "extraServiceAmount",
      key: "extraServiceAmount",
      render: (val: number) => (
        <span style={{ color: "#8c8c8c" }}>{formatMoney(val)}</span>
      ),
    },
    {
      title: "Hoa hồng admin",
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
      title: "Cần trả owner",
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
        <Tag color={val === "PAID" ? "success" : "warning"}>{val}</Tag>
      ),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "transferCode",
      key: "transferCode",
      render: (val: string) => val || "-",
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          disabled={record.status === "PAID"}
          onClick={() => openPaidModal(record)}
        >
          Đã chuyển khoản
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4}>Đối soát & thanh toán owner theo ngày</Title>

        <div style={{ display: "flex", gap: 8 }}>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            format="DD/MM/YYYY"
            allowClear={false}
          />

          <Button icon={<ReloadOutlined />} onClick={handleGenerate}>
            Tạo đối soát
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="Doanh thu booking"
              value={formatMoney(summary?.totalBookingRevenue)}
            />
          </Card>
        </Col>

        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="User trả lần đầu"
              value={formatMoney(summary?.totalInitialPaidAmount)}
            />
          </Card>
        </Col>

        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="Dịch vụ tại sân"
              value={formatMoney(summary?.totalExtraServiceAmount)}
            />
          </Card>
        </Col>

        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="Hoa hồng admin"
              value={formatMoney(summary?.totalCommissionAmount)}
            />
          </Card>
        </Col>

        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="Cần trả owner"
              value={formatMoney(summary?.totalOwnerAmount)}
            />
          </Card>
        </Col>

        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic
              title="Còn pending"
              value={formatMoney(summary?.totalPendingAmount)}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="settlementId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
      />

      <Modal
        title="Xác nhận đã chuyển khoản"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>
          Số tiền cần chuyển:{" "}
          <strong>{formatMoney(selectedSettlement?.ownerAmount)}</strong>
        </p>

        <Form form={form} layout="vertical" onFinish={handleConfirmPaid}>
          <Form.Item
            label="Mã giao dịch ngân hàng"
            name="transferCode"
            rules={[{ required: true, message: "Vui lòng nhập mã giao dịch" }]}
          >
            <Input placeholder="VD: MBBANK-123456789" />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú nếu có" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettlementManagement;
