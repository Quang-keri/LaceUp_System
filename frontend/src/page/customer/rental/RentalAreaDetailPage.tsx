import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, ConfigProvider, Table } from "antd";
import { toast } from "react-toastify";

import { useAuth } from "../../../context/AuthContext";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import CourtBookingPanel from "./CourtBookingPanel";
import OtherCourtsList from "./OtherCourtsList";
import BookingConfirmModal from "../bookings/BookingConfirmModal";

export default function RentalAreaDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [activeCourt, setActiveCourt] = useState<any>(null);

  const [openModal, setOpenModal] = useState(false);
  const [cartToSubmit, setCartToSubmit] = useState<any[]>([]);

  const [userInfo, setUserInfo] = useState({
    userName: "",
    userPhone: "",
    note: "",
  });

  useEffect(() => {
    if (user) {
      setUserInfo((prev) => ({
        ...prev,
        userName: user.userName || user.fullName || prev.userName,
        userPhone: user.phone || user.phoneNumber || prev.userPhone,
      }));
    }
  }, [user]);

  const fetchDetail = async () => {
    try {
      const res = await rentalService.getRentalAreaById(id!);
      if (res.code === 200) {
        setData(res.result);
        if (res.result.courts && res.result.courts.length > 0) {
          setActiveCourt(res.result.courts[0]);
        }
      }
    } catch (error) {
      toast.error("Không thể tải thông tin khu vực sân");
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!data || !activeCourt)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 animate-pulse text-lg">
          Đang tải dữ liệu sân...
        </p>
      </div>
    );

  const handleDirectBooking = (bookingData: any) => {
    setCartToSubmit([
      {
        court: activeCourt,
        date: bookingData.date,
        startTime: bookingData.start,
        endTime: bookingData.end,
        quantity: bookingData.quantity,
      },
    ]);
    setOpenModal(true);
  };

  const submitBooking = async () => {
    if (!userInfo.userName.trim() || !userInfo.userPhone.trim()) {
      toast.warn("Vui lòng nhập tên và số điện thoại liên hệ");
      return;
    }

    const slotRequests = cartToSubmit.map((item) => ({
      courtId: item.court.courtId,
      quantity: item.quantity,
      startTime: `${item.date}T${item.startTime}:00`,
      endTime: `${item.date}T${item.endTime}:00`,
    }));

    const payload = {
      userId: user?.id || user?.userId || null,
      userName: userInfo.userName.trim(),
      userPhone: userInfo.userPhone.trim(),
      note: userInfo.note,
      slotRequests,
    };

    try {
      const res = await bookingService.createBooking(payload);
      if (res.code === 201 || res.code === 200) {
        toast.success("Đặt sân thành công! Đang chuyển hướng thanh toán...");
        navigate(`/payment/${res.result.bookingIntentId}`);
      } else {
        toast.error(res.message || "Đặt sân thất bại");
      }
    } catch (error: any) {
      // Bắt lỗi Validation (Code 2003) từ Backend
      const errRes = error.response?.data;

      if (errRes?.code === 2003 && errRes?.result) {
        // Lấy thông báo lỗi đầu tiên trong object result (VD: "Không thể đặt phòng trong quá khứ")
        const firstErrorMessage = Object.values(errRes.result)[0] as string;
        toast.error(firstErrorMessage);
      } else {
        // Lỗi 500 hoặc lỗi mạng khác
        toast.error(
          errRes?.message || "Hệ thống đang bận, vui lòng thử lại sau",
        );
      }
    } finally {
      // Bạn có thể thêm finally ở đây nếu cần tắt loading
    }
  };

  const handleChatClick = () => {
    // 1. Kiểm tra xem dữ liệu 'data' đã được load chưa
    if (!data) {
      toast.warn("Đang tải dữ liệu, vui lòng đợi trong giây lát");
      return;
    }

    // 2. Lấy ID chủ sân (thường là ownerId hoặc userId tùy theo API của bạn)
    // Và tên chủ sân để hiển thị trong khung chat
    const ownerId = data.ownerId || data.userId;
    const ownerName = data.contactName || data.ownerName || "Chủ sân";

    if (!ownerId) {
      toast.error("Không tìm thấy ID chủ sân để bắt đầu chat");
      console.error("Dữ liệu API thiếu ownerId:", data);
      return;
    }

    // 3. Dispatch event để mở Modal/Component Chat
    const event = new CustomEvent("OPEN_CHAT_WITH_USER", {
      detail: {
        userId: ownerId,
        userName: ownerName,
      },
    });

    window.dispatchEvent(event);
  };

  // Cấu hình cột cho Bảng giá
  const priceColumns = [
    {
      title: "Khung giờ",
      dataIndex: "time",
      key: "time",
      className: "font-medium text-gray-700",
    },
    {
      title: "Loại giá",
      dataIndex: "type",
      key: "type",
      className: "text-gray-600",
    },
    {
      title: "Giá / Giờ",
      dataIndex: "price",
      key: "price",
      render: (val: number) => (
        <span className="text-[#3B82F6] font-semibold">
          {val.toLocaleString()} đ
        </span>
      ),
    },
  ];

  // Map dữ liệu priceRules từ API
  const getPriceData = (rules: any[]) => {
    if (!rules || rules.length === 0) return [];

    return rules.map((rule, index) => {
      // Hàm format HH:mm:ss -> HH:mm
      const formatTime = (timeStr: string) =>
        timeStr ? timeStr.substring(0, 5) : "";

      // Dịch loại giá
      let typeLabel = rule.priceType;
      if (rule.priceType === "NORMAL") typeLabel = "Ngày thường";
      if (rule.priceType === "WEEKEND") typeLabel = "Cuối tuần / Lễ";
      if (rule.specificDate) typeLabel = `Ngày ${rule.specificDate}`;

      return {
        key: rule.courtPriceId || index,
        time: `${formatTime(rule.startTime)} - ${formatTime(rule.endTime)}`,
        type: typeLabel,
        price: rule.pricePerHour,
      };
    });
  };

  const priceData = getPriceData(activeCourt.priceRules);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1",
          colorInfo: "#3B82F6",
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      <div className="min-h-screen bg-[#F8F9FA] text-gray-700 font-sans w-full pb-16">
        {/* Banner/Header */}
        <div className="bg-white border-b border-gray-200 pt-6 pb-4 mb-8">
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {data.rentalName}
              </h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <span className="text-[#9156F1]"></span> {data.address}
              </p>
            </div>

            <button
              onClick={handleChatClick}
              className="bg-white border border-[#9156F1] text-[#9156F1] hover:bg-[#9156F1] hover:text-white px-5 py-2.5 rounded-lg transition-all font-semibold flex items-center gap-2 w-fit shadow-sm"
            >
              <span></span> Nhắn tin chủ sân
            </button>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4">
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={16}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-8">
                <div className="relative h-[400px] w-full bg-gray-100">
                  <img
                    src={
                      activeCourt.coverImage ||
                      "https://placehold.co/800x500?text=San+The+Thao"
                    }
                    alt={activeCourt.courtName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold text-[#9156F1] shadow">
                    {activeCourt.categoryName || "Sân Thể Thao"}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {activeCourt.courtName}
                    </h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      Tổng cộng: {activeCourt.totalCourts} sân
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {activeCourt.description ||
                      "Mặt sân đạt chuẩn, hệ thống chiếu sáng chống chói, không gian thoáng đãng. Thích hợp cho tập luyện và thi đấu giao lưu."}
                  </p>

                  {/* Bảng giá tự động */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span></span> Bảng giá tham khảo
                    </h3>
                    {priceData.length > 0 ? (
                      <Table
                        columns={priceColumns}
                        dataSource={priceData}
                        pagination={false}
                        size="small"
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                      />
                    ) : (
                      <p className="text-gray-500 italic">
                        Sân này hiện chưa có thông tin bảng giá chi tiết.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#9156F1] rounded-full"></span>
                  Các sân khác tại cơ sở
                </h3>
                <OtherCourtsList
                  courts={data.courts}
                  activeCourtId={activeCourt.courtId}
                  onSelectCourt={setActiveCourt}
                />
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div className="sticky top-6">
                <CourtBookingPanel
                  court={activeCourt}
                  onBook={handleDirectBooking}
                />
              </div>
            </Col>
          </Row>

          <BookingConfirmModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            cart={cartToSubmit}
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            onConfirm={submitBooking}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
