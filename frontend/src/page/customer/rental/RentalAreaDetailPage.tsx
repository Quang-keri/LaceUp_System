import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col } from "antd";
import { toast } from "react-toastify";

import { useAuth } from "../../../context/AuthContext"; // điều chỉnh path nếu cần

import rentalService from "../../../service/rental/rentalService";
import bookingService from "../../../service/bookingService";

import RentalGallery from "./RentalGallery";
import RentalInfo from "./RentalInfo";
import HostCard from "./HostCard";

import BookingSearchBar from "../bookings/BookingSearchBar";
import CourtList from "../../../components/court/CourtList";
import BookingCart from "../bookings/BookingCart";
import BookingConfirmModal from "../bookings/BookingConfirmModal";

interface BookingFilter {
  date: string;
  start: string;
  end: string;
}

type CartItem = {
  court: any;
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
};

export default function RentalAreaDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [userInfo, setUserInfo] = useState({
    userName: "",
    userPhone: "",
    note: "",
  });

  const [filter, setFilter] = useState<BookingFilter>({
    date: "",
    start: "07:00",
    end: "09:00",
  });

  // Sync userName từ auth user khi login/logout
  useEffect(() => {
    setUserInfo((prev) => ({
      ...prev,
      userName: user?.userName ?? "",
    }));
  }, [user]);

  const fetchDetail = async () => {
    const res = await rentalService.getRentalAreaById(id!);
    if (res.code === 200) {
      setData(res.result);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!data) return <p>Loading...</p>;
  const getPriceByTime = (
    court: any,
    dateStr: string,
    start: string,
    end: string,
  ) => {
    if (!court.priceRules || court.priceRules.length === 0) {
      return (court.price || 0) * calculateDiffHours(start, end);
    }

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const isWeekend = (dStr: string) => {
      const day = new Date(dStr).getDay();
      return day === 0 || day === 6;
    };

    const weekend = isWeekend(dateStr);
    let totalPrice = 0;
    let currentMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);

    while (currentMins < endMins) {
      // 1. Tìm rule phù hợp nhất tại thời điểm currentMins
      const applicableRules = court.priceRules.filter((r: any) => {
        const rStart = timeToMinutes(r.startTime);
        const rEnd = r.endTime === "00:00:00" ? 1440 : timeToMinutes(r.endTime);

        const timeMatch = currentMins >= rStart && currentMins < rEnd;
        if (!timeMatch) return false;

        // Ưu tiên ngày cụ thể trước
        if (r.specificDate) return r.specificDate === dateStr;

        // Nếu không có ngày cụ thể, dùng loại ngày
        if (weekend)
          return r.priceType === "WEEKEND" || r.priceType === "NORMAL";
        return r.priceType === "NORMAL" || r.priceType === "PEAK"; // Thêm logic ngày thường của bạn ở đây
      });

      // 2. Sắp xếp: SpecificDate -> Priority
      applicableRules.sort((a: any, b: any) => {
        if (a.specificDate && !b.specificDate) return -1;
        if (!a.specificDate && b.specificDate) return 1;
        return (b.priority || 0) - (a.priority || 0);
      });

      const rule = applicableRules[0];

      if (!rule) {
        // Nếu không có rule, dùng giá gốc của sân
        const nextStep = endMins;
        totalPrice += (court.price || 0) * ((nextStep - currentMins) / 60);
        currentMins = nextStep;
      } else {
        const rEndMins =
          rule.endTime === "00:00:00" ? 1440 : timeToMinutes(rule.endTime);
        const nextStep = Math.min(rEndMins, endMins);
        const hours = (nextStep - currentMins) / 60;
        totalPrice += rule.pricePerHour * hours;
        currentMins = nextStep;
      }
    }

    return totalPrice;
  };
  const validateFilter = () => {
    if (!filter.date) {
      toast.warn("Vui lòng chọn ngày");
      return false;
    }
    if (filter.start >= filter.end) {
      toast.warn("Giờ kết thúc phải lớn hơn giờ bắt đầu");
      return false;
    }
    return true;
  };

  const getAvailableCopies = (court: any) => {
    return court.courtCopies.filter((c: any) => c.status === "ACTIVE").length;
  };

  const addCourt = (court: any) => {
    if (!validateFilter()) return;

    const maxCopies = getAvailableCopies(court);

    setCart((prev) => {
      const index = prev.findIndex(
        (item) =>
          item.court.courtId === court.courtId &&
          item.date === filter.date &&
          item.startTime === filter.start &&
          item.endTime === filter.end,
      );

      if (index !== -1) {
        const copy = [...prev];
        const newQty = copy[index].quantity + 1;
        copy[index] = {
          ...copy[index],
          quantity: Math.min(newQty, maxCopies),
        };
        return copy;
      }

      return [
        ...prev,
        {
          court,
          date: filter.date,
          startTime: filter.start,
          endTime: filter.end,
          quantity: 1,
        },
      ];
    });
  };

  const handleOpenModal = () => {
    if (cart.length === 0) {
      toast.warn("Vui lòng chọn khung giờ và thêm sân vào giỏ");
      return;
    }
    setOpenModal(true);
  };

  const increase = (index: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const maxCopies = getAvailableCopies(copy[index].court);
      copy[index] = {
        ...copy[index],
        quantity: Math.min(copy[index].quantity + 1, maxCopies),
      };
      return copy;
    });
  };

  const decrease = (index: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity - 1;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = {
          ...copy[index],
          quantity: newQty,
        };
      }
      return copy;
    });
  };

  const submitBooking = async () => {
    if (!userInfo.userName.trim() || !userInfo.userPhone.trim()) {
      toast.warn("Vui lòng nhập tên và số điện thoại");
      return;
    }

    const slotRequests = cart.map((item) => ({
      courtId: item.court.courtId,
      quantity: item.quantity,
      startTime: `${item.date}T${item.startTime}:00`,
      endTime: `${item.date}T${item.endTime}:00`,
    }));

    const payload = {
      userName: userInfo.userName.trim(),
      userPhone: userInfo.userPhone.trim(),
      note: userInfo.note,
      slotRequests,
    };

    const res = await bookingService.createBooking(payload);
    console.log("Response từ server:", res);

    if (res.code === 201 || res.code === 200) {
      navigate(`/payment/${res.result.bookingIntentId}`);
    }
  };

  return (
    <div className="max-w-[1150px] mx-auto px-4 mt-3">
      <RentalGallery rental={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8">
          <RentalInfo rental={data} />
        </div>
        <div className="lg:col-span-4">
          <HostCard rental={data} />
        </div>
      </div>

      <Row gutter={24} style={{ marginTop: 32 }}>
        <Col span={24}>
          <BookingSearchBar filter={filter} setFilter={setFilter} />
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-6">
        <Col xs={24} md={24} lg={16}>
          <CourtList
            courts={data.courts}
            onAddCourt={addCourt}
            filter={filter}
          />
        </Col>
        <Col xs={24} md={24} lg={8}>
          <BookingCart
            cart={cart}
            increase={increase}
            decrease={decrease}
            onOpenModal={handleOpenModal}
          />
        </Col>
      </Row>

      <BookingConfirmModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        cart={cart}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        onConfirm={submitBooking}
      />
    </div>
  );
}
