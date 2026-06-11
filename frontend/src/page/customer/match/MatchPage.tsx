import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Empty,
  Input,
  message,
  Pagination,
  Space,
  Spin,
  Typography,
} from "antd";

import matchService from "../../../service/match/matchService";
import bookingService from "../../../service/bookingService";
import rentalService from "../../../service/rental/rentalService";
import { locationService } from "../../../service/locationService";

import type { MatchResponse } from "../../../types/match";
import type { SharedBookingPublicResponse } from "../../../types/booking";

import JoinMatchModal from "./JoinMatchModal";
import MatchFilter from "./MatchFilter";
import MatchCard from "./MatchCard";
import SharedBookingCard from "./SharedBookingCard";

const { Title, Text } = Typography;

type MatchWithArea = MatchResponse & {
  areaInfo?: any;
};

type SharedBookingWithArea = SharedBookingPublicResponse & {
  areaInfo?: any;
};

interface CommunityGroup {
  area: any;
  sharedBookings: SharedBookingWithArea[];
  matches: MatchWithArea[];
}

interface CommunityHorizontalRowProps {
  group: CommunityGroup;
  onOpenJoinModal: (match: MatchResponse) => void;
  onRefreshMatches: () => void;
  onRefreshSharedBookings: () => void;
}

type CommunityItem =
  | {
      type: "SHARED";
      id: string;
      data: SharedBookingWithArea;
    }
  | {
      type: "MATCH";
      id: string;
      data: MatchWithArea;
    };

const CommunityHorizontalRow: React.FC<CommunityHorizontalRowProps> = ({
  group,
  onOpenJoinModal,
  onRefreshMatches,
  onRefreshSharedBookings,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const CARD_GAP = 16;

  /*
   * Gộp chung thành một danh sách.
   * Vãng lai được đưa vào trước nên luôn đứng trước Rank/Kèo/Giao lưu.
   */
  const items = useMemo<CommunityItem[]>(() => {
    const sharedItems: CommunityItem[] = group.sharedBookings.map(
      (booking) => ({
        type: "SHARED",
        id: `shared-${booking.bookingId}`,
        data: booking,
      }),
    );

    const matchItems: CommunityItem[] = group.matches.map((match) => ({
      type: "MATCH",
      id: `match-${match.matchId}`,
      data: match,
    }));

    return [...sharedItems, ...matchItems];
  }, [group.sharedBookings, group.matches]);

  /*
   * Đo CHÍNH viewport của carousel, không dùng window.innerWidth.
   * Vì bên trái còn có bộ lọc nên chiều rộng thật của carousel nhỏ hơn màn hình.
   */
  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(viewport.clientWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /*
   * Responsive dựa theo chiều rộng thật của khung card.
   */
  const itemsPerView = useMemo(() => {
    if (viewportWidth < 640) {
      return 1;
    }

    if (viewportWidth < 900) {
      return 2;
    }

    return 3;
  }, [viewportWidth]);

  const cardWidth = useMemo(() => {
    if (viewportWidth <= 0) {
      return 0;
    }

    const totalGap = CARD_GAP * (itemsPerView - 1);
    return (viewportWidth - totalGap) / itemsPerView;
  }, [viewportWidth, itemsPerView]);

  const maxIndex = Math.max(0, items.length - itemsPerView);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  useEffect(() => {
    setCurrentIndex((previous) => Math.min(previous, maxIndex));
  }, [maxIndex]);

  const handlePrevious = () => {
    setCurrentIndex((previous) => Math.max(0, previous - 1));
  };

  const handleNext = () => {
    setCurrentIndex((previous) => Math.min(maxIndex, previous + 1));
  };

  const translateX = currentIndex * (cardWidth + CARD_GAP);

  return (
    <div className="relative w-full min-w-0 max-w-full">
      {/*
       * viewport chỉ làm nhiệm vụ cắt đúng phần hiển thị.
       * Track bên trong mới di chuyển bằng transform nên card lướt mượt.
       */}
      <div
        ref={viewportRef}
        className="w-full min-w-0 max-w-full overflow-hidden"
      >
        <div
          className="flex items-stretch gap-4 will-change-transform"
          style={{
            transform: `translate3d(-${translateX}px, 0, 0)`,
            transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
            visibility: viewportWidth > 0 ? "visible" : "hidden",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="h-[330px] min-w-0 shrink-0 overflow-hidden"
              style={{
                flex: `0 0 ${cardWidth}px`,
                width: `${cardWidth}px`,
                maxWidth: `${cardWidth}px`,
              }}
            >
              <div className="h-full w-full min-w-0 overflow-hidden [&_.ant-card]:w-full">
                {item.type === "SHARED" ? (
                  <SharedBookingCard
                    booking={item.data}
                    onJoinSuccess={onRefreshSharedBookings}
                  />
                ) : (
                  <MatchCard
                    match={item.data}
                    onOpenJoinModal={onOpenJoinModal}
                    onJoinSuccess={onRefreshMatches}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canGoPrevious && (
        <button
          type="button"
          aria-label="Xem trận trước"
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition-all duration-200 hover:scale-105 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
        >
          <ChevronLeft size={23} />
        </button>
      )}

      {canGoNext && (
        <button
          type="button"
          aria-label="Xem trận tiếp theo"
          onClick={handleNext}
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-600 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-purple-50"
        >
          <ChevronRight size={23} />
        </button>
      )}
    </div>
  );
};

const MatchPage: React.FC = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<MatchResponse[]>([]);

  const [sharedBookings, setSharedBookings] = useState<
    SharedBookingPublicResponse[]
  >([]);

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);

  const [loadingMatches, setLoadingMatches] = useState(false);

  const [loadingShared, setLoadingShared] = useState(false);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(
    null,
  );

  const [provinces, setProvinces] = useState<any[]>([]);

  const [wards, setWards] = useState<any[]>([]);

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [sortOrder, setSortOrder] = useState("NEWEST");

  const [selectedLocation, setSelectedLocation] = useState("");

  const [selectedWard, setSelectedWard] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");

  const [roomCodeInput, setRoomCodeInput] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [totalElements, setTotalElements] = useState(0);

  const PAGE_SIZE = 12;

  const fetchMatches = async (pageToFetch = 1) => {
    try {
      setLoadingMatches(true);

      const response = await matchService.getOpenMatches({
        page: pageToFetch,
        size: PAGE_SIZE,
      });

      if (response?.code === 200 || response?.code === 1000) {
        setMatches(response?.result?.data || []);

        setTotalElements(response?.result?.totalElements || 0);
      }
    } catch (error) {
      message.error("Không thể tải danh sách trận đấu");
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchSharedBookings = async () => {
    try {
      setLoadingShared(true);

      const response = await bookingService.getOpenSharedBookingsForCommunity(
        1,
        100,
      );

      if (response?.code === 200 || response?.code === 1000) {
        setSharedBookings(response?.result?.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy trận vãng lai:", error);

      message.error("Không thể tải danh sách vãng lai");
    } finally {
      setLoadingShared(false);
    }
  };

  const fetchRentalAreas = async () => {
    try {
      const response = await rentalService.getAllRentalAreas(1, 100);

      setRentalAreas(response?.result?.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin khu vực:", error);
    }
  };

  useEffect(() => {
    fetchMatches(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchSharedBookings();
    fetchRentalAreas();

    locationService.getProvinces().then((data) => {
      setProvinces(data || []);
    });
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
    if (!roomCodeInput.trim()) {
      return;
    }

    matchService
      .joinMatchByCode(roomCodeInput.trim())
      .then((response) => {
        if (response?.code === 200 || response?.code === 1000) {
          message.success("Vào phòng thành công!");

          setRoomCodeInput("");
          fetchMatches(currentPage);
          navigate("/my-matches");
        }
      })
      .catch((error) => {
        message.error(
          error?.response?.data?.message || "Mã phòng không hợp lệ!",
        );
      });
  };

  /*
   * Gắn area vào trận đấu thường.
   *
   * Ưu tiên tìm bằng rentalAreaId.
   * Nếu response Match chưa có rentalAreaId
   * thì tìm tạm bằng courtName như code cũ.
   */
  const matchesWithArea = useMemo<MatchWithArea[]>(() => {
    return matches.map((match) => {
      const matchRentalAreaId = (match as any).rentalAreaId;

      const matchedArea =
        rentalAreas.find(
          (area) =>
            matchRentalAreaId && area.rentalAreaId === matchRentalAreaId,
        ) ||
        rentalAreas.find((area) =>
          area.courtResponses?.some(
            (court: any) => court.courtName === match.courtName,
          ),
        );

      return {
        ...match,
        areaInfo: matchedArea,
      };
    });
  }, [matches, rentalAreas]);

  /*
   * Vãng lai đã có rentalAreaId từ API mới,
   * nên tìm khu sân trực tiếp bằng ID.
   */
  const sharedBookingsWithArea = useMemo<SharedBookingWithArea[]>(() => {
    return sharedBookings.map((booking) => {
      const matchedArea = rentalAreas.find(
        (area) => area.rentalAreaId === booking.rentalAreaId,
      );

      return {
        ...booking,
        areaInfo: matchedArea || {
          rentalAreaId: booking.rentalAreaId,
          rentalAreaName: booking.rentalAreaName,
        },
      };
    });
  }, [sharedBookings, rentalAreas]);

  const isMatchedLocation = (areaInfo: any) => {
    if (!selectedLocation && !selectedWard) {
      return true;
    }

    const address = areaInfo?.address || {};

    const cityName = String(address?.city?.cityName || "").toLowerCase();

    const wardName = String(address?.ward || "").toLowerCase();

    const cityMatched =
      !selectedLocation || cityName.includes(selectedLocation.toLowerCase());

    const wardMatched =
      !selectedWard || wardName.includes(selectedWard.toLowerCase());

    return cityMatched && wardMatched;
  };

  const filteredMatches = matchesWithArea
    .filter((match) =>
      ["OPEN", "READY", "CONFIRMED", "FULL"].includes(match.status),
    )
    .filter((match) => typeFilter === "ALL" || match.matchType === typeFilter)
    .filter(
      (match) =>
        !selectedCategory ||
        match.categoryName
          ?.toLowerCase()
          .includes(selectedCategory.toLowerCase()),
    )
    .filter((match) => isMatchedLocation(match.areaInfo))
    .sort((first, second) => {
      if (sortOrder === "PRICE_ASC") {
        return Number(first.courtPrice || 0) - Number(second.courtPrice || 0);
      }

      if (sortOrder === "PRICE_DESC") {
        return Number(second.courtPrice || 0) - Number(first.courtPrice || 0);
      }

      return (
        new Date(first.startTime).getTime() -
        new Date(second.startTime).getTime()
      );
    });

  /*
   * Vãng lai được xem như dạng đánh thường.
   *
   * Khi chọn Tất cả hoặc Đánh thường thì hiện.
   * Khi chọn Đánh Rank/Đánh kèo thì ẩn.
   */
  const filteredSharedBookings = sharedBookingsWithArea
    .filter(() => ["ALL", "NORMAL"].includes(typeFilter))
    .filter(
      (booking) =>
        !selectedCategory ||
        booking.categoryName
          ?.toLowerCase()
          .includes(selectedCategory.toLowerCase()),
    )
    .filter((booking) => isMatchedLocation(booking.areaInfo))
    .sort((first, second) => {
      if (sortOrder === "PRICE_ASC") {
        return (
          Number(first.pricePerTicket || 0) - Number(second.pricePerTicket || 0)
        );
      }

      if (sortOrder === "PRICE_DESC") {
        return (
          Number(second.pricePerTicket || 0) - Number(first.pricePerTicket || 0)
        );
      }

      return (
        new Date(first.startTime).getTime() -
        new Date(second.startTime).getTime()
      );
    });

  /*
   * Quan trọng:
   *
   * 1. Đưa shared booking vào group trước.
   * 2. Sau đó mới đưa match vào.
   * 3. Khi render cũng render sharedBookings trước.
   *
   * Vì vậy thẻ Vãng lai luôn nằm trước thẻ Rank.
   */
  const groupedCommunity = useMemo<CommunityGroup[]>(() => {
    const groups = new Map<string, CommunityGroup>();

    const ensureGroup = (areaId: string, area: any) => {
      if (!groups.has(areaId)) {
        groups.set(areaId, {
          area,
          sharedBookings: [],
          matches: [],
        });
      }

      return groups.get(areaId)!;
    };

    /*
     * Thêm vãng lai trước.
     */
    filteredSharedBookings.forEach((booking) => {
      const areaId =
        booking.rentalAreaId ||
        booking.areaInfo?.rentalAreaId ||
        `shared-${booking.rentalAreaName}`;

      const area = booking.areaInfo || {
        rentalAreaId: booking.rentalAreaId,
        rentalAreaName: booking.rentalAreaName,
      };

      ensureGroup(areaId, area).sharedBookings.push(booking);
    });

    /*
     * Sau đó mới thêm trận thường/Rank.
     */
    filteredMatches.forEach((match) => {
      const areaId =
        match.areaInfo?.rentalAreaId || `match-${match.courtName || "unknown"}`;

      const area = match.areaInfo || {
        rentalAreaId: areaId,
        rentalAreaName: "Khu vực khác (Chưa xác định)",
      };

      ensureGroup(areaId, area).matches.push(match);
    });

    return Array.from(groups.values());
  }, [filteredSharedBookings, filteredMatches]);

  const formatAreaAddress = (address: any) => {
    if (!address) {
      return "Chưa cập nhật địa chỉ";
    }

    const parts = [address.street, address.ward, address.city?.cityName].filter(
      Boolean,
    );

    return parts.length > 0 ? parts.join(", ") : "Chưa cập nhật địa chỉ";
  };

  const loading = loadingMatches || loadingShared;

  return (
    <div className="min-h-screen bg-slate-50 py-9 font-sans">
      <div className="w-[85%] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 lg:px-6 xl:px-8">
          <div className="flex-1">
            <Title
              level={2}
              style={{
                margin: 0,
                fontWeight: 800,
                color: "#1e293b",
              }}
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
              onChange={(event) => setRoomCodeInput(event.target.value)}
              onSearch={handleJoinByRoomCode}
              maxLength={6}
              size="large"
              className="min-w-[200px] md:w-[280px] font-semibold uppercase"
              style={{
                borderRadius: "12px",
              }}
            />

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

          <div className="min-w-0 flex-1 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spin size="large" />
              </div>
            ) : groupedCommunity.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-500 font-medium text-base">
                    Không tìm thấy trận đấu nào!
                    <br />
                    <span className="text-sm font-normal">
                      Hãy thử thay đổi tiêu chí bộ lọc.
                    </span>
                  </span>
                }
                className="bg-white p-10 rounded-2xl border border-slate-200"
              />
            ) : (
              <>
                <div className="flex flex-col gap-6">
                  {groupedCommunity.map((group, index) => (
                    <div
                      key={group.area?.rentalAreaId || index}
                      className="w-full max-w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
                        <Avatar
                          size={50}
                          src={group.area?.images?.[0]?.imageUrl || undefined}
                          className="border border-slate-200"
                        >
                          {group.area?.rentalAreaName?.[0]}
                        </Avatar>

                        <div>
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: "#1e293b",
                            }}
                          >
                            {group.area?.rentalAreaName || "Khu vực khác"}
                          </Title>

                          <Text
                            type="secondary"
                            className="flex items-center text-sm mt-1"
                          >
                            <MapPin
                              size={14}
                              className="mr-1 text-emerald-500"
                            />

                            {formatAreaAddress(group.area?.address)}
                          </Text>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/50">
                        <CommunityHorizontalRow
                          group={group}
                          onOpenJoinModal={handleOpenJoinModal}
                          onRefreshSharedBookings={fetchSharedBookings}
                          onRefreshMatches={() => fetchMatches(currentPage)}
                        />
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
