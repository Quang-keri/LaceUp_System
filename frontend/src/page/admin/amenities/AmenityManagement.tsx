import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Spin,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import amenityAdminService, {
  type AmenityResponse,
} from "../../../service/admin/amenityAdminService";

export default function AmenityManagement() {
  const [amenities, setAmenities] = useState<AmenityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AmenityResponse | null>(
    null,
  );

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    setLoading(true);
    try {
      const res = await amenityAdminService.getAll();
      if (res.data && res.data.result) {
        setAmenities(res.data.result);
      }
    } catch (error) {
      message.error("Không thể tải danh sách tiện ích");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: AmenityResponse) => {
    if (record) {
      setEditingId(record.amenityId);
      form.setFieldsValue({
        amenityName: record.amenityName,
        iconKey: record.iconKey,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async (values: any) => {
    try {
      if (editingId) {
        await amenityAdminService.update(editingId, values);
        message.success("Cập nhật tiện ích thành công");
      } else {
        await amenityAdminService.create(values);
        message.success("Thêm tiện ích thành công");
      }
      fetchAmenities();
      handleCloseModal();
    } catch (error) {
      message.error("Lưu tiện ích thất bại");
    }
  };

  const handleDelete = (record: AmenityResponse) => {
    Modal.confirm({
      title: "Xóa tiện ích",
      content: `Bạn có chắc muốn xóa "${record.amenityName}" không?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await amenityAdminService.delete(record.amenityId);
          message.success("Xóa tiện ích thành công");
          fetchAmenities();
        } catch (error) {
          message.error("Xóa tiện ích thất bại");
        }
      },
    });
  };

  const handleViewDetail = (record: AmenityResponse) => {
    setSelectedDetail(record);
    setIsDetailModalVisible(true);
  };

  const filteredAmenities = amenities.filter(
    (a) =>
      a.amenityName.toLowerCase().includes(searchText.toLowerCase()) ||
      a.iconKey.toLowerCase().includes(searchText.toLowerCase()),
  );

  const paginatedAmenities = filteredAmenities.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize,
  );

  const columns = [
    {
      title: "Mã",
      dataIndex: "amenityId",
      key: "amenityId",
      width: 80,
    },
    {
      title: "Tên tiện ích",
      dataIndex: "amenityName",
      key: "amenityName",
    },
    {
      title: "Khóa biểu tượng",
      dataIndex: "iconKey",
      key: "iconKey",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_: any, record: AmenityResponse) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>

          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Quản lý tiện ích</h2>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm tiện ích
          </Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Tìm kiếm theo tên hoặc mã biểu tượng..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination({ ...pagination, current: 1 });
            }}
            style={{ width: 300 }}
          />
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={paginatedAmenities}
            rowKey="amenityId"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredAmenities.length,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingId ? "Chỉnh sửa tiện ích" : "Thêm tiện ích mới"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={handleCloseModal}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Tên tiện ích"
            name="amenityName"
            rules={[{ required: true, message: "Vui lòng nhập tên tiện ích" }]}
          >
            <Input placeholder="Ví dụ: Wifi miễn phí, Bãi giữ xe" />
          </Form.Item>

          <Form.Item
            label="Khóa biểu tượng"
            name="iconKey"
            rules={[{ required: true, message: "Vui lòng nhập mã biểu tượng" }]}
          >
            <Input placeholder="Ví dụ: wifi, parking, water" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết tiện ích"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedDetail && (
          <div className="space-y-4">
            <div>
              <strong>Mã:</strong> {selectedDetail.amenityId}
            </div>

            <div>
              <strong>Tên tiện ích:</strong> {selectedDetail.amenityName}
            </div>

            <div>
              <strong>Khóa biểu tượng:</strong> {selectedDetail.iconKey}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
