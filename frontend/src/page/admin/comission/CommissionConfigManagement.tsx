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
  Space,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
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

  // CREATE MODAL
  const [createOpen, setCreateOpen] = useState(false);
  const [createApplyType, setCreateApplyType] = useState<"ALL" | "CUSTOM">(
    "ALL",
  );
  const [createForm] = Form.useForm();

  // UPDATE MODAL
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateApplyType, setUpdateApplyType] = useState<"ALL" | "CUSTOM">(
    "ALL",
  );
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [updateForm] = Form.useForm();

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

  // ================= CREATE =================
  const openCreateModal = () => {
    setCreateApplyType("ALL");

    createForm.setFieldsValue({
      isDefault: true,
      rentalAreaId: null,
      rate: 0.1,
      minBookings: 0,
      maxBookings: null,
      note: "",
    });

    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateApplyType("ALL");
    createForm.resetFields();
  };

  const handleCreateSubmit = async (values: CommissionConfigDTO) => {
    try {
      setLoading(true);

      const payload: CommissionConfigDTO = {
        rentalAreaId: createApplyType === "ALL" ? null : values.rentalAreaId,
        minBookings: values.minBookings ?? null,
        maxBookings: values.maxBookings ?? null,
        rate: Number(values.rate),
        isDefault: createApplyType === "ALL",
        note: values.note,
      };

      await financeService.createCommissionConfig(payload);

      message.success("Tạo cấu hình hoa hồng thành công");
      closeCreateModal();
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tạo cấu hình");
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE =================
  const openUpdateModal = (record: any) => {
    setEditingRecord(record);

    const type = record.isDefault ? "ALL" : "CUSTOM";
    setUpdateApplyType(type);

    updateForm.setFieldsValue({
      isDefault: record.isDefault,
      rentalAreaId:
        record.rentalAreaId ?? record.rentalArea?.rentalAreaId ?? null,
      rate: Number(record.rate || 0),
      minBookings: record.minBookings ?? 0,
      maxBookings: record.maxBookings ?? null,
      note: record.note || "",
    });

    setUpdateOpen(true);
  };

  const closeUpdateModal = () => {
    setUpdateOpen(false);
    setEditingRecord(null);
    setUpdateApplyType("ALL");
    updateForm.resetFields();
  };

  const handleUpdateSubmit = async (values: CommissionConfigDTO) => {
    if (!editingRecord?.commissionConfigId) {
      message.error("Không tìm thấy ID cấu hình cần sửa");
      return;
    }

    try {
      setLoading(true);

      const payload: CommissionConfigDTO = {
        rentalAreaId: updateApplyType === "ALL" ? null : values.rentalAreaId,
        minBookings: values.minBookings ?? null,
        maxBookings: values.maxBookings ?? null,
        rate: Number(values.rate),
        isDefault: updateApplyType === "ALL",
        note: values.note,
      };

      await financeService.updateCommissionConfig(
        editingRecord.commissionConfigId,
        payload,
      );

      message.success("Cập nhật cấu hình hoa hồng thành công");
      closeUpdateModal();
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi cập nhật cấu hình");
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
    {
      title: "Thao tác",
      key: "action",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => openUpdateModal(record)}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Cấu hình hoa hồng
        </Title>

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

      {/* MODAL CREATE RIÊNG */}
      <Modal
        title="Thêm cấu hình hoa hồng"
        open={createOpen}
        onCancel={closeCreateModal}
        onOk={() => createForm.submit()}
        confirmLoading={loading}
        okText="Tạo mới"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{
            isDefault: true,
            rentalAreaId: null,
            rate: 0.1,
            minBookings: 0,
            maxBookings: null,
            note: "",
          }}
        >
          <Form.Item label="Phạm vi áp dụng" required>
            <Radio.Group
              value={createApplyType}
              onChange={(e) => {
                const value = e.target.value as "ALL" | "CUSTOM";
                setCreateApplyType(value);

                if (value === "ALL") {
                  createForm.setFieldsValue({
                    isDefault: true,
                    rentalAreaId: null,
                  });
                } else {
                  createForm.setFieldsValue({
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

          {createApplyType === "CUSTOM" && (
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

      {/* MODAL UPDATE RIÊNG */}
      <Modal
        title="Cập nhật cấu hình hoa hồng"
        open={updateOpen}
        onCancel={closeUpdateModal}
        onOk={() => updateForm.submit()}
        confirmLoading={loading}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateSubmit}>
          <Form.Item label="Phạm vi áp dụng" required>
            <Radio.Group
              value={updateApplyType}
              onChange={(e) => {
                const value = e.target.value as "ALL" | "CUSTOM";
                setUpdateApplyType(value);

                if (value === "ALL") {
                  updateForm.setFieldsValue({
                    isDefault: true,
                    rentalAreaId: null,
                  });
                } else {
                  updateForm.setFieldsValue({
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

          {updateApplyType === "CUSTOM" && (
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
