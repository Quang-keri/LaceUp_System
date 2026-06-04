import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, MapPin } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import type { MatchResponse } from "../../../types/match.ts";
import JoinMatchModal from "./JoinMatchModal";
import MatchFilter from "./MatchFilter";
import { useNavigate } from "react-router-dom";
import { locationService } from "../../../service/locationService.ts";
import {
  Button,
  Input,
  message,
  Space,
  Row,
  Col,
  Spin,
  Empty,
  Typography,
  Pagination,
  Avatar,
} from "antd";
import MatchCard from "./MatchCard.tsx";
import rentalService from "../../../service/rental/rentalService.ts";

const { Title, Text } = Typography;

const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(
    null,
  );

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [roomCodeInput, setRoomCodeInput] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 12;

  // Lấy danh sách trận đấu
  const fetchMatches = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const response = await matchService.getOpenMatches({
        page: pageToFetch,
        size: PAGE_SIZE,
      });
      if (response.code === 200) {
        setMatches(response.result.data || []);
        setTotalElements(response.result.totalElements || 0);
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách toàn bộ Khu vực (Area) để làm data nguồn
  const fetchRentalAreas = async () => {
    try {
      const res = await rentalService.getAllRentalAreas(1, 100);
      if (res && res.result && res.result.data) {
        setRentalAreas(res.result.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin khu vực:", error);
    }
  };

  useEffect(() => {
    fetchMatches(currentPage);
    fetchRentalAreas();
  }, [currentPage]);

  useEffect(() => {
    locationService.getProvinces().then((data) => {
      setProvinces(data || []);
    });
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSortOrder("NEWEST");
    setSelectedLocation("");
    setSelectedWard("");
    setSelectedCategory("");
    setTypeFilter("ALL");
    setWards([]);
    setCurrentPage(1);
  };

  const handleOpenJoinModal = (match: MatchResponse) => {
    setSelectedMatch(match);
    setIsJoinModalOpen(true);
  };

  const handleJoinByRoomCode = () => {
    if (!roomCodeInput.trim()) return;

    matchService
      .joinMatchByCode(roomCodeInput)
      .then((res) => {
        if (res.code === 200) {
          message.success("Vào phòng thành công!");
          setRoomCodeInput("");
          fetchMatches(currentPage);
          navigate("/my-matches");
        }
      })
      .catch((err) =>
        message.error(err.response?.data?.message || "Mã không hợp lệ!"),
      );
  };

  const matchesWithArea = useMemo(() => {
    return matches.map((match) => {
      const matchedArea = rentalAreas.find((area) =>
        area.courtResponses?.some(
          (court: any) => court.courtName === match.courtName,
        ),
      );
      return { ...match, areaInfo: matchedArea };
    });
  }, [matches, rentalAreas]);

  const filteredMatches = matchesWithArea
    .filter((m) => ["OPEN", "READY", "CONFIRMED", "FULL"].includes(m.status))
    .filter((m) => typeFilter === "ALL" || m.matchType === typeFilter)
    .filter(
      (m) =>
        !selectedCategory ||
        m.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase()),
    )
    .filter((m) => {
      if (!selectedLocation && !selectedWard) return true;

      const areaAddress = m.areaInfo?.address || {};
      const cityString = String(areaAddress.city?.cityName || "").toLowerCase();
      const wardString = String(areaAddress.ward || "").toLowerCase();

      const matchCity =
        !selectedLocation ||
        cityString.includes(selectedLocation.toLowerCase());
      const matchWard =
        !selectedWard || wardString.includes(selectedWard.toLowerCase());

      return matchCity && matchWard;
    })
    .sort((a, b) => {
      if (sortOrder === "PRICE_ASC")
        return Number(a.courtPrice || 0) - Number(b.courtPrice || 0);
      if (sortOrder === "PRICE_DESC")
        return Number(b.courtPrice || 0) - Number(a.courtPrice || 0);

      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  const groupedMatches = useMemo(() => {
    const groups: Record<string, { area: any; matches: MatchResponse[] }> = {};

    filteredMatches.forEach((m) => {
      const areaId = m.areaInfo?.rentalAreaId || "unknown_area";

      if (!groups[areaId]) {
        groups[areaId] = {
          area: m.areaInfo || {
            rentalAreaName: "Khu vực khác (Chưa xác định)",
          },
          matches: [],
        };
      }
      groups[areaId].matches.push(m);
    });

    return Object.values(groups);
  }, [filteredMatches]);

  const formatAreaAddress = (addressObj: any) => {
    if (!addressObj) return "Chưa cập nhật địa chỉ";
    const { street, ward, city } = addressObj;
    const parts = [street, ward, city?.cityName].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Chưa cập nhật địa chỉ";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-9 font-sans">
      <div className="w-[85%] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 lg:px-6 xl:px-8">
          <div className="flex-1">
            <Title
              level={2}
              style={{ margin: 0, fontWeight: 800, color: "#1e293b" }}
            >
              Trận Đấu Vãng Lai
            </Title>
            <Text type="secondary" className="font-medium text-base mt-1 block">
              Tìm đồng đội giao lưu hoặc tham gia kèo có sẵn
            </Text>
          </div>

          <Space
            size="middle"
            className="w-full md:w-auto mt-4 md:mt-0 justify-end"
          >
            <Input.Search
              placeholder="Nhập mã phòng..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              onSearch={handleJoinByRoomCode}
              maxLength={6}
              size="large"
              className="min-w-[200px] md:w-[280px] font-semibold uppercase"
              style={{ borderRadius: "12px" }}
            />

            {/* NÚT "TẠO TRẬN NGAY" MỚI */}
            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={() => navigate("/courts")} // Đổi đường dẫn thành /courts
              style={{
                backgroundColor: "#9156F1",
                borderColor: "#9156F1",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
              }}
              className="font-bold shadow-sm hover:opacity-90"
            >
              Tạo trận ngay
            </Button>

            <Button
              size="large"
              icon={<Calendar size={18} />}
              onClick={() => navigate("/my-matches")}
              style={{
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                color: "#f97316",
                borderColor: "#f97316",
              }}
              className="font-bold shadow-sm hover:opacity-80"
            >
              Trận Của Tôi
            </Button>
          </Space>
        </div>

        <JoinMatchModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={() => fetchMatches(currentPage)}
          match={selectedMatch}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <MatchFilter
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedWard={selectedWard}
            setSelectedWard={setSelectedWard}
            provinces={provinces}
            wards={wards}
            setWards={setWards}
            resetFilters={resetFilters}
          />

          <div className="flex-8 w-full">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spin size="large" />
              </div>
            ) : groupedMatches.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-500 font-medium text-base">
                    Không tìm thấy trận đấu nào! <br />
                    <span className="text-sm font-normal">
                      Hãy thử thay đổi tiêu chí bộ lọc hoặc{" "}
                      <span
                        onClick={() => navigate("/courts")}
                        className="text-purple-600 font-semibold cursor-pointer hover:underline"
                      >
                        tạo trận ngay
                      </span>
                    </span>
                  </span>
                }
                className="bg-white p-10 rounded-2xl border border-slate-200"
              />
            ) : (
              <>
                <div className="flex flex-col gap-6">
                  {groupedMatches.map((group, index) => (
                    <div
                      key={group.area.rentalAreaId || index}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
                        <Avatar
                          size={50}
                          src={group.area.images?.[0]?.imageUrl || undefined}
                          className="border border-slate-200"
                        >
                          {group.area.rentalAreaName?.[0]}
                        </Avatar>
                        <div>
                          <Title
                            level={5}
                            style={{ margin: 0, color: "#1e293b" }}
                          >
                            {group.area.rentalAreaName}
                          </Title>
                          <Text
                            type="secondary"
                            className="flex items-center text-sm mt-1"
                          >
                            <MapPin
                              size={14}
                              className="mr-1 text-emerald-500"
                            />
                            {formatAreaAddress(group.area.address)}
                          </Text>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/50">
                        <Row gutter={[16, 16]}>
                          {group.matches.map((match) => (
                            <Col xs={24} lg={12} xl={8} key={match.matchId}>
                              <MatchCard
                                match={match}
                                onOpenJoinModal={handleOpenJoinModal}
                                onJoinSuccess={() => fetchMatches(currentPage)}
                              />
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </div>
                  ))}
                </div>

                {totalElements > PAGE_SIZE && (
                  <div className="flex justify-center mt-8">
                    <Pagination
                      current={currentPage}
                      pageSize={PAGE_SIZE}
                      total={totalElements}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPage;
