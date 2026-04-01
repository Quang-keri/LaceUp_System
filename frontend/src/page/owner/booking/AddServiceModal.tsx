import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Row,
  Col,
  Input,
  List,
  Card,
  Button,
  InputNumber,
  Typography,
  Space,
  Divider,
  message,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  booking: any; // Booking hiện tại đang được chọn
  rentalAreaId: string | null; // ID tòa nhà để lấy danh sách dịch vụ
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddServiceModal({
  open,
  booking,
  rentalAreaId,
  onClose,
  onSuccess,
}: Props) {
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

 
  useEffect(() => {
    if (open && rentalAreaId) {
      fetchServices(rentalAreaId);
      setCart([]); // Reset giỏ hàng khi mở lại
      setKeyword("");
    }
  }, [open, rentalAreaId]);

  const fetchServices = async (areaId: string) => {
    try {
    
      // const res = await rentalService.getServicesByRentalArea(areaId);
      // setAvailableServices(res.result || []);

      // Data giả lập để test giao diện
      setAvailableServices([
        { id: "s1", name: "Nước suối Aquafina", price: 10000, unit: "Chai" },
        { id: "s2", name: "Thuê vợt cầu lông", price: 50000, unit: "Cái" },
        { id: "s3", name: "Thuê giày thể thao", price: 30000, unit: "Đôi" },
        { id: "s4", name: "Bò húc (Redbull)", price: 15000, unit: "Lon" },
      ]);
    } catch (error) {
      message.error("Lỗi khi tải danh sách dịch vụ");
    }
  };

 
  const filteredServices = useMemo(() => {
    if (!keyword) return availableServices;
    return availableServices.filter((s) =>
      s.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [keyword, availableServices]);

  // Thêm vào giỏ hàng
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
          name: service.name,
          price: service.price,
          quantity: 1,
          note: "",
        },
      ];
    });
  };


  const handleRemoveItem = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.serviceId !== serviceId));
  };

  
  const handleUpdateQuantity = (serviceId: string, quantity: number | null) => {
    if (!quantity || quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity } : item,
      ),
    );
  };
  const handleUpdateNote = (serviceId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, note } : item,
      ),
    );
  };


  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );


  const handleSubmit = async () => {
    if (cart.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 dịch vụ");
      return;
    }

    setLoading(true);
    try {
      // FIX MẸO: Gọi API thêm dịch vụ vào đơn booking
      // payload thường là: { items: cart.map(c => ({ serviceId: c.serviceId, quantity: c.quantity, note: c.note })) }
      // await bookingService.addExtraServices(booking.bookingId, payload);

      message.success("Đã thêm dịch vụ vào đơn thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      message.error("Lỗi khi thêm dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ShoppingCartOutlined /> Bán thêm dịch vụ - Mã đơn:{" "}
          {booking?.bookingId?.substring(0, 8)}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1100} // Form POS cần rộng để hiển thị 2 cột
      footer={null}
      style={{ top: 20 }}
    >
      <Row gutter={24} style={{ height: "65vh" }}>
        {/* CỘT TRÁI: TÌM KIẾM VÀ CHỌN DỊCH VỤ */}
        <Col
          span={10}
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Input
            placeholder="Tìm kiếm dịch vụ..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            <Row gutter={[12, 12]}>
              {filteredServices.map((service) => (
                <Col span={12} key={service.id}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => handleAddToCart(service)}
                    style={{ height: "100%", borderColor: "#d9d9d9" }}
                    bodyStyle={{ padding: 12, textAlign: "center" }}
                  >
                    <Text
                      strong
                      style={{ display: "block", marginBottom: 8, height: 40 }}
                    >
                      {service.name}
                    </Text>
                    <Text type="danger" strong>
                      {service.price.toLocaleString("vi-VN")}đ
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
            {filteredServices.length === 0 && (
              <div
                style={{ textAlign: "center", marginTop: 50, color: "#999" }}
              >
                Không tìm thấy dịch vụ nào
              </div>
            )}
          </div>
        </Col>

        {/* CỘT PHẢI: CHI TIẾT GIỎ HÀNG */}
        <Col
          span={14}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderLeft: "1px solid #f0f0f0",
            paddingLeft: 24,
          }}
        >
          <Title level={5}>Dịch vụ đã chọn</Title>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: 12,
              background: "#fafafa",
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{ textAlign: "center", marginTop: 100, color: "#999" }}
              >
                Giỏ hàng trống
              </div>
            ) : (
              <List
                dataSource={cart}
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      background: "#fff",
                      marginBottom: 8,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #e8e8e8",
                    }}
                  >
                    <Row style={{ width: "100%" }} align="middle">
                      <Col span={1}>
                        <Text strong>{index + 1}.</Text>
                      </Col>
                      <Col span={9}>
                        <Text strong>{item.name}</Text>
                        <Input
                          size="small"
                          placeholder="Ghi chú (nếu có)..."
                          value={item.note}
                          onChange={(e) =>
                            handleUpdateNote(item.serviceId, e.target.value)
                          }
                          style={{ marginTop: 8, fontSize: 12 }}
                        />
                      </Col>
                      <Col span={6} style={{ textAlign: "center" }}>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) =>
                            handleUpdateQuantity(item.serviceId, val)
                          }
                        />
                      </Col>
                      <Col span={6} style={{ textAlign: "right" }}>
                        <Text strong type="danger">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </Text>
                      </Col>
                      <Col span={2} style={{ textAlign: "right" }}>
                        <Popconfirm
                          title="Bỏ dịch vụ này?"
                          onConfirm={() => handleRemoveItem(item.serviceId)}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            )}
          </div>

          <Divider style={{ margin: "16px 0" }} />

          <Row
            align="middle"
            justify="space-between"
            style={{ marginBottom: 16 }}
          >
            <Text strong style={{ fontSize: 18 }}>
              Tổng cộng:
            </Text>
            <Text strong type="danger" style={{ fontSize: 24 }}>
              {totalPrice.toLocaleString("vi-VN")}đ
            </Text>
          </Row>

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={onClose}>Hủy bỏ</Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={cart.length === 0}
                style={{ background: "#52c41a" }}
              >
                Xác nhận thêm dịch vụ
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
}
