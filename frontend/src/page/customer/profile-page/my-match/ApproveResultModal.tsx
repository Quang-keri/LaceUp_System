import React, { useEffect, useState } from "react";
import { Modal, Button, Spin, message } from "antd";
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
        isAccepted ? "Đã xác nhận kết quả thành công!" : "Đã từ chối kết quả!",
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

  return (
    <Modal
      title={
        <div className="text-xl font-bold text-orange-600">
          {isSubmitter ? " Trạng thái kết quả" : " Duyệt kết quả trận đấu"}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin />
          <p className="mt-2 text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <div className="mt-4">
          {isSubmitter ? (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
              <p className="text-4xl mb-3">🕒</p>
              <p className="text-blue-800 font-semibold mb-2">
                Bạn đã gửi kết quả thành công!
              </p>
              <p className="text-sm text-blue-600">
                Vui lòng chờ đối thủ xác nhận.
              </p>
              <Button type="primary" className="mt-6 w-full" onClick={onClose}>
                Đóng
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-600 text-center">
                  Đối thủ đã gửi yêu cầu chốt kết quả trận đấu{" "}
                  <strong>{match.title}</strong>. Vui lòng xác nhận.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  danger
                  onClick={() => handleRespondResult(false)}
                  loading={submitting}
                >
                  Từ chối kết quả
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleRespondResult(true)}
                  loading={submitting}
                >
                  Xác nhận đúng
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
