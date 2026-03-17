import { useEffect, useState } from "react";
import { Card, Button, Space, Skeleton, message } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import CourtCardList from "./CourtCardList";
import rentalService from "../../../service/rental/rentalService";
import courtService from "../../../service/courtService";

// import CourtTable from "./CourtTable";
import CreateCourtModal from "./CreateCourtModal";
import UpdateCourtModal from "./UpdateCourtModal";

import type { CourtResponse, CategoryResponse } from "../../../types/court";
import type { RentalAreaResponse } from "../../../types/rental";
import UpdateCourtPriceModal from "../court-price/UpdateCourtPriceModal";

export default function CourtManagementPage() {
  const { buildingId } = useParams();
  const navigate = useNavigate();

  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [building, setBuilding] = useState<RentalAreaResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtResponse | null>(null);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtResponse | null>(
    null,
  );

  useEffect(() => {
    if (!buildingId) return;

    loadBuilding();
    loadCourts();
    loadCategories();
  }, [buildingId]);

  const loadBuilding = async () => {
    try {
      const res = await rentalService.getRentalAreaById(buildingId!);
      setBuilding(res.result);
    } catch {
      message.error("Không tải được thông tin tòa nhà");
    }
  };

  const loadCourts = async () => {
    if (!buildingId) return;

    setLoading(true);

    try {
      const res = await courtService.getMyCourts(1, 100);

      const filtered = (res.result.data || []).filter(
        (court) => court.rentalAreaId === buildingId,
      );
      setCourts(filtered);
    } catch {
      message.error("Lỗi khi tải danh sách sân");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await courtService.getCategories();

      setCategories(res.result.data);
    } catch {
      message.error("Không tải được loại sân");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await courtService.deleteCourt(id);
      message.success("Xóa sân thành công");
      loadCourts();
    } catch {
      message.error("Xóa sân thất bại");
    }
  };

  if (!building) return <Skeleton active />;

  return (
    <div className="p-4">
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/owner/buildings/list")}
            />
            <div>
              <div>Quản lý sân</div>
              <div style={{ fontSize: 12 }}>{building.rentalAreaName}</div>
            </div>
          </Space>
        }
        extra={
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              setEditingCourt(null);
              setModalOpen(true);
            }}
          >
            Tạo sân
          </Button>
        }
      >
        <CourtCardList
          courts={courts}
          loading={loading}
          onEdit={(court) => {
            setEditingCourt(court);
            setModalOpen(true);
          }}
          onUpdatePrice={(court) => {
            setSelectedCourt(court);
            setPriceModalOpen(true);
          }}
          onManage={(court) => {
            navigate(`/owner/courts/${court.courtId}/copies`);
          }}
          onView={(court) => {
            navigate(`/owner/courts/${court.courtId}`);
          }}
          onDelete={(courtId: string) => handleDelete(courtId)}
        />
      </Card>

      <CreateCourtModal
        open={modalOpen && !editingCourt}
        onClose={() => setModalOpen(false)}
        categories={categories}
        buildingId={buildingId!}
        onSuccess={loadCourts}
      />

      <UpdateCourtModal
        open={modalOpen && !!editingCourt}
        onClose={() => {
          setModalOpen(false);
          setEditingCourt(null);
        }}
        categories={categories}
        court={editingCourt}
        onSuccess={loadCourts}
      />

      <UpdateCourtPriceModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        court={selectedCourt}
        onSuccess={loadCourts}
      />
    </div>
  );
}
