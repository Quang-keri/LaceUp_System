import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Skeleton,
  Modal,
  Form,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import RentalService from "../../../service/rental/rentalService";
import type {
  RentalAreaResponse,
  RentalAreaStatus,
} from "../../../types/rental";
import type { UploadFile } from "antd";
import { useAuth } from "../../../context/AuthContext";

const statusColorMap: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "red",
  PENDING: "orange",
  REJECTED: "volcano",
};

export default function BuildingListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<RentalAreaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    RentalAreaStatus | undefined
  >(undefined);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CITIES = [
    { label: "TP Hồ Chí Minh", value: 1 },
    { label: "Hà Nội", value: 2 },
    { label: "Đà Nẵng", value: 3 },
    { label: "Hải Phòng", value: 4 },
    { label: "Cần Thơ", value: 5 },
  ];

  const fetchBuildings = async (page: number, size: number) => {
    setLoading(true);
    try {
      
      const response = await RentalService.getMyRentalAreas(
        page,
        size,
        searchKeyword || undefined,
        filterStatus,
      );

      // SỬA Ở ĐÂY: Bỏ chữ .data đầu tiên đi
      if (response && response.result) {
        setBuildings(response.result.data || []);
        setPagination({
          current: page,
          pageSize: size,
          total: response.result.totalElements || 0,
        });
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách tòa nhà");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings(1, 10);
  }, []);

  const handleSearch = () => {
    fetchBuildings(1, 10);
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      await RentalService.deleteRentalArea(buildingId);
      message.success("Xóa tòa nhà thành công");
      fetchBuildings(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("Lỗi khi xóa tòa nhà");
      console.error(error);
    }
  };

  const handleFileChange = (e: any) => {
    const files = Array.from(e.fileList);
    const newFiles: File[] = [];

    files.forEach((fileObj: any) => {
      if (fileObj.originFileObj) {
        newFiles.push(fileObj.originFileObj);
      }
    });

    setImageFiles(newFiles);
    setFileList(e.fileList);
  };

  const handleCreateBuilding = async (values: any) => {
    try {
      setIsSubmitting(true);

      if (imageFiles.length === 0) {
        message.error("Vui lòng chọn ít nhất một hình ảnh");
        setIsSubmitting(false);
        return;
      }

      const createData = {
        userId: user?.userId,
        rentalAreaName: values.rentalAreaName,
        address: values.address,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        cityId: values.cityId,
      };

      await RentalService.createRentalArea(createData, imageFiles);
      message.success("Tòa nhà được tạo thành công!");

      // Reset form and close modal
      form.resetFields();
      setImageFiles([]);
      setFileList([]);
      setIsModalVisible(false);

      // Reload building list
      fetchBuildings(1, 10);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Lỗi khi tạo tòa nhà";
      message.error(errorMsg);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Tên tòa nhà",
      dataIndex: "rentalAreaName",
      key: "rentalAreaName",
      width: 200,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
    },
    {
      title: "Người liên hệ",
      dataIndex: "contactName",
      key: "contactName",
      width: 150,
    },
    {
      title: "SĐT liên hệ",
      dataIndex: "contactPhone",
      key: "contactPhone",
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: RentalAreaStatus) => (
        <Tag color={statusColorMap[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      width: 120,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_: any, record: RentalAreaResponse) => (
        <Space size="small">
          <Popconfirm
            title="Xóa tòa nhà"
            description="Bạn có chắc chắn muốn xóa tòa nhà này?"
            onConfirm={() => handleDeleteBuilding(record.rentalAreaId)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={loading}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title={<h2>Danh sách tòa nhà</h2>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Tạo tòa nhà mới
          </Button>
        }
      >
        {/* Search and Filter */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm tòa nhà..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: "100%" }}
              options={[
                { label: "Hoạt động", value: "ACTIVE" },
                { label: "Không hoạt động", value: "INACTIVE" },
                { label: "Chờ duyệt", value: "PENDING" },
                { label: "Từ chối", value: "REJECTED" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button type="primary" block onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        {/* Table */}
        {loading && !buildings.length ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={buildings}
            rowKey="rentalAreaId"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => fetchBuildings(page, pageSize),
            }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () =>
                navigate(`/owner/buildings/${record.rentalAreaId}/courts`),
              style: { cursor: "pointer" },
            })}
          />
        )}
      </Card>

   
      <Modal
        title="Tạo tòa nhà mới 2"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setImageFiles([]);
          setFileList([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={() => form.submit()}
          >
            Tạo tòa nhà
          </Button>,
        ]}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateBuilding}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên tòa nhà"
                name="rentalAreaName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên tòa nhà",
                  },
                ]}
              >
                <Input placeholder="Nhập tên tòa nhà" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Thành phố"
                name="cityId"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thành phố",
                  },
                ]}
              >
                <Select placeholder="Chọn thành phố" options={CITIES} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập địa chỉ",
                  },
                ]}
              >
                <Input placeholder="Nhập địa chỉ tòa nhà" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên người liên hệ"
                name="contactName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên người liên hệ",
                  },
                ]}
              >
                <Input placeholder="Nhập tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số điện thoại liên hệ"
                name="contactPhone"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoại",
                  },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label="Hình ảnh tòa nhà"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng tải lên ít nhất một hình ảnh",
                  },
                ]}
              >
                <Upload
                  listType="picture"
                  multiple
                  maxCount={5}
                  fileList={fileList}
                  onChange={handleFileChange}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>
                    Chọn hình ảnh (tối đa 5 ảnh)
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
