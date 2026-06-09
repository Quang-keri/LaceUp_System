import { useEffect, useState } from "react";
import { Row, Col, ConfigProvider, DatePicker, Spin, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { useAuth } from "../../../context/AuthContext";
import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import CourtScheduleTab from "./CourtScheduleTab";
import CourtInfoTab from "./CourtInfoTab";
import CourtPriceTab from "./CourtPriceTab";
import ReviewSection from "../../../components/review/ReviewSection";
import BookingMatchTabs from "./BookingMatchTabs";
import BookingConfirmModal from "../bookings/BookingConfirmModal";

import type { CourtResponse, CourtCopyResponse } from "../../../types/court";
import type { ApiErrorResponse } from "../../../types/ApiResponse";
import type { RentalAreaResponse } from "../../../types/rental";

export interface SelectedSlot {
  courtCopyId: string | number;
  date: string;
  startTime: string;
  endTime: string;
}

export default function RentalAreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<RentalAreaResponse | null>(null);
  const [activeCourt, setActiveCourt] = useState<CourtResponse | null>(null);

  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [cartToSubmit, setCartToSubmit] = useState<SelectedSlot[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [selectedJoinableSlot, setSelectedJoinableSlot] = useState<any>(null);

  const [bookingIntentData, setBookingIntentData] = useState<{
    bookingType: "PRIVATE" | "SHARED";
    maxParticipants?: number;
    hostSlots?: number;
  }>({ bookingType: "PRIVATE" });

  const [viewTab, setViewTab] = useState("schedule");
  const [bookingMode, setBookingMode] = useState("booking");

  const [userInfo, setUserInfo] = useState({
    userName: "",
    userPhone: "",
    note: "",
  });

  useEffect(() => {
    if (user) {
      setUserInfo((prev) => ({
        ...prev,
        userName: user.userName || prev.userName,
        userPhone: user.phone || prev.userPhone,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setSelectedSlots([]);
    setCartToSubmit([]);
    setSelectedJoinableSlot(null);
  }, [selectedDate]);

  useEffect(() => {
    if (data) {
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, data?.rentalAreaId]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const res = await rentalService.getRentalAreaById(id);
      if (res.code === 200) {
        const result = res.result;
        const courts = result.courts || [];
        setData(result);
        if (courts.length > 0) {
          setActiveCourt(courts[0]);
        }
      }
    } catch (error) {
      message.error("Không thể tải thông tin khu vực sân");
      console.log(error);
      navigate("/");
    }
  };

  const fetchSchedule = async () => {
    if (!id || !data) return;
    try {
      const date = selectedDate.format("YYYY-MM-DD");
      const res = await rentalService.getRentalAreaSchedule(id, date);
      if (res.code === 200) {
        const scheduleCopies: CourtCopyResponse[] =
          res.result?.courtCopies || [];
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            courts: mergeScheduleToCourts(prev.courts || [], scheduleCopies),
          };
        });
      }
    } catch (error) {
      message.error("Không thể tải lịch sân");
      console.log(error);
    }
  };

  const mergeScheduleToCourts = (
    courts: CourtResponse[],
    scheduleCopies: CourtCopyResponse[],
  ): CourtResponse[] => {
    return courts.map((court) => ({
      ...court,
      courtCopies: (court.courtCopies || []).map((copy: CourtCopyResponse) => {
        const matched = scheduleCopies.find(
          (s) => s.courtCopyId === copy.courtCopyId,
        );
        return {
          ...copy,
          slots: matched?.slots || [],
        };
      }),
    }));
  };

  const handleDirectBooking = (
    type: "PRIVATE" | "SHARED",
    extraData?: { maxParticipants?: number; hostSlots?: number },
  ) => {
    if (selectedSlots.length === 0) {
      message.info("Vui lòng chọn ít nhất 1 sân và khung giờ");
      return;
    }

    if (!user) {
      message.warning(
        "Đăng nhập để có trải nghiệm tốt nhất khi đặt lịch sân",
        1,
        () => navigate("/login"),
      );
      return;
    }

    if (!user.phone || user.phone.trim() === "") {
      message.warning(
        "Vui lòng cập nhật số điện thoại trước khi đặt sân",
        2,
        () => navigate("/profile"),
      );
      return;
    }

    setBookingIntentData({
      bookingType: type,
      maxParticipants: extraData?.maxParticipants,
      hostSlots: extraData?.hostSlots,
    });

    setCartToSubmit(selectedSlots);
    setOpenModal(true);
  };

  const submitBooking = async () => {
    if (!userInfo.userName.trim() || !userInfo.userPhone.trim()) {
      message.info(
        "Vui lòng nhập tên và số điện thoại, nếu đã đăng nhập thì vui lòng cập nhật thông tin cá nhân đầy đủ để đặt sân",
      );
      return;
    }

    if (cartToSubmit.length === 0) {
      message.info("Vui lòng chọn ít nhất 1 sân và khung giờ");
      return;
    }

    const slotRequests = cartToSubmit.map((item) => ({
      courtCopyId: item.courtCopyId,
      startTime: `${item.date}T${item.startTime}:00`,
      endTime: `${item.date}T${item.endTime}:00`,
    }));

    const payload = {
      userId: user?.userId || null,
      userName: userInfo.userName.trim(),
      userPhone: userInfo.userPhone.trim(),
      note: userInfo.note,
      bookingType: bookingIntentData.bookingType,
      maxParticipants: bookingIntentData.maxParticipants,
      hostSlots: bookingIntentData.hostSlots,
      slotRequests,
    };

    try {
      const res = await bookingService.createBooking(payload);

      if (res.code === 201 || res.code === 200) {
        message.success("Đặt sân thành công! Đang chuyển hướng thanh toán...");
        setOpenModal(false);
        setSelectedSlots([]);
        setCartToSubmit([]);
        navigate(`/payment/${res.result.bookingIntentId}`);
      } else {
        message.error(res.message || "Đặt sân thất bại");
      }
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      const errRes = apiError.response?.data;

      if (errRes?.code === 2003 && errRes?.result) {
        message.error(Object.values(errRes.result)[0] as string);
      } else {
        message.error(
          errRes?.message || "Hệ thống đang bận, vui lòng thử lại sau",
        );
      }
    }
  };

  const handleJoinShared = async (bookingId: string, quantity: number) => {
    try {
      const response = await bookingService.joinSharedBooking(
        bookingId,
        quantity,
      );

      if (response.code !== 200 && response.code !== 201) {
        message.error(response.message || "Không thể tham gia trận vãng lai.");
        return;
      }

      const participantId = response?.result?.participantId;

      if (!participantId) {
        message.error("Không tìm thấy thông tin vé vừa đăng ký.");
        return;
      }

      navigate(`/payment-ticket/${participantId}`);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Lỗi hệ thống khi vãng lai.",
      );
    }
  };

  if (!data || !activeCourt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <Spin size="large" />
        <p className="text-gray-500 font-medium mt-4">
          Đang tải thông tin khu sân...
        </p>
      </div>
    );
  }

  const getTabClass = (tabName: string) =>
    viewTab === tabName
      ? "text-orange-300 border-b-2 border-orange-300 pb-1"
      : "hover:text-gray-200 pb-1 transition-colors";

  const handleBookingModeChange = (tab: string) => {
    setBookingMode(tab);

    if (tab === "shared") {
      setSelectedSlots([]);
      setCartToSubmit([]);
      return;
    }

    setSelectedJoinableSlot(null);
  };

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
                      onClick={() => setViewTab("schedule")}
                      className={getTabClass("schedule")}
                    >
                      Xem lịch
                    </button>
                    <button
                      onClick={() => setViewTab("info")}
                      className={getTabClass("info")}
                    >
                      Thông tin sân
                    </button>
                    <button
                      onClick={() => setViewTab("price")}
                      className={getTabClass("price")}
                    >
                      Bảng giá
                    </button>
                    <button
                      onClick={() => setViewTab("review")}
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

                {viewTab === "schedule" && (
                  <CourtScheduleTab
                    data={data}
                    selectedDate={selectedDate}
                    setActiveCourt={setActiveCourt}
                    setSelectedTime={setSelectedTime}
                    setSelectedDuration={setSelectedDuration}
                    selectedSlots={selectedSlots}
                    setSelectedSlots={(slots: any) => {
                      setSelectedSlots(slots);
                      setSelectedJoinableSlot(null);
                    }}
                    activeTab={bookingMode}
                    setActiveTab={handleBookingModeChange}
                    onClickSharedSlot={(slot: any, courtCopy: any) => {
                      setSelectedSlots([]);
                      setCartToSubmit([]);

                      setSelectedJoinableSlot({
                        ...slot,
                        courtCopy,
                      });

                      setBookingMode("shared");
                    }}
                  />
                )}

                {viewTab === "info" && (
                  <CourtInfoTab
                    activeCourt={activeCourt}
                    data={data}
                    onSelectCourt={setActiveCourt}
                  />
                )}

                {viewTab === "price" && (
                  <CourtPriceTab activeCourt={activeCourt} />
                )}

                {viewTab === "review" && (
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
                selectedSlots={selectedSlots}
                priceRules={[]}
                activeTab={bookingMode}
                setActiveTab={handleBookingModeChange}
                selectedJoinableSlot={selectedJoinableSlot}
                onJoinShared={handleJoinShared}
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
