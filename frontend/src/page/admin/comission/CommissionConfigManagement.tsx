import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  financeService,
  type CommissionConfigDTO,
  type RentalAreaOptionResponse,
} from "../../../service/financeService";

const { Title } = Typography;

const CommissionConfigManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [rentalAreas, setRentalAreas] = useState<RentalAreaOptionResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [applyType, setApplyType] = useState<"ALL" | "CUSTOM">("ALL");

  const [form] = Form.useForm();

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const result = await financeService.getCommissionConfigs();
      setData(result || []);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải cấu hình hoa hồng",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalAreas = async () => {
    try {
      const result = await financeService.getRentalAreaOptions();
      setRentalAreas(result || []);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải danh sách khu sân",
      );
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchRentalAreas();
  }, []);

  const openCreateModal = () => {
    setApplyType("ALL");
    form.setFieldsValue({
      isDefault: true,
      rentalAreaId: null,
      rate: 0.1,
      minBookings: 0,
      maxBookings: null,
      note: "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setApplyType("ALL");
    form.resetFields();
  };

  const handleSubmit = async (values: CommissionConfigDTO) => {
    try {
      setLoading(true);

      await financeService.createCommissionConfig({
        rentalAreaId: applyType === "ALL" ? null : values.rentalAreaId,
        minBookings: values.minBookings ?? null,
        maxBookings: values.maxBookings ?? null,
        rate: Number(values.rate),
        isDefault: applyType === "ALL",
        note: values.note,
      });

      message.success("Tạo cấu hình hoa hồng thành công");
      closeModal();
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tạo cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Loại cấu hình",
      key: "type",
      render: (_: any, record: any) =>
        record.isDefault ? (
          <Tag color="green">Mặc định toàn hệ thống</Tag>
        ) : (
          <Tag color="blue">Riêng khu sân</Tag>
        ),
    },
    {
      title: "Khu sân / tòa nhà",
      key: "rentalArea",
      render: (_: any, record: any) =>
        record.isDefault
          ? "Tất cả khu sân"
          : record.rentalArea?.rentalAreaName ||
            record.rentalAreaName ||
            record.rentalArea?.rentalAreaId ||
            record.rentalAreaId ||
            "-",
    },
    {
      title: "Khoảng booking",
      key: "bookings",
      render: (_: any, record: any) =>
        `${record.minBookings ?? 0} - ${record.maxBookings ?? "∞"}`,
    },
    {
      title: "Tỷ lệ hoa hồng",
      dataIndex: "rate",
      key: "rate",
      render: (val: number) => (
        <strong>{(Number(val || 0) * 100).toFixed(1)}%</strong>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (val: boolean) =>
        val === false ? (
          <Tag>Tắt</Tag>
        ) : (
          <Tag color="success">Đang áp dụng</Tag>
        ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (val: string) => val || "-",
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
        <Title level={4}>Cấu hình hoa hồng</Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm cấu hình
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="commissionConfigId"
        loading={loading}
      />

      <Modal
        title="Thêm cấu hình hoa hồng"
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isDefault: true,
            rentalAreaId: null,
            rate: 0.1,
            minBookings: 0,
            maxBookings: null,
          }}
        >
          <Form.Item label="Phạm vi áp dụng" required>
            <Radio.Group
              value={applyType}
              onChange={(e) => {
                const value = e.target.value as "ALL" | "CUSTOM";
                setApplyType(value);

                if (value === "ALL") {
                  form.setFieldsValue({
                    isDefault: true,
                    rentalAreaId: null,
                  });
                } else {
                  form.setFieldsValue({
                    isDefault: false,
                  });
                }
              }}
            >
              <Radio value="ALL">Áp dụng toàn hệ thống</Radio>
              <Radio value="CUSTOM">Cấu hình riêng cho khu sân</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="isDefault" hidden>
            <Input />
          </Form.Item>

          {applyType === "CUSTOM" && (
            <Form.Item
              label="Chọn khu sân / tòa nhà"
              name="rentalAreaId"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn khu sân cần cấu hình riêng",
                },
              ]}
            >
              <Select
                placeholder="Chọn khu sân"
                showSearch
                optionFilterProp="label"
                options={rentalAreas.map((area) => ({
                  label: `${area.rentalAreaName}${
                    area.addressText ? ` - ${area.addressText}` : ""
                  }`,
                  value: area.rentalAreaId,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Số booking tối thiểu" name="minBookings">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Số booking tối đa" name="maxBookings">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Tỷ lệ hoa hồng"
            name="rate"
            rules={[
              { required: true, message: "Vui lòng nhập tỷ lệ hoa hồng" },
            ]}
            tooltip="Nhập 0.1 = 10%, 0.15 = 15%"
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommissionConfigManagement;
