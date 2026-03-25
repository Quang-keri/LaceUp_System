import React, { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, MessageCircle, Users } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import type { MatchResponse } from "../../../types/match.ts";
import { toast } from "react-toastify";
import CreateMatchModal from "./CreateMatchModal";
import JoinMatchModal from "./JoinMatchModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.tsx";

const MatchPage: React.FC = () => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth(); // Lấy thông tin người dùng hiện tại

  const [categoryFilter, setCategoryFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(
    null,
  );

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await matchService.getAllMatches(1, 100);
      if (response.code === 1000 || response.code === 0) {
        setMatches(response.result.data || []);
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleOpenJoinModal = (match: MatchResponse) => {
    setSelectedMatch(match);
    setIsJoinModalOpen(true);
  };

  const handleJoinMatch = async (matchId: string) => {
    try {
      const response = await matchService.joinMatch(matchId);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Tham gia trận thành công!");
        fetchMatches();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tham gia");
    }
  };

  const handleConfirmDeposit = async (matchId: string) => {
    try {
      const response = await matchService.confirmDeposit(matchId);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Đã xác nhận cọc thành công!");
        fetchMatches();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xác nhận cọc");
    }
  };

  // Hàm render nút động tùy theo trạng thái (Không mở modal, click ăn liền)
  const renderActionButton = (match: MatchResponse) => {
    const isParticipant = match.participants?.some(
      (p: any) => p.userId === user?.userId,
    );
    const isDepositConfirmed = match.participants?.find(
      (p: any) => p.userId === user?.userId,
    )?.isDepositConfirmed;

    // 1. Trạng thái Đang tìm người (Vẫn còn chỗ)
    if (
      match.status === "OPEN" ||
      (match.status === "CONFIRMED" && match.remainingSlots > 0)
    ) {
      if (isParticipant) {
        return (
          <button
            disabled
            className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-bold text-sm"
          >
            Đã Tham Gia
          </button>
        );
      }
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleJoinMatch(match.matchId);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition"
        >
          Tham Gia
        </button>
      );
    }

    // 2. Trạng thái Chờ xác nhận cọc (Khi vừa đủ người)
    if (match.status === "WAITING_DEPOSIT") {
      if (isParticipant) {
        if (isDepositConfirmed) {
          return (
            <button
              disabled
              className="bg-green-100 text-green-600 px-4 py-2 rounded-xl font-bold text-sm"
            >
              Đã Cọc
            </button>
          );
        }
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmDeposit(match.matchId);
            }}
            className="bg-orange-500 text-white hover:bg-orange-600 animate-pulse px-4 py-2 rounded-xl font-bold text-sm"
          >
            Xác Nhận Cọc
          </button>
        );
      }
      return (
        <button
          disabled
          className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-bold text-sm"
        >
          Chờ Xác Nhận
        </button>
      );
    }

    // 3. Trạng thái Đã xác nhận xong cọc HOẶC trận đấu cũ đã Full
    if (match.status === "CONFIRMED" || match.status === "FULL") {
      if (isParticipant) {
        return (
          <button
            disabled
            className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Sẵn Sàng
          </button>
        );
      }
      return (
        <button
          disabled
          className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-bold text-sm"
        >
          Đã Đầy
        </button>
      );
    }

    // 4. Các trạng thái còn lại (COMPLETED, CANCELLED...)
    return (
      <button
        disabled
        className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-bold text-sm"
      >
        Đã Chốt
      </button>
    );
  };

  const handleChatClick = (e: React.MouseEvent, match: MatchResponse) => {
    e.stopPropagation(); // Ngăn mở Modal chi tiết trận đấu khi bấm chat

    // Tìm ID của người tạo (Host) giống như logic bạn đang dùng
    const hostUser = match.participants?.find(
      (p: any) => p.userName === match.hostName,
    );
    const hostId = (match as any).hostId || hostUser?.userId;

    if (!hostId) {
      toast.error("Không tìm thấy thông tin chủ phòng để chat");
      return;
    }

    if (hostId === user?.userId) {
      toast.info("Bạn đang là chủ phòng của trận đấu này.");
      return;
    }

    const event = new CustomEvent("OPEN_CHAT_WITH_USER", {
      detail: {
        userId: hostId,
        userName: match.hostName || "Chủ phòng",
      },
    });

    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Trận Đấu Vãng Lai
          </h1>
          <p className="text-gray-500">
            Tìm đồng đội giao lưu hoặc tham gia kèo có sẵn
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-100"
        >
          <span className="text-xl">+</span> Tạo Kèo Tìm Bạn
        </button>
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

      <div className="mb-8 space-y-4">
        {/* Bộ lọc ... (Giữ nguyên) */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {["Tất cả", "Sân bóng đá", "Sân cầu lông", "Sân Pickleball"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setCategoryFilter(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                  categoryFilter === tab
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: "ALL", label: "Tất cả thể thức" },
            { id: "NORMAL", label: "😊 Đánh thường" },
            { id: "BET", label: "💰 Đánh kèo" },
            { id: "RANKED", label: "🏆 Đánh Rank" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                typeFilter === tab.id
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                  : "bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {matches
            .filter((m) =>
              ["OPEN", "CONFIRMED", "WAITING_DEPOSIT", "FULL"].includes(
                m.status,
              ),
            )
            .filter(
              (m) =>
                categoryFilter === "Tất cả" ||
                m.categoryName
                  .toLowerCase()
                  .includes(categoryFilter.toLowerCase()),
            )
            .filter((m) => typeFilter === "ALL" || m.matchType === typeFilter)
            .map((match) => (
              <div
                key={match.matchId}
                className="bg-white rounded-2xl border relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* --- KHỐI BẤM ĐƯỢC ĐỂ XEM CHI TIẾT --- */}
                <div
                  className="p-6 pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleOpenJoinModal(match)}
                >
                  <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        match.hasCourt
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {match.hasCourt ? "Sân cố định" : "Kèo tự do"}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        match.status === "WAITING_DEPOSIT"
                          ? "bg-orange-100 text-orange-600"
                          : match.remainingSlots > 0
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {match.status === "WAITING_DEPOSIT"
                        ? "Chờ Cọc"
                        : match.remainingSlots > 0
                        ? "Còn Chỗ"
                        : "Đã Đầy"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-1 text-gray-800 line-clamp-1 w-[70%] pr-4">
                    {match.title || `Giao lưu ${match.categoryName}`}
                  </h3>

                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <p className="text-blue-600 text-sm font-semibold">
                      {match.categoryName}
                    </p>
                    <span className="text-gray-300">•</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase whitespace-nowrap ${
                        match.matchType === "RANKED"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : match.matchType === "BET"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {match.matchType === "RANKED"
                        ? `🏆 Rank (${match.minRank}-${match.maxRank})`
                        : match.matchType === "BET"
                        ? `💰 Kèo (${match.winnerPercent}/${
                            100 - (match.winnerPercent || 0)
                          })`
                        : "😊 Giao lưu"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={16}
                        className="text-blue-500 shrink-0 mt-0.5"
                      />
                      <span className="text-sm font-medium line-clamp-2 leading-tight">
                        {match.hasCourt
                          ? match.courtName
                          : match.address || "Địa điểm tự thỏa thuận"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500 shrink-0" />
                      <span className="text-sm">
                        {new Date(match.startTime).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500 shrink-0" />
                      <span className="text-sm">
                        {match.startTime.split("T")[1]?.substring(0, 5)} -{" "}
                        {match.endTime.split("T")[1]?.substring(0, 5)}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>
                            {match.currentPlayers}/{match.maxPlayers} người
                          </span>
                        </div>
                        <span className="text-blue-600">
                          Còn {match.remainingSlots} slot
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-700"
                          style={{
                            width: `${
                              (match.currentPlayers / match.maxPlayers) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- KHỐI FOOTER CHỨA ACTION BUTTON (Dừng sự kiện click mở Modal) --- */}
                <div className="flex justify-between items-center border-t p-6 pt-4 mt-auto">
                  <div>
                    {match.courtPrice &&
                    match.courtPrice !== null &&
                    match.courtPrice.toString() !== "null" &&
                    match.courtPrice.toString() !== "undefined" ? (
                      <p className="font-bold text-green-600 text-lg">
                        {Number(match.courtPrice).toLocaleString()}đ
                      </p>
                    ) : (
                      <p className="font-bold text-gray-400 text-sm">
                        Sân tự thỏa thuận
                      </p>
                    )}
                    <p
                      className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      title="Xem hồ sơ người tạo"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn mở Modal khi bấm vào tên Host
                        const hostUser = match.participants?.find(
                          (p: any) => p.userName === match.hostName,
                        );
                        const hostId =
                          (match as any).hostId || hostUser?.userId;
                        if (hostId) navigate(`/player/${hostId}`);
                        else
                          toast.info(
                            "Không tìm thấy thông tin hồ sơ của Host!",
                          );
                      }}
                    >
                      Host: {match.hostName}
                    </p>
                  </div>

                  {/* ĐÃ SỬA: Bọc nút Chat và nút Action vào một Flexbox */}
                  <div className="flex items-center gap-2">
                    {/* Nút Chat */}
                    <button
                      onClick={(e) => handleChatClick(e, match)}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm"
                      title="Chat với chủ phòng"
                    >
                      <MessageCircle size={20} />
                    </button>

                    {/* GỌI HÀM RENDER NÚT ĐỘNG */}
                    {renderActionButton(match)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MatchPage;
