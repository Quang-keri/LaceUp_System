import React, { useEffect, useState } from "react";
import { Modal, Button, Spin, message, Avatar, Tag } from "antd";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Hourglass,
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext.tsx";
import { matchResultService } from "../../../../service/match/matchResultService.ts";

interface ApproveResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  match: any;
}

const ApproveResultModal: React.FC<ApproveResultModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  match,
}) => {
  const { user } = useAuth();

  const [pendingResult, setPendingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitter, setIsSubmitter] = useState(false);

  useEffect(() => {
    if (isOpen && match) {
      fetchApprovalStatus();
    }
  }, [isOpen, match]);

  const fetchApprovalStatus = async () => {
    setLoading(true);
    setIsSubmitter(false);
    try {
      const res = await matchResultService.getResultsByMatch(match.matchId);
      if (res.result && res.result.length > 0) {
        setPendingResult(res.result[0]);
        if (res.result[0].submitterId === user?.userId) setIsSubmitter(true);
      } else {
        message.warning("Không tìm thấy kết quả chờ duyệt!");
        onClose();
      }
    } catch (error) {
      message.error("Không thể tải thông tin kết quả");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRespondResult = async (isAccepted: boolean) => {
    const targetResultId = pendingResult?.id || pendingResult?.resultId;
    if (!targetResultId)
      return message.error("Không tìm thấy mã kết quả hợp lệ!");

    setSubmitting(true);
    try {
      await matchResultService.respondToResult(targetResultId, isAccepted);
      message.success(
        isAccepted
          ? "Đã xác nhận kết quả thành công!"
          : "Đã từ chối kết quả thành công!",
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi xử lý kết quả");
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) return null;

  // Lấy danh sách thành viên bị báo vắng mặt dựa theo mảng ID trả về từ API kết quả
  const missingPlayers =
    match.participants?.filter((p: any) =>
      pendingResult?.absentUserIds?.includes(p.userId),
    ) || [];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          {isSubmitter ? (
            <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
              <Hourglass className="text-purple-600" size={18} />
            </div>
          ) : (
            <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
              <ShieldCheck className="text-orange-500" size={18} />
            </div>
          )}
          {isSubmitter ? "Trạng thái kết quả" : "Duyệt kết quả trận đấu"}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
    >
      {loading ? (
        <div className="text-center py-10">
          <Spin />
          <p className="mt-2 text-xs text-gray-400 font-medium">
            Đang tải dữ liệu đối thủ khai báo...
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* CASE 1: NẾU MÌNH LÀ NGƯỜI GỬI BÁO CÁO KẾT QUẢ TRƯỚC */}
          {isSubmitter ? (
            <div className="text-center p-5 bg-purple-50/40 rounded-xl border border-purple-100 flex flex-col items-center">
              <h4 className="text-sm font-bold text-purple-900 m-0 mb-1">
                Gửi kết quả thành công
              </h4>
              <p className="text-xs text-purple-600/90 max-w-[280px] leading-relaxed">
                Hệ thống đang chờ thành viên của đội đối thủ vào bấm xác nhận
                trùng khớp để tính điểm Rank.
              </p>
              <Button
                onClick={onClose}
                className="mt-4 w-full h-10 rounded-xl font-semibold border-purple-200 text-purple-700 hover:text-purple-800 hover:border-purple-300"
              >
                Đóng cửa sổ
              </Button>
            </div>
          ) : (
            // CASE 2: MÌNH LÀ ĐỐI THỦ VÀ CẦN ĐỌC THÔNG TIN ĐỂ DUYỆT
            <>
              <div className="bg-gray-50 border border-gray-200/60 p-4 rounded-xl flex flex-col gap-3">
                {/* HIỂN THỊ ĐỘI THẮNG ĐƯỢC KHAI BÁO */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                     Kết quả đối thủ khai báo thắng:
                  </span>
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      Number(pendingResult?.winningTeamNumber) === 1
                        ? "bg-orange-50/50 border-orange-200 text-orange-700"
                        : "bg-purple-50/50 border-purple-200 text-purple-700"
                    }`}
                  >
                    <span className="font-extrabold text-sm">
                      ĐỘI{" "}
                      {pendingResult?.winningTeamNumber ||
                        pendingResult?.winningTeam ||
                        "Khác"}{" "}
                      CHIẾN THẮNG
                    </span>
                    <Tag
                      color={
                        Number(pendingResult?.winningTeamNumber) === 1
                          ? "orange"
                          : "purple"
                      }
                      className="m-0 font-bold"
                    >
                      Team{" "}
                      {pendingResult?.winningTeamNumber ||
                        pendingResult?.winningTeam ||
                        "?"}
                    </Tag>
                  </div>
                </div>

                {/* HIỂN THỊ THÀNH VIÊN VẮNG MẶT NẾU CÓ */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Danh sách báo vắng mặt (Bị trừ uy tín):
                  </span>
                  {missingPlayers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {missingPlayers.map((p: any) => (
                        <div
                          key={p.userId}
                          className="flex items-center gap-2 bg-rose-50/50 border border-rose-100 p-2 rounded-lg text-rose-700"
                        >
                          <Avatar
                            size={18}
                            className="bg-rose-100 text-rose-600 text-[10px] font-bold shrink-0"
                          >
                            {p.userName?.charAt(0)}
                          </Avatar>
                          <span className="text-xs font-semibold truncate">
                            {p.userName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 font-medium italic bg-white p-2 rounded-lg border border-gray-100">
                      Không có ai vắng mặt (Mọi người đi đủ)
                    </div>
                  )}
                </div>
              </div>

              {/* THÔNG BÁO NHẮC NHỞ */}
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl flex items-start gap-2 text-amber-800">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <p className="text-xs m-0 leading-relaxed font-medium">
                  Hãy kiểm tra kỹ thông tin trên. Nếu đối thủ khai báo sai sự
                  thật, ông hãy bấm{" "}
                  <span className="text-red-600 font-bold">
                    Từ chối kết quả
                  </span>{" "}
                  để chuyển trạng thái tranh chấp cho Ban Quản Trị xử lý.
                </p>
              </div>

              {/* HÀNG NÚT BẤM ACTION ĐỒNG BỘ THEME */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  danger
                  onClick={() => handleRespondResult(false)}
                  loading={submitting}
                  className="h-11 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} />
                  <span>Từ chối kết quả</span>
                </Button>

                <Button
                  type="primary"
                  onClick={() => handleRespondResult(true)}
                  loading={submitting}
                  className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 border-none font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>Xác nhận đúng</span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ApproveResultModal;
