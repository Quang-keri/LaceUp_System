import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Skeleton,
  Modal,
  Form,
  InputNumber,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import CourtService from "../../../service/courtService";
import RentalService from "../../../service/rental/rentalService";
import type { CourtResponse, CategoryResponse } from "../../../types/court";
import type { RentalAreaResponse } from "../../../types/rental";

export default function CourtManagementPage() {
  const { buildingId } = useParams();
  const navigate = useNavigate();

  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [building, setBuilding] = useState<RentalAreaResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState("");

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingId) return;
    loadBuildingData(buildingId);
    loadCategories();
    fetchCourts(1, 10, buildingId);
  }, [buildingId]);

  const loadBuildingData = async (id: string) => {
    try {
      const response = await RentalService.getRentalAreaById(id);
      if (response.data && response.data.result) {
        setBuilding(response.data.result);
      }
    } catch (error) {
      message.error("Lỗi khi tải thông tin tòa nhà");
      console.error(error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await CourtService.getCategories();
      if (response.data && Array.isArray(response.data.result)) {
        setCategories(response.data.result);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    }
  };

  const fetchCourts = async (page: number, size: number, id: string) => {
    setLoading(true);
    try {
      const response = await CourtService.getCourtsByRentalArea(
        id,
        page,
        size,
        searchKeyword || undefined,
      );

      if (response.data && response.data.data) {
        setCourts(response.data.data);
        setPagination({
          current: page,
          pageSize: size,
          total: response.data.totalElements || 0,
        });
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách sân");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!buildingId) return;
    fetchCourts(1, 10, buildingId);
  };

  const handleDeleteCourt = async (courtId: string) => {
    try {
      await CourtService.deleteCourt(courtId);
      message.success("Xóa sân thành công");
      if (!buildingId) return;
      fetchCourts(pagination.current, pagination.pageSize, buildingId);
    } catch (error) {
      message.error("Lỗi khi xóa sân");
      console.error(error);
    }
  };

  const handleEditCourt = async (court: CourtResponse) => {
    setEditingCourtId(court.courtId);
    form.setFieldsValue({
      courtName: court.courtName,
      categoryId: court.categoryId,
      price: court.price,
      description: court.description,
    });
    setIsModalVisible(true);
  };

  const handleCreateOrUpdateCourt = async (values: any) => {
    try {
      setIsSubmitting(true);

      if (editingCourtId) {
        // Update existing court
        await CourtService.updateCourt(editingCourtId, {
          courtName: values.courtName,
          categoryId: values.categoryId,
          price: values.price,
          courtCodes: values.courtCodes
            ? values.courtCodes.split(",").map((c: string) => c.trim())
            : [],
        });
        message.success("Cập nhật sân thành công");
      } else {
        // Create new court
        if (!buildingId) {
          message.error("Không tìm thấy thông tin tòa nhà");
          return;
        }

        // Generate court code if not provided, or use provided ones
        const courtCodes = values.courtCode
          ? [values.courtCode.trim()]
          : [`C${Date.now()}`];

        await CourtService.createCourt({
          courtName: values.courtName,
          categoryId: values.categoryId,
          price: values.price,
          rentalAreaId: buildingId,
          courtCodes: courtCodes,
        });
        message.success("Tạo sân thành công");
      }

      // Reset form and close modal
      form.resetFields();
      setEditingCourtId(null);
      setIsModalVisible(false);

      // Reload courts list
      if (buildingId) {
        fetchCourts(pagination.current, pagination.pageSize, buildingId);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Lỗi khi lưu sân";
      message.error(errorMsg);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Tên sân",
      dataIndex: "courtName",
      key: "courtName",
      width: 200,
    },
    {
      title: "Loại sân",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 150,
    },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      key: "price",
      render: (price: number) => price.toLocaleString("vi-VN"),
      width: 120,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (text: string) => (text ? text.substring(0, 50) + "..." : "-"),
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
      render: (_: any, record: CourtResponse) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCourt(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sân"
            description="Bạn có chắc chắn muốn xóa sân này?"
            onConfirm={() => handleDeleteCourt(record.courtId)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!building) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className="p-4">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/owner/buildings/list")}
            />
            <div>
              <h2>Quản lý sân</h2>
              <p className="text-sm text-gray-500">{building.rentalAreaName}</p>
            </div>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setEditingCourtId(null);
              setIsModalVisible(true);
            }}
          >
            Tạo sân mới
          </Button>
        }
      >
        {/* Search */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={16}>
            <Input
              placeholder="Tìm kiếm sân..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Button type="primary" block onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        {/* Table */}
        {loading && !courts.length ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={courts}
            rowKey="courtId"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                if (buildingId) {
                  fetchCourts(page, pageSize, buildingId);
                }
              },
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      
      <Modal
        title={editingCourtId ? "Chỉnh sửa sân" : "Tạo sân mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCourtId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              form.resetFields();
              setEditingCourtId(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={() => form.submit()}
          >
            {editingCourtId ? "Cập nhật" : "Tạo sân"}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdateCourt}
          autoComplete="off"
        >
          <Form.Item
            label="Tên sân"
            name="courtName"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên sân",
              },
            ]}
          >
            <Input placeholder="Nhập tên sân" />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Loại sân"
                name="categoryId"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn loại sân",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn loại sân"
                  options={categories.map((cat) => ({
                    label: cat.categoryName,
                    value: cat.categoryId,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Giá (VND)"
                name="price"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Nhập giá"
                  min={0}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {!editingCourtId && (
            <Form.Item
              label="Mã sân (Court Code)"
              name="courtCode"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mã sân",
                },
              ]}
              tooltip="Mã sân dùng để xác định các phòng sân. Ví dụ: A, B, C, v.v."
            >
              <Input placeholder="Ví dụ: A, B, C, ..." />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
