import { useEffect, useState } from "react";
import { Card, Select, Space, message } from "antd";
import { useSearchParams } from "react-router-dom";

import courtService from "../../../../service/courtService";
import rentalAreaService from "../../../../service/rental/rentalService";

import SlotCalendar from "../../court/SlotCalendar";

import type { CourtResponse } from "../../../../types/court";

export default function ManageSchedulePage() {
  const [searchParams] = useSearchParams();

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>();
  const [selectedCourt, setSelectedCourt] = useState<string>();

  const [courtCopies, setCourtCopies] = useState<any[]>([]);

  useEffect(() => {
    loadRentalAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) loadCourts(selectedArea);
  }, [selectedArea]);

  useEffect(() => {
    if (selectedCourt) loadCourtDetail(selectedCourt);
  }, [selectedCourt]);

  useEffect(() => {
    const courtId = searchParams.get("courtId");
    if (courtId) setSelectedCourt(courtId);
  }, []);

  const loadRentalAreas = async () => {
    try {
      const res = await rentalAreaService.getMyRentalAreas();
      setRentalAreas(res.result?.data || []);
    } catch {
      message.error("Không tải được tòa nhà");
    }
  };

  const loadCourts = async (areaId: string) => {
    try {
      const res = await courtService.getCourtsByRentalArea(areaId, 1, 100);
      setCourts(res.result?.data || []);
    } catch {
      message.error("Không tải được danh sách sân");
    }
  };

  const loadCourtDetail = async (courtId: string) => {
    try {
      const res = await courtService.getCourtById(courtId);
      setCourtCopies(res.result?.courtCopies || []);
    } catch {
      message.error("Không tải được lịch sân");
    }
  };

  return (
    <div className="p-4">
      <Space style={{ marginBottom: 16 }}>
        <div>Tòa nhà:</div>

        <Select
          style={{ width: 220 }}
          placeholder="Chọn tòa nhà"
          value={selectedArea}
          onChange={(v) => setSelectedArea(v)}
          options={rentalAreas.map((r) => ({
            label: r.rentalAreaName,
            value: r.rentalAreaId,
          }))}
        />

        <div>Sân:</div>

        <Select
          style={{ width: 220 }}
          placeholder="Chọn sân"
          value={selectedCourt}
          onChange={(v) => setSelectedCourt(v)}
          options={courts.map((c) => ({
            label: c.courtName,
            value: c.courtId,
          }))}
        />
      </Space>

      <SlotCalendar courtCopies={courtCopies} />
    </div>
  );
}
