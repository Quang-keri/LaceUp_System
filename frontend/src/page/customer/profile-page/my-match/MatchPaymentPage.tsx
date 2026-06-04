import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Spin,
  message,
  Card,
  Radio,
  Button,
  Typography,
  Divider,
  Space,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../../context/AuthContext";
import matchService from "../../../../service/match/matchService";
import paymentService from "../../../../service/payment/paymentService";

const { Title, Text } = Typography;

export default function MatchPaymentPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [matchDetail, setMatchDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PAY_OS");

  useEffect(() => {
    if (!matchId) {
      message.error("Trận đấu không hợp lệ");
      navigate("/my-matches");
      return;
    }
    loadMatchIntent(matchId);
  }, [matchId]);

  const loadMatchIntent = async (id: string) => {
    try {
      setLoading(true);
      const res = await matchService.getMatchDetail(id);
      if (res.code === 200) {
        setMatchDetail(res.result);
      } else {
        message.error("Không tìm thấy thông tin trận đấu");
        navigate("/my-matches");
      }
    } catch (error) {
      message.error("Không tải được thông tin trận đấu");
      navigate("/my-matches");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!matchDetail) return;

    const myRegistration = matchDetail.participants?.find(
      (p: any) => p.userId === user?.userId,
    );

    if (!myRegistration) {
      message.error("Bạn không nằm trong danh sách đăng ký của trận đấu này");
      return;
    }

    try {
      setConfirming(true);

      const res = await paymentService.checkoutMatchJoin(
        myRegistration.registrationId,
        paymentMethod,
      );

      const result = res?.result;

      if (res.code === 201 && result) {
        if (result.mode === "REDIRECT" && result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }

        if (result.mode === "PENDING") {
          message.info(result.message || "Đang chờ xác nhận thanh toán");
          return;
        }

        if (result.mode === "BOOKED") {
          message.success("Thanh toán tiền sân thành công!");
          navigate("/my-matches");
          return;
        }
      } else {
        message.error(res.message || "Thanh toán thất bại");
      }
    } catch (error) {
      message.error("Thanh toán thất bại, vui lòng thử lại sau.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading || !matchDetail) {
    return (
      <div className="flex justify-center mt-24">
        <Spin size="large" />
      </div>
    );
  }

  const myInfo = matchDetail.participants?.find(
    (p: any) => p.userId === user?.userId,
  );
  const amountDue = myInfo?.amountDue ?? 0;

  return (
    <div className="max-w-[1100px] mx-auto mt-6 px-4">
      <Row gutter={20}>
        <Col xs={24} lg={16}>
          <Card
            title="Thông tin người đặt kèo"
            className="mb-4"
            style={{ borderRadius: "12px" }}
          >
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                Tên người chơi:{" "}
                <Text strong className="text-gray-800">
                  {user?.userName}
                </Text>
              </Text>
              <Text type="secondary">
                Số điện thoại:{" "}
                <Text strong className="text-gray-800">
                  {user?.phone || "Chưa cập nhật"}
                </Text>
              </Text>
            </Space>
          </Card>

          <Card
            title="Chi tiết trận đấu vãng lai"
            style={{ borderRadius: "12px" }}
          >
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <span className="text-xs text-purple-600 font-bold uppercase block mb-1">
                  Môn thể thao: {matchDetail.categoryName}
                </span>
                <Title level={4} style={{ margin: 0 }}>
                  Mã phòng:{" "}
                  <span className="font-mono text-purple-600">
                    {matchDetail.roomCode}
                  </span>
                </Title>
              </div>

              <Space direction="vertical" size="small">
                <div>
                  <CalendarOutlined className="text-orange-500 mr-2" />
                  <Text strong>Thời gian đấu: </Text>
                  <Text>
                    {new Date(matchDetail.startTime).toLocaleTimeString(
                      "vi-VN",
                      { hour: "2-digit", minute: "2-digit" },
                    )}{" "}
                    -
                    {new Date(matchDetail.startTime).toLocaleDateString(
                      "vi-VN",
                    )}
                  </Text>
                </div>

                <div>
                  <EnvironmentOutlined className="text-purple-500 mr-2" />
                  <Text strong>Cơ sở / Tên sân: </Text>
                  <Text>{matchDetail.courtName}</Text>
                </div>
              </Space>

              {matchDetail.note && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Text italic type="secondary">
                    Ghi chú phòng: {matchDetail.note}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Tóm tắt thanh toán"
            style={{ borderRadius: "12px" }}
            className="shadow-sm"
          >
            <Space direction="vertical" className="w-full" size="middle">
              <div className="flex justify-between">
                <Text type="secondary">Số người đăng ký hộ:</Text>
                <Text strong>{myInfo?.playerCount ?? 1} người</Text>
              </div>

              <div className="flex justify-between items-center bg-orange-50/50 p-2 rounded">
                <Text type="secondary" className="text-orange-700">
                  Tổng chi phí góp sân:
                </Text>
                <Text strong className="text-lg text-orange-600">
                  {Number(amountDue).toLocaleString("vi-VN")} đ
                </Text>
              </div>

              <Divider className="my-1" />

              <div>
                <Text strong className="block mb-3 text-gray-700">
                  Phương thức thanh toán
                </Text>
                <Radio.Group
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  value={paymentMethod}
                  className="w-full flex flex-col gap-2"
                >
                  <Radio value="PAY_OS" className="font-semibold text-gray-700">
                    <Space>
                      <WalletOutlined className="text-purple-600" /> Ví điện tử
                      PayOS
                    </Space>
                  </Radio>
                  <Radio value="VN_PAY" className="font-semibold text-gray-700">
                    <Space>
                      <CreditCardOutlined className="text-blue-500" /> Cổng
                      VNPay
                    </Space>
                  </Radio>
                </Radio.Group>
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={confirming}
                onClick={handleConfirm}
                className="!bg-[#9156F1] !border-[#9156F1] !text-white font-bold h-12 text-base mt-2 shadow-md hover:!bg-[#7c3aed] hover:!border-[#7c3aed] transition-colors"
                style={{ borderRadius: "8px" }}
              >
                Xác nhận thanh toán
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
