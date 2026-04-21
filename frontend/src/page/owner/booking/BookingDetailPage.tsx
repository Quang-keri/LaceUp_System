import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  List,
  Button,
  InputNumber,
  Typography,
  Space,
  Divider,
  message,
  Tag,
  Descriptions,
  Table,
  Modal,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  CreditCardOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import bookingService from "../../../service/bookingService";
const { Text, Title } = Typography;

interface Props {
  bookingId: string;
  rentalAreaId: string;
  onBack: () => void;
}

export default function BookingDetailPage({
  bookingId,
  rentalAreaId,
  onBack,
}: Props) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    fetchBookingDetail();
    fetchServices();
  }, [bookingId, rentalAreaId]);

  const fetchBookingDetail = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getBookingById(bookingId);
      setBooking(res.result);
    } catch (error) {
      message.error("Lỗi khi tải chi tiết đơn");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await bookingService.getServicesByRentalArea(rentalAreaId);
      setAvailableServices(res.result || []);
    } catch (error) {
      message.error("Lỗi tải danh sách dịch vụ");
    }
  };

  const filteredServices = useMemo(() => {
    if (!keyword) return availableServices;
    return availableServices.filter((s) =>
      // Đổi s.name thành s.serviceName
      s.serviceName?.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [keyword, availableServices]);
  const handleAddToCart = (service: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === service.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          name: service.serviceName, // Sửa thành serviceName
          price: service.priceSell, // Sửa thành priceSell
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number | null) => {
    if (!quantity || quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveItem = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.serviceId !== serviceId));
  };

  const originalTotal = booking?.totalPrice || 0;
  const deposit = booking?.depositAmount || 0;
  const newServicesTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const grandTotal = originalTotal + newServicesTotal;
  const remainingToPay = grandTotal - deposit;

  const handleSaveServices = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const payload = cart.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
      }));

      await bookingService.addExtraServices(bookingId, payload);

      message.success("Đã lưu dịch vụ vào đơn!");
      setCart([]);
      fetchBookingDetail();
    } catch (error) {
      message.error("Lỗi khi lưu dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = () => {
    if (cart.length > 0) {
      message.warning("Vui lòng ấn 'Lưu dịch vụ' trước khi thanh toán!");
      return;
    }

    Modal.confirm({
      title: "Xác nhận thu tiền",
      content: `Xác nhận thu số tiền còn thiếu: ${remainingToPay.toLocaleString(
        "vi-VN",
      )}đ?`,
      okText: "Xác nhận đã thu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          await bookingService.collectRemainingPayment(bookingId);
          message.success("Đã cập nhật thanh toán thành công!");
          fetchBookingDetail();
        } catch (error: any) {
          const backendMessage =
            error.response?.data?.message || "Lỗi cập nhật thanh toán!";
          const cleanMessage = backendMessage
            .replace("Error when payment", "")
            .trim();
          message.error(cleanMessage || "Lỗi cập nhật thanh toán!");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePrintInvoice = async () => {
    try {
      message.loading({ content: "Đang tạo hóa đơn...", key: "invoice" });
      const response: any = await bookingService.downloadInvoice(bookingId);

      const fileData = response.data || response;
      const blob = new Blob([fileData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hoadon_${bookingId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: "Tải hóa đơn thành công!", key: "invoice" });
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
      message.error({
        content: "Lỗi tải hóa đơn (Có thể chưa tồn tại)",
        key: "invoice",
      });
    }
  };

  if (!booking && !loading) return <div>Đang tải...</div>;

  const isFullyPaid = remainingToPay <= 0 && cart.length === 0;

  return (
    <div style={{ background: "#f0f2f5", padding: "16px", minHeight: "100vh" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại danh sách
        </Button>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
            In hóa đơn PDF
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ height: "calc(100vh - 100px)" }}>
        {/* CỘT TRÁI: DANH SÁCH DỊCH VỤ */}
        <Col span={9} style={{ height: "100%" }}>
          <Card
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: 16,
            }}
            style={{ height: "100%" }}
          >
            <Input
              placeholder="Tìm theo tên dịch vụ..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ marginBottom: 16 }}
              size="large"
              allowClear
            />
            <div style={{ flex: 1, overflowY: "auto" }}>
              <Row gutter={[12, 12]}>
                {filteredServices.map((service) => (
                  <Col span={12} key={service.id}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => handleAddToCart(service)}
                      style={{
                        borderColor: "#d9d9d9",
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                      cover={
                        <img
                          src={
                            service.images?.[0] ||
                            "https://via.placeholder.com/150"
                          }
                          alt={service.serviceName}
                          style={{ height: 120, objectFit: "cover" }}
                        />
                      }
                    >
                      {/* TÊN */}
                      <div style={{ height: 40, fontWeight: 500 }}>
                        {service.serviceName}
                      </div>

                      {/* NHÓM */}
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {service.itemGroupName}
                      </div>

                      {/* SỐ LƯỢNG */}
                      <div style={{ fontSize: 12 }}>
                        Còn: <b>{service.quantity}</b>
                      </div>

                      {/* GIÁ */}
                      <Text type="danger" strong>
                        {service.priceSell?.toLocaleString("vi-VN") || 0}đ
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: CHI TIẾT ĐƠN VÀ GIỎ HÀNG */}
        <Col span={15} style={{ height: "100%" }}>
          <Card
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: 16,
            }}
            style={{ height: "100%" }}
          >
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>
                Mã đơn: {booking?.bookingId?.substring(0, 8)}
              </Title>
              <Descriptions size="small" column={3} style={{ marginTop: 8 }}>
                <Descriptions.Item label="Khách hàng">
                  <b>{booking?.userName || "Khách lẻ"}</b>
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {booking?.phoneNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color="blue">{booking?.bookingStatus}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Table
              size="small"
              pagination={false}
              dataSource={booking?.slots || []}
              rowKey="slotId"
              columns={[
                { title: "Sân/Phòng", dataIndex: "courtCode" },
                {
                  title: "Bắt đầu",
                  dataIndex: "startTime",
                  render: (v) => new Date(v).toLocaleString("vi-VN"),
                },
                {
                  title: "Kết thúc",
                  dataIndex: "endTime",
                  render: (v) => new Date(v).toLocaleString("vi-VN"),
                },
                {
                  title: "Thành tiền",
                  dataIndex: "price",
                  render: (v) => (
                    <Text strong>{v?.toLocaleString("vi-VN")}đ</Text>
                  ),
                  align: "right",
                },
              ]}
              style={{ marginBottom: 16 }}
            />

            <Title level={5}>Dịch vụ phát sinh</Title>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 8,
                background: "#fafafa",
              }}
            >
              {cart.length === 0 ? (
                <div
                  style={{ textAlign: "center", marginTop: 40, color: "#999" }}
                >
                  Chưa có dịch vụ nào được thêm
                </div>
              ) : (
                <List
                  dataSource={cart}
                  renderItem={(item, index) => (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#fff",
                        padding: "8px 12px",
                        marginBottom: 8,
                        borderRadius: 6,
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <div style={{ width: 30 }}>
                        <b>{index + 1}.</b>
                      </div>
                      <div style={{ flex: 1 }}>
                        <b>{item.name}</b>
                      </div>
                      <div style={{ width: 100 }}>
                        Số lượng:{" "}
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) =>
                            handleUpdateQuantity(item.serviceId, val)
                          }
                          size="small"
                        />
                      </div>
                      <div style={{ width: 100, textAlign: "right" }}>
                        <Text strong type="danger">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </Text>
                      </div>
                      <div style={{ width: 40, textAlign: "right" }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(item.serviceId)}
                          size="small"
                        />
                      </div>
                    </div>
                  )}
                />
              )}
            </div>

            {/* TỔNG KẾT VÀ NÚT THANH TOÁN */}
            <Divider style={{ margin: "16px 0" }} />
            <div
              style={{
                background: isFullyPaid ? "#f6ffed" : "#fff2f0",
                border: isFullyPaid ? "1px solid #b7eb8f" : "1px solid #ffccc7",
                padding: 16,
                borderRadius: 8,
              }}
            >
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>
                  <Text>Tiền đơn gốc (Sân + DV cũ):</Text>
                </Col>
                <Col>
                  <Text strong>{originalTotal.toLocaleString("vi-VN")} đ</Text>
                </Col>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>
                  <Text>Tiền dịch vụ thêm mới:</Text>
                </Col>
                <Col>
                  <Text strong>
                    + {newServicesTotal.toLocaleString("vi-VN")} đ
                  </Text>
                </Col>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>
                  <Text>Khách đã cọc/trả:</Text>
                </Col>
                <Col>
                  <Text strong style={{ color: "#52c41a" }}>
                    - {deposit.toLocaleString("vi-VN")} đ
                  </Text>
                </Col>
              </Row>
              <Divider style={{ margin: "8px 0" }} />

              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0 }}>
                    CẦN THU THÊM:
                  </Title>
                </Col>
                <Col style={{ textAlign: "right" }}>
                  <Title
                    level={3}
                    type="danger"
                    style={{ margin: 0, marginBottom: 8 }}
                  >
                    {remainingToPay > 0
                      ? remainingToPay.toLocaleString("vi-VN")
                      : 0}{" "}
                    đ
                  </Title>

                  {/* HAI NÚT HÀNH ĐỘNG CHÍNH */}
                  <Space>
                    {cart.length > 0 && (
                      <Button
                        type="default"
                        size="large"
                        icon={<SaveOutlined />}
                        onClick={handleSaveServices}
                        loading={loading}
                      >
                        Lưu dịch vụ
                      </Button>
                    )}

                    <Button
                      type="primary"
                      size="large"
                      icon={<CreditCardOutlined />}
                      onClick={handleCollectPayment}
                      disabled={isFullyPaid || cart.length > 0} // Disable nếu đã trả đủ HOẶC có dịch vụ chưa lưu
                      style={{
                        background:
                          isFullyPaid || cart.length > 0
                            ? undefined
                            : "#52c41a",
                      }}
                    >
                      {isFullyPaid ? "Đã thanh toán đủ" : "Thanh toán nốt"}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
