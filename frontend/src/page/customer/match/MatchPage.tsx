import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  Smile,
  Trophy,
  Users,
} from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import type { MatchResponse } from "../../../types/match.ts";
import CreateMatchModal from "./CreateMatchModal";
import JoinMatchModal from "./JoinMatchModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.tsx";
import { message } from "antd";
import { LOCATION_DATA } from "../../../constants/locationData.ts";

const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(
    null,
  );

  // --- STATE CHO BỘ LỌC TÌM KIẾM ---
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [selectedLocation, setSelectedLocation] = useState<string>(""); // Lưu Thành phố
  const [selectedDistrict, setSelectedDistrict] = useState<string>(""); // Lưu Quận/Huyện
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Lưu Loại sân

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await matchService.getOpenMatches({
        page: 1,
        size: 100,
      });
      if (response.code === 200) {
        setMatches(response.result.data || []);
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Reset tất cả bộ lọc
  const resetFilters = () => {
    setSortOrder("NEWEST");
    setSelectedLocation("");
    setSelectedDistrict("");
    setSelectedCategory("");
    setTypeFilter("ALL");
  };

  // --- CÁC HÀM XỬ LÝ ---
  const handleOpenJoinModal = (match: MatchResponse) => {
    setSelectedMatch(match);
    setIsJoinModalOpen(true);
  };

  const handleJoinMatch = async (matchId: string) => {
    try {
      const response = await matchService.joinMatch(matchId);
      if (response.code === 200) {
        message.success("Tham gia trận thành công!");
        fetchMatches();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tham gia");
    }
  };

  const handleConfirmDeposit = async (matchId: string) => {
    try {
      const response = await matchService.confirmDeposit(matchId);
      if (response.code === 200) {
        message.success("Đã xác nhận cọc thành công!");
        fetchMatches();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi xác nhận cọc");
    }
  };

  const renderActionButton = (match: MatchResponse) => {
    const isParticipant = match.participants?.some(
      (p: any) => p.userId === user?.userId,
    );
    const isDepositConfirmed = match.participants?.find(
      (p: any) => p.userId === user?.userId,
    )?.isDepositConfirmed;

    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant)
        return (
          <button
            disabled
            className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-semibold text-sm border border-slate-200"
          >
            Đã Tham Gia
          </button>
        );
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleJoinMatch(match.matchId);
          }}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-all shadow-sm"
        >
          Tham Gia
        </button>
      );
    }
    if (match.status === "WAITING_DEPOSIT") {
      if (isParticipant) {
        if (isDepositConfirmed)
          return (
            <button
              disabled
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-semibold text-sm border border-indigo-100"
            >
              Đã Cọc
            </button>
          );
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmDeposit(match.matchId);
            }}
            className="bg-orange-500 text-white hover:bg-orange-600 animate-pulse px-4 py-2 rounded-xl font-semibold text-sm shadow-sm"
          >
            Xác Nhận Cọc
          </button>
        );
      }
      return (
        <button
          disabled
          className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-semibold text-sm"
        >
          Chờ Xác Nhận
        </button>
      );
    }
    if (match.status === "CONFIRMED" || match.status === "FULL") {
      if (isParticipant)
        return (
          <button
            disabled
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm"
          >
            Sẵn Sàng
          </button>
        );
      return (
        <button
          disabled
          className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-semibold text-sm"
        >
          Đã Đầy
        </button>
      );
    }
    return (
      <button
        disabled
        className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-semibold text-sm"
      >
        Đã Chốt
      </button>
    );
  };

  const handleChatClick = (e: React.MouseEvent, match: MatchResponse) => {
    e.stopPropagation();
    const hostUser = match.participants?.find(
      (p: any) => p.userName === match.hostName,
    );
    const hostId = (match as any).hostId || hostUser?.userId;
    if (!hostId) {
      message.error("Không tìm thấy thông tin chủ phòng để chat");
      return;
    }
    if (hostId === user?.userId) {
      message.info("Bạn đang là chủ phòng của trận đấu này.");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("OPEN_CHAT_WITH_USER", {
        detail: { userId: hostId, userName: match.hostName || "Chủ phòng" },
      }),
    );
  };

  const formatDate = (dateData: any) => {
    if (Array.isArray(dateData))
      return `${dateData[2].toString().padStart(2, "0")}/${dateData[1]
        .toString()
        .padStart(2, "0")}/${dateData[0]}`;
    return new Date(dateData).toLocaleDateString("vi-VN");
  };

  const formatTime = (timeData: any) => {
    if (Array.isArray(timeData))
      return `${(timeData[3]?.toString() || "00").padStart(2, "0")}:${(
        timeData[4]?.toString() || "00"
      ).padStart(2, "0")}`;
    if (typeof timeData === "string" && timeData.includes("T"))
      return timeData.split("T")[1].substring(0, 5);
    return "--:--";
  };

  const isValidPrice = (price: any) =>
    price != null && price !== "" && !isNaN(Number(price));

  // --- LOGIC LỌC DỮ LIỆU ĐÃ CẬP NHẬT ---
  const filteredMatches = matches
    .filter((m) =>
      ["OPEN", "CONFIRMED", "WAITING_DEPOSIT", "FULL"].includes(m.status),
    )
    .filter((m) => typeFilter === "ALL" || m.matchType === typeFilter)
    .filter(
      (m) =>
        !selectedCategory ||
        m.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase()),
    )
    .filter((m) => {
      if (!selectedLocation && !selectedDistrict) return true;
      const isStringAddress = typeof m.address === "string";
      const cityString = String(
        isStringAddress ? m.address : m.address?.city?.cityName || "",
      );
      const districtString = String(
        isStringAddress ? m.address : m.address?.district || "",
      );

      const matchCity =
        !selectedLocation ||
        cityString.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchDistrict =
        !selectedDistrict ||
        districtString.toLowerCase().includes(selectedDistrict.toLowerCase());

      return matchCity && matchDistrict;
    })
    .sort((a, b) => {
      if (sortOrder === "PRICE_ASC")
        return Number(a.courtPrice || 0) - Number(b.courtPrice || 0);
      if (sortOrder === "PRICE_DESC")
        return Number(b.courtPrice || 0) - Number(a.courtPrice || 0);
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

  // Lấy danh sách quận/huyện dựa vào Thành phố đang chọn
  const availableDistricts =
    LOCATION_DATA.find((city) => city.name === selectedLocation)?.districts ||
    [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">
            Trận Đấu Vãng Lai
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Tìm đồng đội giao lưu hoặc tham gia kèo có sẵn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm whitespace-nowrap border-0"
          >
            <span className="text-xl leading-none">+</span> Tạo Kèo Tìm Bạn
          </button>
        </div>
      </div>

      <CreateMatchModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchMatches}
      />
      <JoinMatchModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={fetchMatches}
        match={selectedMatch}
      />

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SIDEBAR BỘ LỌC TÌM KIẾM */}
        <div className="w-full lg:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0 sticky top-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-800">Bộ lọc</h2>
            <button
              onClick={resetFilters}
              className="text-sm text-indigo-500 hover:text-indigo-700 font-medium hover:underline"
            >
              Làm mới
            </button>
          </div>

          {/* Sắp xếp */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              Sắp xếp
            </h3>
            <div className="space-y-3">
              {[
                { id: "NEWEST", label: "Mới nhất" },
                { id: "PRICE_ASC", label: "Giá thấp → cao" },
                { id: "PRICE_DESC", label: "Giá cao → thấp" },
              ].map((sort) => (
                <label
                  key={sort.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={sortOrder === sort.id}
                    onChange={() => setSortOrder(sort.id)}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-600 group-hover:text-slate-800 font-medium">
                    {sort.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Loại sân */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              Loại sân
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              {["Cầu lông", "Bóng đá", "Pickleball", "Tennis"].map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="categoryCourt"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className="text-slate-600 text-sm font-medium group-hover:text-slate-800 truncate"
                    title={cat}
                  >
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <br />

          {/* Thể thức */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              Thể thức
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "NORMAL", label: "Đánh thường" },
                { id: "BET", label: "Đánh kèo" },
                { id: "RANKED", label: "Đánh Rank" },
              ].map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="matchType"
                    checked={typeFilter === type.id}
                    onChange={() => setTypeFilter(type.id)}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className="text-slate-600 text-sm font-medium group-hover:text-slate-800 truncate"
                    title={type.label}
                  >
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Khu vực (Render trực tiếp từ LOCATION_DATA) */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              Khu vực
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              {LOCATION_DATA.map((city) => (
                <label
                  key={city.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="locationCity"
                    checked={selectedLocation === city.name}
                    onChange={() => {
                      setSelectedLocation(city.name);
                      setSelectedDistrict(""); // Reset Quận khi đổi Thành phố
                    }}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className="text-slate-600 text-sm font-medium group-hover:text-slate-800 truncate"
                    title={city.name}
                  >
                    {city.name === "Thành phố Hồ Chí Minh"
                      ? "TP.HCM"
                      : city.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quận / Huyện (Lấy động từ availableDistricts) */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">
              Quận / Huyện
            </h3>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedLocation}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm transition-colors hover:border-slate-300"
            >
              <option value="">
                {selectedLocation
                  ? "-- Tất cả Quận/Huyện --"
                  : "-- Chọn Thành phố trước --"}
              </option>

              {availableDistricts.map((district) => (
                <option key={district.name} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GRID DANH SÁCH (3 CỘT: lg:grid-cols-3) */}
        <div className="flex-1 w-full">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center">
              <p className="font-semibold text-lg mb-2">
                Không tìm thấy trận đấu nào!
              </p>
              <p className="text-sm">
                Hãy thử chọn "Làm mới" hoặc thay đổi tiêu chí bộ lọc của bạn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <div
                  key={match.matchId}
                  className="bg-white rounded-2xl border border-slate-200 relative shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div
                    className="p-5 pb-2 cursor-pointer group flex-grow relative"
                    onClick={() => handleOpenJoinModal(match)}
                  >
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-md font-bold whitespace-nowrap shadow-sm ${
                          match.matchType === "RANKED"
                            ? "bg-indigo-50 text-indigo-700"
                            : match.matchType === "BET"
                            ? "bg-orange-50 text-orange-700 border border-orange-100"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {match.matchType === "RANKED" && (
                            <>
                              <Trophy size={14} />
                              Rank ({match.minRank}-{match.maxRank})
                            </>
                          )}

                          {match.matchType === "BET" && (
                            <>
                              <DollarSign size={14} />
                              Kèo ({match.winnerPercent}/
                              {100 - (match.winnerPercent || 0)})
                            </>
                          )}

                          {match.matchType !== "RANKED" &&
                            match.matchType !== "BET" && (
                              <>
                                <Smile size={14} />
                                Giao lưu
                              </>
                            )}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col items-start mb-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider inline-block mb-2 ${
                          match.hasCourt
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {match.hasCourt ? "Sân cố định" : "Kèo tự do"}
                      </span>

                      <h3 className="text-xl font-bold text-slate-800 pr-24 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {match.title || `Giao lưu ${match.categoryName}`}
                      </h3>

                      <p className="text-indigo-600 text-sm font-semibold mt-1">
                        {match.categoryName}
                      </p>
                    </div>

                    <div className="space-y-3 mb-4 text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin
                          size={16}
                          className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <span className="text-sm font-medium line-clamp-2 leading-tight">
                          {match.address?.street +
                            ", " +
                            match.address?.ward +
                            ", " +
                            match.address?.district +
                            ", " +
                            match.address?.city?.cityName}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={16}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="text-sm font-medium">
                            {formatDate(match.startTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock
                            size={16}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="text-sm font-medium">
                            {formatTime(match.startTime)} -{" "}
                            {formatTime(match.endTime)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Users size={14} />
                            <span>
                              {match.currentPlayers}/{match.maxPlayers} người
                            </span>
                          </div>
                          <span className="text-emerald-600">
                            Còn {match.remainingSlots} slot
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-700 rounded-full"
                            style={{
                              width: `${Math.min(
                                (match.currentPlayers /
                                  (match.maxPlayers || 1)) *
                                  100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 bg-slate-50/80 p-4 mt-auto">
                    <div>
                      {isValidPrice(match.courtPrice) ? (
                        <p className="font-bold text-slate-800 text-base">
                          {Number(match.courtPrice).toLocaleString()}đ
                        </p>
                      ) : (
                        <p className="font-medium text-slate-500 text-sm">
                          Sân tự thỏa thuận
                        </p>
                      )}
                      <p
                        className="text-[12px] text-slate-500 font-medium mt-0.5 cursor-pointer hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1"
                        title="Xem hồ sơ người tạo"
                        onClick={(e) => {
                          e.stopPropagation();
                          const hostUser = match.participants?.find(
                            (p: any) => p.userName === match.hostName,
                          );
                          const hostId =
                            (match as any).hostId || hostUser?.userId;
                          if (hostId) navigate(`/player/${hostId}`);
                          else
                            message.info(
                              "Không tìm thấy thông tin hồ sơ của Host!",
                            );
                        }}
                      >
                        Host:{" "}
                        <span className="text-indigo-600 font-semibold">
                          {match.hostName}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => handleChatClick(e, match)}
                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                        title="Chat với chủ phòng"
                      >
                        <MessageCircle size={18} />
                      </button>
                      {renderActionButton(match)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPage;
