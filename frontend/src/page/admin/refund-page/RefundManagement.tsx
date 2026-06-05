import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Card,
  Popconfirm,
  message,
  Space,
  Typography,
  Image,
  Tabs,
} from "antd";
import {
  CheckCircleOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  BankOutlined,
} from "@ant-design/icons";
import type { RefundResponse } from "../../../types/payment";
import refundService from "../../../service/payment/refundService";

const { Title, Text } = Typography;

export default function RefundManagement() {
  const [refunds, setRefunds] = useState<RefundResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchRefunds = async (page = 1, size = 10, tab = activeTab) => {
    setLoading(true);
    try {
      let res: any;
      if (tab === "1") {
        res = await refundService.getPendingRefunds(page, size);
      } else {
        res = await refundService.getCompletedRefunds(page, size);
      }

      const apiResponse = res.data ? res.data : res;

      if (apiResponse?.code === 200 && apiResponse?.result) {
        const pageData = apiResponse.result;
        setRefunds(pageData.data || []);

        setPagination({
          current: pageData.currentPage || page,
          pageSize: pageData.pageSize || size,
          total: pageData.totalElements || 0,
        });
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách hoàn tiền",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(1, pagination.pageSize, activeTab);
  }, [activeTab]);

  const handleConfirmRefund = async (paymentId: string) => {
    try {
      await refundService.confirmManualRefund(paymentId);
      message.success("Đã xác nhận hoàn tiền thành công!");
      fetchRefunds(pagination.current, pagination.pageSize, activeTab);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Xử lý xác nhận thất bại",
      );
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: RefundResponse) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong>{record.userName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            SĐT: {record.phone || "---"}
          </Text>
        </div>
      ),
    },
    {
      title: "Nguồn đơn",
      dataIndex: "source",
      key: "source",
      render: (source: string) => (
        <Tag color={source === "MATCH" ? "purple" : "blue"}>
          {source === "MATCH" ? "Ghép trận" : "Đặt sân"}
        </Tag>
      ),
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong style={{ color: "#ff4d4f", fontSize: "15px" }}>
          {amount?.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Thông tin nhận tiền",
      key: "bankInfo",
      render: (_: any, record: RefundResponse) => {
        if (!record.bankName || !record.accountNumber) {
          return <Tag color="warning">Chưa liên kết thẻ</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13, color: "#1677ff" }}>
              <BankOutlined className="mr-1" /> {record.bankName}
            </Text>
            <Text style={{ fontSize: 13 }}>STK: {record.accountNumber}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.accountHolderName}
            </Text>

            {record.qrCodeUrl && activeTab === "1" && (
              <div style={{ marginTop: 4 }}>
                <Image
                  key={record.qrCodeUrl}
                  width={100}
                  src={record.qrCodeUrl}
                  alt="QR Code Hoàn Tiền"
                  crossOrigin="anonymous"
                  preview={{
                    mask: (
                      <Space size={4} style={{ fontSize: 12 }}>
                        <QrcodeOutlined /> Phóng to
                      </Space>
                    ),
                  }}
                  style={{ borderRadius: 6, border: "1px solid #d9d9d9" }}
                />
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: activeTab === "1" ? "Thao tác" : "Trạng thái",
      key: "action",
      width: 150,
      render: (_: any, record: RefundResponse) => {
        if (activeTab === "1") {
          return (
            <Popconfirm
              title="Xác nhận hoàn tiền thủ công"
              description={
                <div>
                  Bạn đã chuyển khoản{" "}
                  <b style={{ color: "red" }}>
                    {record.amount?.toLocaleString("vi-VN")}đ
                  </b>{" "}
                  chưa?
                </div>
              }
              onConfirm={() => handleConfirmRefund(record.paymentId)}
              okText="Đã chuyển tiền"
              cancelText="Chưa"
            >
              <Button
                type="primary"
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                icon={<CheckCircleOutlined />}
              >
                Đã CK
              </Button>
            </Popconfirm>
          );
        } else {
          return (
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              style={{ fontSize: 13, padding: "4px 8px" }}
            >
              Đã hoàn tiền
            </Tag>
          );
        }
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý hoàn tiền Trận đấu
            </Title>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              fetchRefunds(pagination.current, pagination.pageSize, activeTab)
            }
          >
            Làm mới
          </Button>
        }
        className="shadow-md rounded-2xl"
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPagination({ ...pagination, current: 1 });
          }}
          items={[
            { key: "1", label: "Chờ xử lý" },
            { key: "2", label: "Lịch sử đã hoàn" },
          ]}
        />

        <Table
          columns={columns}
          dataSource={refunds}
          loading={loading}
          rowKey="paymentId"
          size="middle"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} dòng`,
            onChange: (page, pageSize) => {
              fetchRefunds(page, pageSize, activeTab);
            },
          }}
          locale={{
            emptyText:
              activeTab === "1"
                ? "Tuyệt vời! Hiện tại không có yêu cầu hoàn tiền nào đang tồn đọng."
                : "Chưa có lịch sử hoàn tiền nào.",
          }}
        />
      </Card>
    </div>
  );
}
