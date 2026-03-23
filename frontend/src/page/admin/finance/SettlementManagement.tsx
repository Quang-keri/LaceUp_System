import React, { useState, useEffect } from "react";
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
} from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { financeService } from "../../../service/financeService";
import { HistoryOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

const SettlementManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // State cho Modal Thanh toán
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmingRecord, setConfirmingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchSettlements = async (date: dayjs.Dayjs) => {
    try {
      setLoading(true);
      const month = date.month() + 1;
      const year = date.year();
      const result = await financeService.getMonthlySettlements(month, year);
      setData(result);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi khi tải dữ liệu đối soát",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements(selectedDate);
  }, [selectedDate]);

  // Xử lý mở Modal
  const handleOpenModal = (record: any) => {
    setConfirmingRecord(record);
    setIsModalVisible(true);
  };

  // Xử lý submit Form xác nhận thanh toán
  const handleConfirmPayout = async (values: any) => {
    try {
      setLoading(true);
      await financeService.confirmPayout({
        rentalAreaId: confirmingRecord.rentalAreaId,
        month: selectedDate.month() + 1,
        year: selectedDate.year(),
        transactionReference: values.transactionReference,
        note: values.note,
      });
      message.success("Đã xác nhận thanh toán thành công!");
      setIsModalVisible(false);
      form.resetFields();
      fetchSettlements(selectedDate); // Cập nhật lại bảng
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi khi xác nhận thanh toán",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tòa Nhà",
      dataIndex: "rentalAreaId", // Tạm dùng ID, nếu backend có rentalAreaName thì đổi thành 'rentalAreaName'
      key: "rentalAreaId",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Số Booking",
      dataIndex: "totalBookingsPaid",
      key: "totalBookingsPaid",
    },
    {
      title: "Tổng Thu (VND)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (val: number) => val?.toLocaleString() + " đ",
    },
    {
      title: "Phí Admin",
      dataIndex: "commissionAmount",
      key: "commissionAmount",
      render: (val: number, record: any) => (
        <span>
          {val?.toLocaleString()} đ{" "}
          <Tag color="blue">{(record.commissionRate * 100).toFixed(1)}%</Tag>
        </span>
      ),
    },
    {
      title: "Thực Trả Chủ Nhà",
      dataIndex: "payoutToOwner",
      key: "payoutToOwner",
      render: (val: number) => (
        <strong style={{ color: "green" }}>{val?.toLocaleString()} đ</strong>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleOpenModal(record)}
            disabled={record.payoutToOwner <= 0} // Vô hiệu hóa nếu không có tiền cần trả
          >
            Thanh Toán
          </Button>
          <Link to={`/admin/settlements/${record.rentalAreaId}/history`}>
            <Button icon={<HistoryOutlined />}>Lịch sử</Button>
          </Link>
        </div>
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
        <Title level={4}>Đối soát & Thanh toán Chủ nhà</Title>
        <DatePicker
          picker="month"
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          format="MM/YYYY"
          allowClear={false}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="rentalAreaId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Xác nhận Thanh toán */}
      <Modal
        title={`Xác nhận thanh toán tháng ${selectedDate.format("MM/YYYY")}`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Xác nhận đã chuyển khoản"
        cancelText="Hủy"
      >
        <p>
          Bạn đang xác nhận đã chuyển khoản{" "}
          <strong>{confirmingRecord?.payoutToOwner?.toLocaleString()} đ</strong>{" "}
          cho chủ tòa nhà.
        </p>
        <Form form={form} layout="vertical" onFinish={handleConfirmPayout}>
          <Form.Item
            label="Mã giao dịch ngân hàng (Bắt buộc)"
            name="transactionReference"
            rules={[{ required: true, message: "Vui lòng nhập mã giao dịch!" }]}
          >
            <Input placeholder="VD: MBBANK-123456789" />
          </Form.Item>
          <Form.Item label="Ghi chú thêm" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettlementManagement;
