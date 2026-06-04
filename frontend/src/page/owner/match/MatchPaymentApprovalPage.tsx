import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Image,
  Popconfirm,
  message,
  Tag,
  Space,
  Typography,
  Tabs,
  Input,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import paymentService from "../../../service/payment/paymentService";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function MatchPaymentApprovalPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State cho bộ lọc
  const [activeTab, setActiveTab] = useState("PENDING");
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState<any>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = { status: activeTab };
      if (keyword) params.keyword = keyword;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format("YYYY-MM-DD");
        params.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const res = await paymentService.getMatchPayments(params);
      if (res.code === 200) {
        setData(res.result || []);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange]);

  const handleSearch = () => {
    fetchPayments();
  };

  const handleAction = async (paymentId: string, isApproved: boolean) => {
    try {
      const res = await paymentService.confirmMatchPayment(
        paymentId,
        isApproved,
      );
      if (res.code === 200) {
        message.success(isApproved ? "Đã duyệt thành công" : "Đã từ chối");
        fetchPayments();
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => <b>{index + 1}</b>,
    },
    {
      title: "Thông tin người chơi",
      key: "userInfo",
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold text-gray-800">{record.userName}</div>
          <div className="text-xs text-gray-500">
            {record.phone || "Không có SĐT"}
          </div>
        </div>
      ),
    },
    {
      title: "Mã phòng",
      dataIndex: "roomCode",
      key: "roomCode",
      align: "center" as const,
      render: (text: string) => (
        <Tag color="purple" className="font-mono m-0">
          {text}
        </Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number) => (
        <span className="text-orange-600 font-bold">
          {Number(amount).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Thời gian gửi",
      dataIndex: "transactionDate",
      key: "transactionDate",
      render: (date: string) => (
        <span className="text-gray-600">
          {dayjs(date).format("HH:mm - DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Ảnh CK",
      dataIndex: "proof",
      key: "proof",
      align: "center" as const,
      render: (proofUrl: string) => (
        <Image
          width={50}
          height={50}
          src={proofUrl}
          className="object-cover rounded-md border border-gray-200"
          preview={{
            maskClassName: "text-xs",
            mask: <div>Xem</div>,
          }}
        />
      ),
    },
    ...(activeTab === "PENDING"
      ? [
          {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            render: (_: any, record: any) => (
              <Space>
                <Popconfirm
                  title="Duyệt thanh toán?"
                  onConfirm={() => handleAction(record.paymentId, true)}
                  okText="Duyệt"
                  cancelText="Hủy"
                  okButtonProps={{ style: { background: "#52c41a" } }}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  >
                    Duyệt
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Từ chối thanh toán?"
                  onConfirm={() => handleAction(record.paymentId, false)}
                  okText="Từ chối"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<CloseCircleOutlined />}
                  >
                    Từ chối
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : [
          {
            title: "Trạng thái",
            key: "status",
            align: "center" as const,
            render: (_: any, record: any) => {
              if (record.status === "SUCCESS")
                return <Tag color="success">Đã duyệt</Tag>;
              if (record.status === "FAILED")
                return <Tag color="error">Đã từ chối</Tag>;
              return <Tag>{record.status}</Tag>;
            },
          },
        ]),
  ];

  return (
    <div className="p-6 bg-[#F8F9FA] min-h-screen">
      <div className="mb-6">
        <Title level={4} style={{ margin: 0 }}>
          Quản lý thanh toán ghép kèo (VietQR)
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: BỘ LỌC */}
        <Col xs={24} lg={6} xl={5}>
          <Card
            className="shadow-sm rounded-xl h-full"
            title={
              <span className="flex items-center gap-2 text-base">
                <FilterOutlined /> Bộ lọc
              </span>
            }
          >
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Tìm kiếm
              </div>
              <Input
                placeholder="Tên, SĐT, Mã phòng..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Thời gian giao dịch
              </div>
              <RangePicker
                className="w-full"
                format="DD/MM/YYYY"
                onChange={(dates) => setDateRange(dates)}
              />
            </div>

            <Button
              type="primary"
              block
              onClick={handleSearch}
              className="bg-blue-600 h-10 font-medium rounded-lg"
            >
              Lọc dữ liệu
            </Button>
          </Card>
        </Col>

        {/* CỘT PHẢI: TABS VÀ BẢNG DỮ LIỆU */}
        <Col xs={24} lg={18} xl={19}>
          <Card
            className="shadow-sm rounded-xl"
            bodyStyle={{ padding: "0 24px 24px 24px" }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              items={[
                { key: "PENDING", label: "Chờ xét duyệt" },
                { key: "PROCESSED", label: "Lịch sử đã duyệt/từ chối" },
              ]}
              className="mb-4"
            />

            <Table
              dataSource={data}
              columns={columns}
              rowKey="paymentId"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              bordered={false}
              className="border border-gray-200 rounded-lg overflow-hidden"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
