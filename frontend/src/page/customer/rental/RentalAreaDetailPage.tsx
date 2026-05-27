import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, ConfigProvider, message, DatePicker } from "antd";
import dayjs from "dayjs";

import { useAuth } from "../../../context/AuthContext";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";
import courtService from "../../../service/courtService";

import BookingConfirmModal from "../bookings/BookingConfirmModal";
import ReviewSection from "../../../components/review/ReviewSection";
import BookingMatchTabs from "./BookingMatchTabs";


import CourtScheduleTab from "./CourtScheduleTab";
import CourtInfoTab from "./CourtInfoTab";
import CourtPriceTab from "./CourtPriceTab";

export default function RentalAreaDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [activeCourt, setActiveCourt] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("schedule");
  const [openModal, setOpenModal] = useState(false);
  const [cartToSubmit, setCartToSubmit] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState({
    userName: "",
    userPhone: "",
    note: "",
  });

  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  useEffect(() => {
    if (user) {
      setUserInfo((prev) => ({
        ...prev,
        userName: user.userName || prev.userName,
        userPhone: user.phone || prev.userPhone,
      }));
    }
  }, [user]);

  const fetchDetail = async () => {
    try {
      const res = await rentalService.getRentalAreaById(id!);
      if (res.code === 200) {
        const courts = res.result.courts || [];
        const detailedCourts = await Promise.all(
          courts.map(async (court: any) => {
            try {
              const courtDetail = await courtService.getCourtById(
                court.courtId,
              );
              return courtDetail.result;
            } catch (err) {
              return court;
            }
          }),
        );

        const mergedData = { ...res.result, courts: detailedCourts };
        setData(mergedData);
        if (detailedCourts.length > 0) setActiveCourt(detailedCourts[0]);
      }
    } catch (error) {
      message.error("Không thể tải thông tin khu vực sân");
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

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
      message.info("Vui lòng nhập tên và số điện thoại liên hệ");
      return;
    }

    const slotRequests = cartToSubmit.map((item) => ({
      courtId: item.court.courtId,
      quantity: item.quantity,
      startTime: `${item.date}T${item.startTime}:00`,
      endTime: `${item.date}T${item.endTime}:00`,
    }));

    const payload = {
      userId: user?.userId || null,
      userName: userInfo.userName.trim(),
      userPhone: userInfo.userPhone.trim(),
      note: userInfo.note,
      slotRequests,
    };

    try {
      const res = await bookingService.createBooking(payload);
      if (res.code === 201 || res.code === 200) {
        message.success("Đặt sân thành công! Đang chuyển hướng thanh toán...");
        navigate(`/payment/${res.result.bookingIntentId}`);
      } else {
        message.error(res.message || "Đặt sân thất bại");
      }
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 2003 && errRes?.result) {
        message.error(Object.values(errRes.result)[0] as string);
      } else {
        message.error(
          errRes?.message || "Hệ thống đang bận, vui lòng thử lại sau",
        );
      }
    }
  };

  if (!data || !activeCourt)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 animate-pulse text-lg">
          Đang tải dữ liệu sân...
        </p>
      </div>
    );

  const getTabClass = (tabName: string) =>
    activeTab === tabName
      ? "text-orange-300 border-b-2 border-orange-300 pb-1"
      : "hover:text-gray-200 pb-1 transition-colors";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ea580c",
          colorInfo: "#9156F1",
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      <div className="min-h-screen bg-[#F8F9FA] text-gray-700 font-sans w-full pb-16">
        <div className="max-w-[1400px] mx-auto px-4 pt-16">
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={17}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
                <div className="flex justify-between items-center bg-[#9156F1] text-white p-3">
                  <div className="flex gap-4 font-medium ml-2">
                    <button
                      onClick={() => setActiveTab("schedule")}
                      className={getTabClass("schedule")}
                    >
                      Xem lịch
                    </button>
                    <button
                      onClick={() => setActiveTab("info")}
                      className={getTabClass("info")}
                    >
                      Thông tin sân
                    </button>
                    <button
                      onClick={() => setActiveTab("price")}
                      className={getTabClass("price")}
                    >
                      Bảng giá
                    </button>
                    <button
                      onClick={() => setActiveTab("review")}
                      className={getTabClass("review")}
                    >
                      Đánh giá
                    </button>
                  </div>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    format="DD/MM/YYYY"
                    className="rounded-md"
                    allowClear={false}
                  />
                </div>

                {activeTab === "schedule" && (
                  <CourtScheduleTab
                    data={data}
                    selectedDate={selectedDate}
                    setActiveCourt={setActiveCourt}
                    setSelectedTime={setSelectedTime}
                    setSelectedDuration={setSelectedDuration}
                  />
                )}
                {activeTab === "info" && (
                  <CourtInfoTab
                    activeCourt={activeCourt}
                    data={data}
                    onSelectCourt={setActiveCourt}
                  />
                )}
                {activeTab === "price" && (
                  <CourtPriceTab activeCourt={activeCourt} />
                )}
                {activeTab === "review" && (
                  <div className="p-6 animate-in fade-in duration-300">
                    <ReviewSection rentalAreaId={id!} />
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} lg={7}>
              <BookingMatchTabs
                court={activeCourt}
                data={data}
                onBook={handleDirectBooking}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedDuration={selectedDuration}
              />
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
