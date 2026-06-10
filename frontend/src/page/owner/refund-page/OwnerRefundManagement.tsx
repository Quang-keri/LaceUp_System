import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  QrcodeOutlined,
  RedoOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import ownerRefundService from "../../../service/payment/ownerRefundService";
import rentalAreaService from "../../../service/rental/rentalService";
import type {
  RefundResponse,
  RefundSource,
  RefundStatus,
} from "../../../types/payment";

const { Title, Text } = Typography;
const { TextArea } = Input;

type ActiveTab = "pending" | "history";
type ProcessMode = "SUCCESS" | "FAILED";

interface RentalAreaOption {
  rentalAreaId: string;
  rentalAreaName: string;
}

const sourceLabelMap: Record<RefundSource, string> = {
  BOOKING: "Đặt sân",
  MATCH: "Ghép trận",
  SHARED_TICKET: "Vé vãng lai",
};

const sourceColorMap: Record<RefundSource, string> = {
  BOOKING: "blue",
  MATCH: "purple",
  SHARED_TICKET: "cyan",
};

const statusLabelMap: Record<RefundStatus, string> = {
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUND_FAILED: "Hoàn tiền thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const statusColorMap: Record<RefundStatus, string> = {
  REFUND_PENDING: "gold",
  REFUND_FAILED: "red",
  REFUNDED: "green",
};

const formatCurrency = (value?: number | null) =>
  `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;

export default function OwnerRefundManagement() {
  const [rentalAreas, setRentalAreas] = useState<RentalAreaOption[]>([]);

  const [selectedRentalAreaId, setSelectedRentalAreaId] =
    useState<string>("ALL");

  const [refunds, setRefunds] = useState<RefundResponse[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  const [loading, setLoading] = useState(false);

  const [loadingRentalAreas, setLoadingRentalAreas] = useState(false);

  const [processModalOpen, setProcessModalOpen] = useState(false);

  const [processing, setProcessing] = useState(false);

  const [processMode, setProcessMode] = useState<ProcessMode>("SUCCESS");

  const [selectedRefund, setSelectedRefund] = useState<RefundResponse | null>(
    null,
  );

  const [refundNote, setRefundNote] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadRentalAreas = async () => {
    try {
      setLoadingRentalAreas(true);

      const response = await rentalAreaService.getMyRentalAreas();

      const data = response?.result?.data ?? response?.data?.result?.data ?? [];

      setRentalAreas(data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách sân",
      );
    } finally {
      setLoadingRentalAreas(false);
    }
  };

  const fetchRefunds = async (
    page = 1,
    size = pagination.pageSize,
    tab = activeTab,
    rentalAreaId = selectedRentalAreaId,
  ) => {
    try {
      setLoading(true);

      const areaId = rentalAreaId === "ALL" ? undefined : rentalAreaId;

      const response =
        tab === "pending"
          ? await ownerRefundService.getPendingRefunds(areaId, page, size)
          : await ownerRefundService.getCompletedRefunds(areaId, page, size);

      if (response.code !== 200 || !response.result) {
        message.error(response.message || "Không thể tải danh sách hoàn tiền");
        return;
      }

      const pageData = response.result;

      setRefunds(pageData.data ?? []);

      setPagination({
        current: pageData.currentPage ?? page,
        pageSize: pageData.pageSize ?? size,
        total: pageData.totalElements ?? 0,
      });
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách hoàn tiền",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRentalAreas();
  }, []);

  useEffect(() => {
    void fetchRefunds(1, pagination.pageSize, activeTab, selectedRentalAreaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRentalAreaId]);

  const openProcessModal = (record: RefundResponse, mode: ProcessMode) => {
    setSelectedRefund(record);
    setProcessMode(mode);

    setRefundNote(
      mode === "SUCCESS" ? "Chủ sân đã chuyển khoản hoàn tiền thành công" : "",
    );

    setProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    if (processing) {
      return;
    }

    setProcessModalOpen(false);
    setSelectedRefund(null);
    setRefundNote("");
  };

  const handleProcessRefund = async () => {
    if (!selectedRefund) {
      return;
    }

    const note = refundNote.trim();

    if (processMode === "FAILED" && note.length === 0) {
      message.warning("Vui lòng nhập lý do hoàn tiền thất bại");
      return;
    }

    try {
      setProcessing(true);

      const response = await ownerRefundService.processRefund(
        selectedRefund.paymentId,
        {
          success: processMode === "SUCCESS",
          note,
        },
      );

      if (response.code !== 200) {
        message.error(response.message || "Không thể xử lý hoàn tiền");
        return;
      }

      message.success(
        processMode === "SUCCESS"
          ? "Đã xác nhận chủ sân hoàn tiền thành công"
          : "Đã ghi nhận hoàn tiền thất bại",
      );

      setProcessModalOpen(false);
      setSelectedRefund(null);
      setRefundNote("");

      await fetchRefunds(
        pagination.current,
        pagination.pageSize,
        activeTab,
        selectedRentalAreaId,
      );
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể xử lý hoàn tiền",
      );
    } finally {
      setProcessing(false);
    }
  };

  const renderCustomer = (record: RefundResponse) => (
    <Space direction="vertical" size={1}>
      <Text strong>{record.userName || "Khách hàng"}</Text>

      <Text type="secondary" style={{ fontSize: 12 }}>
        SĐT: {record.phone || "---"}
      </Text>

      {record.email && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          <MailOutlined /> {record.email}
        </Text>
      )}
    </Space>
  );

  const renderBankInformation = (record: RefundResponse) => {
    if (!record.bankName || !record.accountNumber) {
      return (
        <Alert
          type="warning"
          showIcon
          message="Chưa có tài khoản nhận tiền"
          style={{ maxWidth: 240 }}
        />
      );
    }

    const shouldShowQr =
      activeTab === "pending" || record.refundStatus === "REFUND_FAILED";

    return (
      <Space direction="vertical" size={2}>
        <Text
          strong
          style={{
            color: "#1677ff",
            fontSize: 13,
          }}
        >
          <BankOutlined /> {record.bankName}
        </Text>

        <Text style={{ fontSize: 13 }}>STK: {record.accountNumber}</Text>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.accountHolderName || "Chưa cập nhật tên tài khoản"}
        </Text>

        {record.qrCodeUrl && shouldShowQr && (
          <Image
            width={100}
            src={record.qrCodeUrl}
            alt="QR hoàn tiền"
            crossOrigin="anonymous"
            preview={{
              mask: (
                <Space size={4}>
                  <QrcodeOutlined />
                  Phóng to
                </Space>
              ),
            }}
            style={{
              marginTop: 6,
              borderRadius: 6,
              border: "1px solid #d9d9d9",
            }}
          />
        )}
      </Space>
    );
  };

  const renderAction = (record: RefundResponse) => {
    if (activeTab === "pending") {
      return (
        <Space wrap>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!record.bankName || !record.accountNumber}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
            }}
            onClick={() => openProcessModal(record, "SUCCESS")}
          >
            Đã CK
          </Button>

          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openProcessModal(record, "FAILED")}
          >
            Thất bại
          </Button>
        </Space>
      );
    }

    if (record.refundStatus === "REFUND_FAILED") {
      return (
        <Space direction="vertical" size={6}>
          <Tag color="red" icon={<CloseCircleOutlined />}>
            Hoàn tiền thất bại
          </Tag>

          <Button
            size="small"
            type="primary"
            icon={<RedoOutlined />}
            disabled={!record.bankName || !record.accountNumber}
            onClick={() => openProcessModal(record, "SUCCESS")}
          >
            Xử lý lại
          </Button>
        </Space>
      );
    }

    return (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Đã hoàn tiền
      </Tag>
    );
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 65,
      render: (_: unknown, __: RefundResponse, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 220,
      render: (_: unknown, record: RefundResponse) => renderCustomer(record),
    },
    {
      title: "Sân",
      key: "rentalArea",
      width: 190,
      render: (_: unknown, record: RefundResponse) => (
        <Space direction="vertical" size={1}>
          <Text strong>{record.rentalAreaName || "Chưa xác định"}</Text>

          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.rentalAreaId
              ? record.rentalAreaId.substring(0, 8).toUpperCase()
              : "---"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nguồn đơn",
      dataIndex: "source",
      key: "source",
      width: 130,
      render: (source: RefundSource) => (
        <Tag color={sourceColorMap[source] || "default"}>
          {sourceLabelMap[source] || source}
        </Tag>
      ),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "referenceCode",
      key: "referenceCode",
      width: 145,
      render: (value?: string | null) => value || "---",
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right" as const,
      render: (amount: number) => (
        <Text
          strong
          style={{
            color: "#ff4d4f",
            fontSize: 15,
          }}
        >
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Thông tin nhận tiền",
      key: "bankInformation",
      width: 255,
      render: (_: unknown, record: RefundResponse) =>
        renderBankInformation(record),
    },
    {
      title: "Ghi chú xử lý",
      key: "refundNote",
      width: 260,
      render: (_: unknown, record: RefundResponse) => (
        <Space direction="vertical" size={2}>
          <Text>{record.refundNote || "Chưa có ghi chú"}</Text>

          {record.refundProcessedAt && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xử lý lúc:{" "}
              {dayjs(record.refundProcessedAt).format("DD/MM/YYYY HH:mm")}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: activeTab === "pending" ? "Thao tác" : "Trạng thái",
      key: "action",
      width: 210,
      fixed: "right" as const,
      render: (_: unknown, record: RefundResponse) => renderAction(record),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        className="shadow-md rounded-2xl"
        title={
          <Title level={4} style={{ margin: 0 }}>
            Hoàn tiền cho người chơi
          </Title>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() =>
              fetchRefunds(
                pagination.current,
                pagination.pageSize,
                activeTab,
                selectedRentalAreaId,
              )
            }
          >
            Làm mới
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          message="Chủ sân chỉ xử lý các khoản hoàn tiền VietQR đã nhận trực tiếp"
          description="Các khoản VNPay hoặc PayOS do quản trị viên xử lý và sẽ không xuất hiện tại đây."
          style={{ marginBottom: 16 }}
        />

        <Space
          wrap
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as ActiveTab);

              setPagination((previous) => ({
                ...previous,
                current: 1,
              }));
            }}
            items={[
              {
                key: "pending",
                label: "Chờ xử lý",
              },
              {
                key: "history",
                label: "Lịch sử xử lý",
              },
            ]}
          />

          <Select
            value={selectedRentalAreaId}
            loading={loadingRentalAreas}
            style={{ width: 280 }}
            onChange={(value) => {
              setSelectedRentalAreaId(value);

              setPagination((previous) => ({
                ...previous,
                current: 1,
              }));
            }}
            options={[
              {
                value: "ALL",
                label: "Tất cả sân",
              },
              ...rentalAreas.map((rentalArea) => ({
                value: rentalArea.rentalAreaId,
                label: rentalArea.rentalAreaName,
              })),
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={refunds}
          loading={loading}
          rowKey="paymentId"
          size="middle"
          scroll={{ x: 1650 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} dòng`,
            onChange: (page, pageSize) => {
              void fetchRefunds(
                page,
                pageSize,
                activeTab,
                selectedRentalAreaId,
              );
            },
          }}
          locale={{
            emptyText:
              activeTab === "pending"
                ? "Không có yêu cầu hoàn tiền nào đang chờ chủ sân xử lý."
                : "Chưa có lịch sử xử lý hoàn tiền.",
          }}
        />
      </Card>

      <Modal
        title={
          processMode === "SUCCESS"
            ? "Xác nhận đã hoàn tiền"
            : "Ghi nhận hoàn tiền thất bại"
        }
        open={processModalOpen}
        onCancel={closeProcessModal}
        onOk={handleProcessRefund}
        confirmLoading={processing}
        okText={
          processMode === "SUCCESS" ? "Xác nhận đã chuyển" : "Xác nhận thất bại"
        }
        cancelText="Đóng"
        width={580}
        destroyOnClose
        okButtonProps={{
          danger: processMode === "FAILED",
          style:
            processMode === "SUCCESS"
              ? {
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                }
              : undefined,
        }}
      >
        {selectedRefund && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Khách hàng">
                {selectedRefund.userName}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {selectedRefund.email || "Chưa có email"}
              </Descriptions.Item>

              <Descriptions.Item label="Sân">
                {selectedRefund.rentalAreaName || "Chưa xác định"}
              </Descriptions.Item>

              <Descriptions.Item label="Nguồn">
                {sourceLabelMap[selectedRefund.source] || selectedRefund.source}
              </Descriptions.Item>

              <Descriptions.Item label="Mã giao dịch">
                {selectedRefund.referenceCode || "---"}
              </Descriptions.Item>

              <Descriptions.Item label="Số tiền">
                <Text
                  strong
                  style={{
                    color: "#ff4d4f",
                  }}
                >
                  {formatCurrency(selectedRefund.amount)}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Tài khoản nhận">
                {selectedRefund.bankName && selectedRefund.accountNumber
                  ? `${selectedRefund.bankName} - ${selectedRefund.accountNumber}`
                  : "Chưa có thông tin tài khoản"}
              </Descriptions.Item>
            </Descriptions>

            {processMode === "SUCCESS" ? (
              <Alert
                type="success"
                showIcon
                message="Xác nhận đã chuyển khoản"
                description="Chỉ xác nhận sau khi tiền đã được chuyển thật vào tài khoản của người chơi."
              />
            ) : (
              <Alert
                type="error"
                showIcon
                message="Hoàn tiền thất bại"
                description="Lý do thất bại sẽ được lưu và gửi email cho người chơi."
              />
            )}

            <div>
              <Text strong>
                {processMode === "FAILED"
                  ? "Lý do thất bại"
                  : "Ghi chú hoàn tiền"}
              </Text>

              {processMode === "FAILED" && <Text type="danger"> *</Text>}

              <TextArea
                value={refundNote}
                onChange={(event) => setRefundNote(event.target.value)}
                placeholder={
                  processMode === "FAILED"
                    ? "Ví dụ: Sai số tài khoản, tài khoản bị khóa, ngân hàng từ chối giao dịch..."
                    : "Ví dụ: Đã chuyển khoản theo mã tham chiếu..."
                }
                rows={4}
                maxLength={1000}
                showCount
                style={{ marginTop: 8 }}
              />
            </div>

            <Text type="secondary">
              Backend sẽ kiểm tra khoản hoàn tiền có thuộc sân của tài khoản
              owner hiện tại hay không trước khi xử lý.
            </Text>
          </Space>
        )}
      </Modal>
    </div>
  );
}
