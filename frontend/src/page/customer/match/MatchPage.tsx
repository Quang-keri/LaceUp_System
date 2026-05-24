import React, { useEffect, useState } from "react";
import { Calendar, Zap } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import type { MatchResponse } from "../../../types/match.ts";
import JoinMatchModal from "./JoinMatchModal";
import AutoMatchModal from "./AutoMatchModal";
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
} from "antd";
import MatchCard from "./MatchCard.tsx";

const { Title, Text } = Typography;

const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAutoMatchOpen, setIsAutoMatchOpen] = useState(false);
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
  const PAGE_SIZE = 6;

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

  useEffect(() => {
    fetchMatches(currentPage);
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

  const filteredMatches = matches
    .filter((m) => ["OPEN", "READY", "CONFIRMED", "FULL"].includes(m.status))
    .filter((m) => typeFilter === "ALL" || m.matchType === typeFilter)
    .filter(
      (m) =>
        !selectedCategory ||
        m.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase()),
    )
    .filter((m) => {
      if (!selectedLocation && !selectedWard) return true;

      const isStringAddress = typeof m.address === "string";
      const cityString = String(
        isStringAddress ? m.address : m.address?.city?.cityName || "",
      );

      const wardString = String(
        isStringAddress ? m.address : m.address?.ward || "",
      );

      const matchCity =
        !selectedLocation ||
        cityString.toLowerCase().includes(selectedLocation.toLowerCase());

      const matchWard =
        !selectedWard ||
        wardString.toLowerCase().includes(selectedWard.toLowerCase());

      return matchCity && matchWard;
    })
    .sort((a, b) => {
      if (sortOrder === "PRICE_ASC")
        return Number(a.courtPrice || 0) - Number(b.courtPrice || 0);
      if (sortOrder === "PRICE_DESC")
        return Number(b.courtPrice || 0) - Number(a.courtPrice || 0);
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="w-[90%] mx-auto">
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

            <Button
              type="primary"
              size="large"
              icon={<Zap size={18} className="fill-white" />}
              onClick={() => setIsAutoMatchOpen(true)}
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
              Ghép Trận
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
        <AutoMatchModal
          isOpen={isAutoMatchOpen}
          onClose={() => setIsAutoMatchOpen(false)}
          onSuccess={() => fetchMatches(currentPage)}
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

          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spin size="large" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-500 font-medium text-base">
                    Không tìm thấy trận đấu nào! <br />
                    <span className="text-sm font-normal">
                      Hãy thử chọn "Làm mới" hoặc thay đổi tiêu chí bộ lọc của
                      bạn.
                    </span>
                  </span>
                }
                className="bg-white p-10 rounded-2xl border border-slate-200"
              />
            ) : (
              <>
                <Row gutter={[24, 24]}>
                  {filteredMatches.map((match) => (
                    <Col xs={24} md={12} xl={8} key={match.matchId}>
                      <MatchCard
                        match={match}
                        onOpenJoinModal={handleOpenJoinModal}
                        onJoinSuccess={() => fetchMatches(currentPage)}
                      />
                    </Col>
                  ))}
                </Row>

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
