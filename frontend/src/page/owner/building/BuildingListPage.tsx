import { useState, useEffect, useMemo } from "react";
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
  Skeleton,
  Layout,
  Radio,
  Dropdown,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  DownOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import RentalService from "../../../service/rental/rentalService";
import type {
  RentalAreaResponse,
  RentalAreaStatus,
} from "../../../types/rental";

const { Sider, Content } = Layout;
const { Text } = Typography;

const statusColorMap: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "red",
  SUSPENDED: "orange",
};

const statusTextMap: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  SUSPENDED: "Tạm dừng",
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
  const [filterStatus, setFilterStatus] = useState<RentalAreaStatus | "ALL">(
    "ALL",
  );

  const fetchBuildings = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await RentalService.getMyRentalAreas(
        page,
        size,
        searchKeyword || undefined,
        filterStatus === "ALL" ? undefined : filterStatus,
      );

      if (response?.result) {
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

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const keyword = searchKeyword.toLowerCase();

      const matchSearch =
        building.rentalAreaName?.toLowerCase().includes(keyword) ||
        building.address?.toLowerCase().includes(keyword) ||
        building.contactName?.toLowerCase().includes(keyword) ||
        building.contactPhone?.toLowerCase().includes(keyword);

      const matchStatus =
        filterStatus === "ALL" ? true : building.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [buildings, searchKeyword, filterStatus]);

  const handleSearch = () => {
    fetchBuildings(1, pagination.pageSize);
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

  const menuItems: MenuProps["items"] = [
    {
      key: "create-building",
      label: "Tạo tòa nhà mới",
      icon: <PlusOutlined />,
      onClick: () => navigate("/owner/buildings/create"),
    },
  ];

  const columns = [
    {
      title: "Mã tòa nhà",
      dataIndex: "rentalAreaId",
      key: "rentalAreaId",
      render: (id: string) => id?.substring(0, 8).toUpperCase(),
    },
    {
      title: "Tên tòa nhà",
      dataIndex: "rentalAreaName",
      key: "rentalAreaName",
      render: (text: string, record: RentalAreaResponse) => (
        <a
          onClick={() =>
            navigate(`/owner/buildings/${record.rentalAreaId}/courts`)
          }
          style={{ fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: RentalAreaStatus) => (
        <Tag color={statusColorMap[status] || "default"}>
          {statusTextMap[status] || status}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "---",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: RentalAreaResponse) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/owner/buildings/edit/${record.rentalAreaId}`);
            }}
          >
            Sửa
          </Button>

          <Button
            size="small"
            type="default"
            icon={<HomeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/owner/buildings/${record.rentalAreaId}/courts`);
            }}
          >
            Quản lý sân
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
          Quản lý Tòa nhà
        </h2>

        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Button
            type="primary"
            style={{
              backgroundColor: "#4caf50",
              borderColor: "#4caf50",
              height: 38,
              borderRadius: 4,
            }}
          >
            <PlusOutlined /> Thêm mới <DownOutlined />
          </Button>
        </Dropdown>
      </div>

      <Layout style={{ backgroundColor: "transparent" }}>
        <Sider
          width={280}
          style={{ background: "transparent", marginRight: 20 }}
        >
          <Card
            size="small"
            className="mb-4"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Tìm kiếm
            </div>

            <Input
              placeholder="Tìm kiếm tòa nhà..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              prefix={<SearchOutlined />}
              style={{ padding: "8px 12px" }}
            />
          </Card>

          <Card
            size="small"
            className="mb-4"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Lọc trạng thái
            </div>

            <Select
              placeholder="Chọn trạng thái"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              style={{ width: "100%" }}
              options={[
                { label: "Tất cả", value: "ALL" },
                { label: "Đang hoạt động", value: "ACTIVE" },
                { label: "Ngừng hoạt động", value: "INACTIVE" },
              ]}
            />
          </Card>

          <Card
            size="small"
            bodyStyle={{ padding: 16 }}
            style={{ borderRadius: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
              Trạng thái
            </div>

            <Radio.Group
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Radio value="ALL">Tất cả</Radio>
              <Radio value="ACTIVE">Đang hoạt động</Radio>
              <Radio value="INACTIVE">Ngừng hoạt động</Radio>
              <Radio value="SUSPENDED">Tạm dừng</Radio>
            </Radio.Group>
          </Card>
        </Sider>

        <Content>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ borderRadius: 8, overflow: "hidden" }}
          >
            {loading && !buildings.length ? (
              <div style={{ padding: 24 }}>
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredBuildings}
                rowKey="rentalAreaId"
                loading={loading}
                pagination={{
                  ...pagination,
                  total: filteredBuildings.length,
                  onChange: (page, pageSize) => fetchBuildings(page, pageSize),
                }}
                scroll={{ x: 1200 }}
                onRow={(record) => ({
                  onClick: () =>
                    navigate(`/owner/buildings/${record.rentalAreaId}/courts`),
                  style: { cursor: "pointer" },
                })}
              />
            )}
          </Card>
        </Content>
      </Layout>
    </div>
  );
}
