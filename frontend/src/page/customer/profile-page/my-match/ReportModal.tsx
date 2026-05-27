import React, { useState } from "react";
import { Modal, Select, Input, Upload, Button, message, Avatar } from "antd";
import { Flag, UploadCloud, AlertCircle, Zap } from "lucide-react";
import matchService from "../../../../service/match/matchService.ts";
import type { UploadFile } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Option } = Select;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  allPlayers: any[];
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  matchId,
  allPlayers,
}) => {
  const [loading, setLoading] = useState(false);
  const [reasonType, setReasonType] = useState<
    "BAD_BEHAVIOR" | "ABSENT" | "LATE" | "OTHER" | "EARLY_ABSENT"
  >("BAD_BEHAVIOR");
  const [reportedUserIds, setReportedUserIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      return message.warning("Vui lòng nhập chi tiết mô tả vi phạm!");
    }

    if (reasonType === "EARLY_ABSENT" && reportedUserIds.length === 0) {
      return message.warning("Vui lòng chọn người chơi vắng mặt để hủy trận!");
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
    setReasonType("BAD_BEHAVIOR");
    setReportedUserIds([]);
    setDescription("");
    setFileList([]);
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const isEarlyAbsent = reasonType === "EARLY_ABSENT";

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 text-lg font-bold text-gray-800">
          <div
            className={`p-2 rounded-lg border ${
              isEarlyAbsent
                ? "bg-orange-50 border-orange-200"
                : "bg-rose-50 border-rose-200"
            }`}
          >
            {isEarlyAbsent ? (
              <Zap className="text-orange-500" size={20} />
            ) : (
              <Flag className="text-rose-500" size={20} />
            )}
          </div>
          {isEarlyAbsent ? "Hủy trận khẩn cấp" : "Báo cáo vi phạm"}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      <div className="mt-5 space-y-4">
        {isEarlyAbsent ? (
          <div className="flex items-start gap-1.5 text-[12px] text-orange-700 bg-orange-50/70 p-3 rounded-lg border border-orange-200 mb-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">
              Dùng chức năng này khi có người vắng mặt từ đầu và bạn muốn hủy
              trận hiện tại để trống sân tạo phòng mới. Chủ sân sẽ duyệt yêu cầu
              này và người vắng sẽ bị trừ 20 uy tín.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 text-[12px] text-rose-600/90 bg-rose-50/50 p-3 rounded-lg border border-rose-100 mb-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              Hành vi gian lận, phá hoại hoặc chửi bới sẽ bị xử lý nghiêm. Quản
              trị viên sẽ xem xét kỹ bằng chứng trước khi trừ điểm uy tín hoặc
              khóa tài khoản.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Loại yêu cầu
          </label>
          <Select
            className="w-full"
            value={reasonType}
            onChange={setReasonType}
          >
            <Option value="EARLY_ABSENT">
              <span className="font-semibold text-orange-600">
                Hủy trận khẩn cấp (Thiếu người)
              </span>
            </Option>
            <Option value="ABSENT">Vắng mặt (Nhưng vẫn đá xong)</Option>
            <Option value="BAD_BEHAVIOR">Hành vi tiêu cực / Chửi bới</Option>
            <Option value="LATE">Đến muộn quá thời gian quy định</Option>
            <Option value="OTHER">Lý do khác</Option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Người bị báo cáo{" "}
            {isEarlyAbsent && <span className="text-rose-500">*</span>}
          </label>
          <Select
            mode="multiple"
            placeholder={
              isEarlyAbsent
                ? "Bắt buộc chọn người vắng mặt..."
                : "Chọn người chơi vi phạm..."
            }
            className="w-full custom-select"
            value={reportedUserIds}
            onChange={setReportedUserIds}
            optionLabelProp="label"
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
                    {player.userName?.charAt(0)}
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
            placeholder={
              isEarlyAbsent
                ? "Ghi chú cho chủ sân (VD: Bạn B không đến, xin hủy trận để nhóm tự tạo trận mới...)"
                : "Vui lòng mô tả rõ sự việc xảy ra..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`rounded-xl border-gray-200 focus:ring-1 ${
              isEarlyAbsent
                ? "focus:border-orange-500 focus:ring-orange-500"
                : "focus:border-purple-500 focus:ring-purple-500"
            }`}
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
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            className={`flex-1 h-11 rounded-xl border-none font-bold text-white shadow-sm ${
              isEarlyAbsent
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
                : "bg-gradient-to-r from-orange-500 to-purple-600 hover:opacity-90"
            }`}
          >
            {isEarlyAbsent ? "Gửi Yêu Cầu Hủy Trận" : "Gửi Báo Cáo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;
