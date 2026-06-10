import { useEffect, useState } from "react";
import { Card, Select, Space, message, Typography, Modal } from "antd";
import { useSearchParams } from "react-router-dom";

import courtService from "../../../../service/courtService";
import rentalAreaService from "../../../../service/rental/rentalService";
import SlotCalendar from "../../court/SlotCalendar";
import type { CourtResponse } from "../../../../types/court";
import bookingService from "../../../../service/bookingService";
import OwnerSharedBookingPanel from "../booking-share/OwnerSharedBookingPanel";

const { Text } = Typography;

export default function ManageSchedulePage() {
  const [searchParams] = useSearchParams();

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [courts, setCourts] = useState<CourtResponse[]>([]);

  const [selectedArea, setSelectedArea] = useState<string>();
  const [selectedCourt, setSelectedCourt] = useState<string>("ALL");

  const [courtCopies, setCourtCopies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingShare, setSubmittingShare] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [slotToShare, setSlotToShare] = useState<any>(null);

  useEffect(() => {
    loadRentalAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadCourts(selectedArea);
    }
  }, [selectedArea]);

  const loadRentalAreas = async () => {
    try {
      const res = await rentalAreaService.getMyRentalAreas();
      const data = res.result?.data || [];

      setRentalAreas(data);

      const courtIdFromUrl = searchParams.get("courtId");

      if (data.length > 0) {
        setSelectedArea(data[0].rentalAreaId);
      }

      if (courtIdFromUrl) {
        setSelectedCourt(courtIdFromUrl);
      }
    } catch {
      message.error("Không tải được tòa nhà");
    }
  };

  const loadCourts = async (areaId: string) => {
    try {
      setLoading(true);

      const res = await courtService.getCourtsByRentalArea(areaId, 1, 100);

      const courtList = res.result?.data || [];

      setCourts(courtList);

      const courtIdFromUrl = searchParams.get("courtId");

      if (courtIdFromUrl) {
        setSelectedCourt(courtIdFromUrl);
        await loadOneCourtDetail(courtIdFromUrl);
        return;
      }

      setSelectedCourt("ALL");
      await loadAllCourtDetails(courtList);
    } catch {
      message.error("Không tải được danh sách sân");
    } finally {
      setLoading(false);
    }
  };

  const loadAllCourtDetails = async (courtList: CourtResponse[]) => {
    try {
      const details = await Promise.all(
        courtList.map((court) => courtService.getCourtById(court.courtId)),
      );

      const allCopies = details.flatMap((res) => res.result?.courtCopies || []);

      setCourtCopies(allCopies);
    } catch {
      setCourtCopies([]);
      message.error("Không tải được lịch các sân");
    }
  };

  const loadOneCourtDetail = async (courtId: string) => {
    try {
      setLoading(true);

      const res = await courtService.getCourtById(courtId);

      setCourtCopies(res.result?.courtCopies || []);
    } catch {
      setCourtCopies([]);
      message.error("Không tải được lịch sân");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCourt = async (value: string) => {
    setSelectedCourt(value);

    if (value === "ALL") {
      await loadAllCourtDetails(courts);
      return;
    }

    await loadOneCourtDetail(value);
  };

  const handleOpenShareBooking = (slotInfo: any) => {
    setSlotToShare(slotInfo);
    setShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    if (submittingShare) {
      return;
    }

    setShareModalVisible(false);
    setSlotToShare(null);
  };

  const handleSubmitShareBooking = async (
    maxParticipants: number,
    minParticipants: number,
  ) => {
    if (!slotToShare) {
      message.warning("Vui lòng chọn khung giờ tạo kèo");
      return;
    }

    if (minParticipants > maxParticipants) {
      message.warning("Số người tối thiểu không được lớn hơn số người tối đa");
      return;
    }

    try {
      setSubmittingShare(true);

      const payload = {
        customerName: "Owner Match",
        phone: "0000000000",
        note: "Kèo vãng lai do chủ sân tạo",
        paidAmount: 0,
        paymentMethod: "CASH",
        bookingType: "SHARED" as const,

        maxParticipants,
        minParticipants,

        slots: [
          {
            courtCopyId: slotToShare.courtCopyId,
            startTime: `${slotToShare.date}T${slotToShare.startTime}:00`,
            endTime: `${slotToShare.date}T${slotToShare.endTime}:00`,
          },
        ],
      };

      const response = await bookingService.createOwnerBooking(payload);

      if (response.code !== 200 && response.code !== 201) {
        message.error(response.message || "Không thể tạo kèo vãng lai");
        return;
      }

      message.success(
        "Tạo kèo vãng lai thành công! Người chơi đã có thể đăng ký.",
      );

      setShareModalVisible(false);
      setSlotToShare(null);

      if (selectedCourt === "ALL") {
        await loadAllCourtDetails(courts);
      } else {
        await loadOneCourtDetail(selectedCourt);
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Lỗi khi tạo kèo vãng lai",
      );
    } finally {
      setSubmittingShare(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <Card
        bordered
        className="rounded-xl"
        style={{
          marginBottom: 16,
          boxShadow: "none",
        }}
      >
        <Space wrap size={16}>
          <div>
            <Text strong>Tòa nhà</Text>

            <Select
              style={{
                width: 260,
                marginLeft: 8,
              }}
              placeholder="Chọn tòa nhà"
              value={selectedArea}
              onChange={(value) => {
                setSelectedArea(value);
                setSelectedCourt("ALL");
                setCourtCopies([]);
              }}
              options={rentalAreas.map((rentalArea) => ({
                label: rentalArea.rentalAreaName,
                value: rentalArea.rentalAreaId,
              }))}
            />
          </div>

          <div>
            <Text strong>Sân</Text>

            <Select
              style={{
                width: 260,
                marginLeft: 8,
              }}
              placeholder="Chọn sân"
              value={selectedCourt}
              onChange={handleChangeCourt}
              options={[
                {
                  label: "Tất cả sân",
                  value: "ALL",
                },
                ...courts.map((court) => ({
                  label: court.courtName,
                  value: court.courtId,
                })),
              ]}
            />
          </div>
        </Space>
      </Card>

      <SlotCalendar
        courtCopies={courtCopies}
        loading={loading}
        onSlotClick={handleOpenShareBooking}
      />

      <Modal
        title="Tạo kèo vãng lai"
        open={shareModalVisible}
        onCancel={handleCloseShareModal}
        footer={null}
        width={560}
        centered
        destroyOnClose
        closable={!submittingShare}
        maskClosable={!submittingShare}
        styles={{
          body: {
            maxHeight: "75vh",
            overflowY: "auto",
          },
        }}
      >
        <OwnerSharedBookingPanel
          selectedSlot={slotToShare}
          submitting={submittingShare}
          onBook={handleSubmitShareBooking}
          onCancel={handleCloseShareModal}
        />
      </Modal>
    </div>
  );
}
