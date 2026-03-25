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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import RentalService from "../../../service/rental/rentalService";
import type {
  RentalAreaResponse,
  RentalAreaStatus,
} from "../../../types/rental";

const statusColorMap: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "red",
  PENDING: "orange",
  REJECTED: "volcano",
};

export default function BuildingListPage() {
  const navigate = useNavigate();
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

  const fetchBuildings = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await RentalService.getMyRentalAreas(
        page,
        size,
        searchKeyword || undefined,
        filterStatus,
      );

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
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn click vào row
              navigate(`/owner/buildings/edit/${record.rentalAreaId}`);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa tòa nhà"
            description="Bạn có chắc chắn muốn xóa tòa nhà này?"
            onConfirm={(e) => {
              e?.stopPropagation(); // Ngăn click vào row
              handleDeleteBuilding(record.rentalAreaId);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()} // Ngăn click vào row khi nhấn nút Xóa
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
            // Sửa điều hướng ở đây, thay vì mở Modal
            onClick={() => navigate("/owner/buildings/create")}
          >
            Tạo tòa nhà mới
          </Button>
        }
      >
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
    </div>
  );
}
