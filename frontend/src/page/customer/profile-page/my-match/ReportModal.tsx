import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Upload, Button, message, Avatar } from "antd";
import { Flag, UploadCloud, AlertCircle } from "lucide-react";
import matchService from "../../../../service/match/matchService.ts";
import type { UploadFile } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Option } = Select;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  allPlayers: any[];
  currentUserId?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  matchId,
  allPlayers,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(false);
  const [reasonType, setReasonType] = useState<
    "ABSENT" | "BAD_BEHAVIOR" | "OTHER"
  >("ABSENT");
  const [reportedUserIds, setReportedUserIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const currentUser = allPlayers.find((p) => p.userId === currentUserId);
  const isPaid =
    currentUser?.isPaid === true || currentUser?.paymentStatus === "SUCCESS";

  const handleSubmit = async () => {
    if (!isPaid) {
      return message.error("Bạn chưa thanh toán nên không thể gửi báo cáo!");
    }

    if (reportedUserIds.length === 0) {
      return message.warning("Vui lòng chọn người chơi vi phạm / vắng mặt!");
    }

    if (!description.trim()) {
      return message.warning("Vui lòng nhập chi tiết mô tả vi phạm!");
    }

    setLoading(true);
    try {
      const evidenceImages = fileList.map((file) => file.url || "");

      const payload = {
        matchId,
        reportedUserIds,
        reasonType,
        description,
        evidenceImages,
      };

      const response = await matchService.reportViolation(payload);
      if (response.code === 203 || response.code === 200) {
        message.success("Đã gửi báo cáo thành công. Cảm ơn bạn!");
        resetForm();
        onClose();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi gửi báo cáo!");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReasonType("ABSENT");
    setReportedUserIds([]);
    setDescription("");
    setFileList([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 text-lg font-bold text-gray-800">
          <div className="p-2 rounded-lg border bg-rose-50 border-rose-200">
            <Flag className="text-rose-500" size={20} />
          </div>
          Báo cáo vi phạm / Vắng mặt
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      <div className="mt-5 space-y-4">
        {!isPaid && (
          <div className="flex items-start gap-1.5 text-[12px] text-white bg-red-500 p-3 rounded-lg shadow-sm mb-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed font-bold">
              Bạn chưa hoàn tất thanh toán tiền sân. Bạn phải thanh toán thành
              công mới có quyền tố cáo người khác!
            </span>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-[12px] text-rose-600/90 bg-rose-50/50 p-3 rounded-lg border border-rose-100 mb-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            Hành vi gian lận, phá hoại hoặc <strong>vắng mặt (bỏ bom)</strong>{" "}
            sẽ bị xử lý nghiêm. Người vi phạm sẽ bị trừ điểm Uy tín và điểm
            Rank. Trận đấu vẫn sẽ tiếp tục diễn ra với những người chơi còn lại!
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Loại vi phạm
          </label>
          <Select
            className="w-full"
            value={reasonType}
            onChange={setReasonType}
            disabled={!isPaid}
          >
            <Option value="ABSENT">
              <span className="font-semibold text-rose-600">
                Vắng mặt / Bỏ bom (Không đến)
              </span>
            </Option>
            <Option value="BAD_BEHAVIOR">Hành vi tiêu cực / Chửi bới</Option>
            <Option value="OTHER">Lý do khác</Option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Người bị báo cáo <span className="text-rose-500">*</span>
          </label>
          <Select
            mode="multiple"
            placeholder="Chọn người chơi vi phạm / vắng mặt..."
            className="w-full custom-select"
            value={reportedUserIds}
            onChange={setReportedUserIds}
            optionLabelProp="label"
            disabled={!isPaid}
          >
            {allPlayers.map((player) => (
              <Option
                key={player.userId}
                value={player.userId}
                label={player.userName}
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    size="small"
                    className="bg-gray-100 text-gray-600 text-[10px] font-bold"
                  >
                    {player.userName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <span className="font-medium text-gray-700">
                    {player.userName}
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Mô tả chi tiết <span className="text-rose-500">*</span>
          </label>
          <TextArea
            rows={3}
            placeholder="Vui lòng mô tả rõ sự việc xảy ra (VD: Bạn A không đến sân, gọi không nghe máy...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isPaid}
            className="rounded-xl border-gray-200 focus:ring-1 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Bằng chứng (Hình ảnh/Screenshot)
          </label>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={() => false}
            maxCount={3}
            disabled={!isPaid}
          >
            {fileList.length >= 3 ? null : (
              <div className="flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 transition-colors">
                <UploadCloud size={24} />
                <div className="mt-2 text-xs font-medium">Tải ảnh lên</div>
              </div>
            )}
          </Upload>
        </div>

        <div className="flex gap-3 pt-3">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl font-medium px-6"
          >
            Đóng
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!isPaid}
            className={`flex-1 h-11 rounded-xl border-none font-bold text-white shadow-sm ${
              !isPaid
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90"
            }`}
          >
            Gửi Báo Cáo
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;
