import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Typography,
  InputNumber,
  Switch,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  financeService,
  type CommissionConfigDTO,
} from "../../../service/financeService";

const { Title } = Typography;

const CommissionConfigManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionConfigDTO[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [form] = Form.useForm();

  // Load danh sách cấu hình
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const result = await financeService.getCommissionConfigs();
      setData(result);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi khi tải dữ liệu cấu hình",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Mở modal tạo mới
  const handleAddNew = () => {
    form.resetFields();
    form.setFieldsValue({ isDefault: true, minBookings: 0 }); // Giá trị mặc định
    setIsModalVisible(true);
  };

  // Submit Form
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Chuyển đổi Rate từ % (UI) sang thập phân (Backend) - VD: 15 -> 0.15
      const payload: CommissionConfigDTO = {
        ...values,
        rate: values.ratePercentage / 100,
      };

      await financeService.createCommissionConfig(payload);
      message.success("Đã lưu cấu hình hoa hồng thành công!");
      setIsModalVisible(false);
      fetchConfigs(); // Refresh bảng
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi lưu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Phạm vi Booking",
      key: "range",
      render: (_: any, record: CommissionConfigDTO) => {
        if (!record.maxBookings) {
          return `Từ ${record.minBookings} booking trở lên`;
        }
        return `Từ ${record.minBookings} đến ${record.maxBookings} booking`;
      },
    },
    {
      title: "Tỉ lệ Hoa hồng",
      dataIndex: "rate",
      key: "rate",
      render: (val: number) => (
        <Tag color="magenta" style={{ fontSize: "14px", padding: "4px 8px" }}>
          {(val * 100).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: "Phạm vi áp dụng",
      key: "scope",
      render: (_: any, record: CommissionConfigDTO) =>
        record.rentalAreaId ? (
          <Tag color="blue">Tòa nhà: {record.rentalAreaId}</Tag>
        ) : (
          <Tag color="green">Mặc định toàn hệ thống</Tag>
        ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
    },
    {
      title: "Trạng thái",
      dataIndex: "isDefault",
      key: "isDefault",
      render: (val: boolean) => val && <Tag color="volcano">Đang áp dụng</Tag>,
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
        <Title level={4}>Cấu hình Tỉ lệ Hoa hồng</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
          Thêm cấu hình mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="commissionConfigId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Thêm/Sửa Cấu hình */}
      <Modal
        title="Thiết lập cấu hình Hoa hồng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space style={{ display: "flex", marginBottom: 8 }} align="baseline">
            <Form.Item
              label="Số booking tối thiểu"
              name="minBookings"
              rules={[
                { required: true, message: "Vui lòng nhập số tối thiểu!" },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="VD: 0"
              />
            </Form.Item>

            <span style={{ padding: "0 8px" }}>đến</span>

            <Form.Item
              label="Số booking tối đa"
              name="maxBookings"
              tooltip="Bỏ trống nếu muốn áp dụng cho tất cả booking vượt mức tối thiểu (VD: Từ 50 trở lên)"
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Không giới hạn"
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="Tỉ lệ phần trăm hoa hồng (%)"
            name="ratePercentage"
            rules={[{ required: true, message: "Vui lòng nhập tỉ lệ %!" }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              style={{ width: "100%" }}
              placeholder="VD: Nhập 15 cho 15%"
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            label="ID Tòa nhà áp dụng riêng (Tùy chọn)"
            name="rentalAreaId"
            tooltip="Nếu để trống, cấu hình này sẽ áp dụng mặc định cho toàn bộ hệ thống."
          >
            <Input placeholder="Nhập ID tòa nhà nếu muốn tạo chính sách riêng..." />
          </Form.Item>

          <Form.Item
            label="Đặt làm cấu hình đang áp dụng"
            name="isDefault"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item label="Ghi chú nội bộ" name="note">
            <Input.TextArea
              rows={2}
              placeholder="VD: Khuyến mãi mùa hè cho chủ nhà..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommissionConfigManagement;
