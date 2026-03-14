import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col } from "antd";
import { toast } from "react-toastify";

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
    const slotRequests = cart.map((item) => ({
      courtId: item.court.courtId,
      quantity: item.quantity,
      startTime: `${item.date}T${item.startTime}:00`,
      endTime: `${item.date}T${item.endTime}:00`,
    }));

    const payload = {
      userName: userInfo.userName,
      userPhone: userInfo.userPhone,
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

      <div className="grid grid-cols-12 gap-8 mt-6">
        <div className="col-span-8">
          <RentalInfo rental={data} />
        </div>

        <div className="col-span-4">
          <HostCard rental={data} />
        </div>
      </div>

      <Row gutter={24} style={{ marginTop: 32 }}>
        <Col span={24}>
          <BookingSearchBar filter={filter} setFilter={setFilter} />
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={16}>
          <CourtList courts={data.courts} onAddCourt={addCourt} />
        </Col>

        <Col span={8}>
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
