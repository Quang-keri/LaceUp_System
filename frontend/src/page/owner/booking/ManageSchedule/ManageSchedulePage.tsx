import { useEffect, useState } from "react";
import { Card, Select, Space, message, Typography } from "antd";
import { useSearchParams } from "react-router-dom";

import courtService from "../../../../service/courtService";
import rentalAreaService from "../../../../service/rental/rentalService";
import SlotCalendar from "../../court/SlotCalendar";
import type { CourtResponse } from "../../../../types/court";

const { Text } = Typography;

export default function ManageSchedulePage() {
  const [searchParams] = useSearchParams();

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>();
  const [selectedCourt, setSelectedCourt] = useState<string>("ALL");

  const [courtCopies, setCourtCopies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    const details = await Promise.all(
      courtList.map((court) => courtService.getCourtById(court.courtId)),
    );

    const allCopies = details.flatMap((res) => res.result?.courtCopies || []);
    setCourtCopies(allCopies);
  };

  const loadOneCourtDetail = async (courtId: string) => {
    try {
      setLoading(true);
      const res = await courtService.getCourtById(courtId);
      setCourtCopies(res.result?.courtCopies || []);
    } catch {
      message.error("Không tải được lịch sân");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCourt = async (value: string) => {
    setSelectedCourt(value);

    if (value === "ALL") {
      await loadAllCourtDetails(courts);
    } else {
      await loadOneCourtDetail(value);
    }
  };

  return (
    <div className="p-4 bg-[#f5f7fa] min-h-screen">
      <Card
        bordered={false}
        className="rounded-2xl shadow-sm"
        style={{ marginBottom: 16 }}
      >
        <Space wrap size={16}>
          <div>
            <Text strong>Tòa nhà</Text>
            <Select
              style={{ width: 260, marginLeft: 8 }}
              placeholder="Chọn tòa nhà"
              value={selectedArea}
              onChange={(v) => {
                setSelectedArea(v);
                setSelectedCourt("ALL");
              }}
              options={rentalAreas.map((r) => ({
                label: r.rentalAreaName,
                value: r.rentalAreaId,
              }))}
            />
          </div>

          <div>
            <Text strong>Sân</Text>
            <Select
              style={{ width: 260, marginLeft: 8 }}
              placeholder="Chọn sân"
              value={selectedCourt}
              onChange={handleChangeCourt}
              options={[
                { label: "Tất cả sân", value: "ALL" },
                ...courts.map((c) => ({
                  label: c.courtName,
                  value: c.courtId,
                })),
              ]}
            />
          </div>
        </Space>
      </Card>

      <SlotCalendar courtCopies={courtCopies} loading={loading} />
    </div>
  );
}
