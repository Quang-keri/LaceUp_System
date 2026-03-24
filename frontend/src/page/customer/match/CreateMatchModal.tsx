import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import matchService from "../../../service/match/matchService.ts";
import { DatePicker, InputNumber, Form, Select, Radio, Input } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../../../context/AuthContext.tsx"; // Sửa lại đường dẫn import nếu cần

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMatchModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateMatchModalProps) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Khởi tạo giá trị mặc định khi Modal mở
  useEffect(() => {
    if (isOpen) {
      const currentRank = user?.rankPoint || 0;
      form.setFieldsValue({
        categoryId: "1",
        address: "",
        startTime: null,
        duration: 1,
        maxPlayers: 10,
        minPlayersToStart: 5,
        matchType: "NORMAL",
        winnerPercent: 50, // Mặc định chia kèo 50-50
        minRank: Math.max(0, currentRank - 1000), // Không để rank âm
        maxRank: currentRank + 1000,
        note: "",
      });
    } else {
      form.resetFields(); // Xóa form khi đóng
    }
  }, [isOpen, user, form]);

  // Hàm chặn chọn giờ phút quá khứ
  const disabledDateTime = (current: any) => {
    const now = dayjs();
    const isToday = current && current.isSame(now, "day");

    return {
      disabledHours: () => {
        if (!isToday) return [];
        return Array.from({ length: now.hour() }, (_, i) => i);
      },
      disabledMinutes: (selectedHour: number) => {
        const minuteOptions = [0, 30];
        const disabledMin = Array.from({ length: 60 }, (_, i) => i).filter(
          (m) => !minuteOptions.includes(m),
        );

        if (isToday && selectedHour === now.hour()) {
          if (now.minute() >= 0) disabledMin.push(0);
          if (now.minute() >= 30) disabledMin.push(30);
        }

        return disabledMin;
      },
    };
  };

  const handleFinish = async (values: any) => {
    if (values.matchType === "RANKED" && values.minRank > values.maxRank) {
      return toast.warning("Điểm tối thiểu không được lớn hơn điểm tối đa!");
    }

    setLoading(true);
    try {
      const startObj = dayjs(values.startTime);
      const endObj = startObj.add(values.duration, "hour");

      const payload = {
        categoryId: values.categoryId,
        address: values.address,
        startTime: startObj.toISOString(),
        endTime: endObj.toISOString(),
        maxPlayers: values.maxPlayers,
        minPlayersToStart: values.minPlayersToStart,
        isRecurring: false,
        matchType: values.matchType,
        winnerPercent: values.matchType === "BET" ? values.winnerPercent : null,
        minRank: values.matchType === "RANKED" ? values.minRank : null,
        maxRank: values.matchType === "RANKED" ? values.maxRank : null,
        note: values.note || "",
        courtId: null, // Tạo kèo giao lưu tự do, chưa chốt sân cứng
      };

      const response = await matchService.createMatch(payload as any);
      if (response.code === 1000 || response.code === 0) {
        toast.success("Đăng tin tìm đồng đội thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo trận");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
          🏸 Tìm Đồng Đội Giao Lưu
        </h2>

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div className="space-y-1">
            {/* Chọn Môn & Khu vực */}
            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Bạn muốn chơi môn gì?
                  </span>
                }
                name="categoryId"
                className="mb-0"
              >
                <Select size="large" className="w-full">
                  <Select.Option value="1">Cầu lông</Select.Option>
                  <Select.Option value="2">Bóng đá</Select.Option>
                  <Select.Option value="3">Pickleball</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Khu vực dự kiến
                  </span>
                }
                name="address"
                rules={[{ required: true, message: "Vui lòng nhập khu vực!" }]}
                className="mb-2"
              >
                <Input
                  size="large"
                  placeholder="Ví dụ: Quận 1, Quận 7 hoặc tên sân..."
                  className="rounded-xl border-gray-200"
                />
              </Form.Item>
            </div>

            <hr className="my-4 border-gray-100" />

            {/* Thể thức thi đấu */}
            <Form.Item
              label={
                <span className="font-bold text-gray-500 uppercase text-xs">
                  Thể thức thi đấu
                </span>
              }
              name="matchType"
            >
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                className="flex w-full"
              >
                <Radio.Button value="NORMAL" className="w-1/3 text-center">
                  😊 Giao lưu
                </Radio.Button>
                <Radio.Button value="BET" className="w-1/3 text-center">
                  💰 Chia Kèo
                </Radio.Button>
                <Radio.Button value="RANKED" className="w-1/3 text-center">
                  🏆 Đánh Rank
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            {/* Khối thay đổi theo thể thức */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.matchType !== curr.matchType ||
                prev.winnerPercent !== curr.winnerPercent
              }
            >
              {({ getFieldValue }) => {
                const type = getFieldValue("matchType");

                if (type === "BET") {
                  const currentWinnerPercent =
                    getFieldValue("winnerPercent") || 0;
                  const loserPercent = 100 - currentWinnerPercent;

                  return (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                      <Form.Item
                        label={
                          <span className="text-yellow-700 font-bold">
                            % Tiền sân phe THẮNG phải trả
                          </span>
                        }
                        className="mb-0"
                      >
                        <div className="flex items-center gap-4">
                          <Form.Item name="winnerPercent" noStyle>
                            <InputNumber
                              min={0}
                              max={50}
                              step={10}
                              formatter={(value) => `${value}%`}
                              parser={(value) => value!.replace("%", "")}
                              className="w-24 font-bold text-yellow-700 text-lg"
                            />
                          </Form.Item>

                          <div className="flex-1 bg-yellow-100/80 py-1.5 px-3 rounded-lg border border-yellow-300 text-sm text-yellow-800 flex items-center gap-2 shadow-sm">
                            <span>👉</span>
                            <span>
                              <strong>Phe THUA</strong> sẽ trả:{" "}
                              <span className="text-red-500 font-bold text-base">
                                {loserPercent}%
                              </span>
                            </span>
                          </div>
                        </div>
                      </Form.Item>
                    </div>
                  );
                }

                if (type === "RANKED") {
                  return (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-4 grid grid-cols-2 gap-4">
                      <Form.Item
                        label={
                          <span className="text-purple-700 font-bold">
                            Rank tối thiểu
                          </span>
                        }
                        name="minRank"
                        rules={[{ required: true, message: "Bắt buộc nhập" }]}
                        className="mb-0"
                      >
                        <InputNumber
                          min={0}
                          step={100}
                          className="w-full font-bold text-purple-700 text-lg"
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span className="text-purple-700 font-bold">
                            Rank tối đa
                          </span>
                        }
                        name="maxRank"
                        className="mb-0"
                        rules={[
                          { required: true, message: "Bắt buộc nhập" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue("minRank") <= value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error("Phải ≥ Min!"));
                            },
                          }),
                        ]}
                      >
                        <InputNumber
                          step={100}
                          className="w-full font-bold text-purple-700 text-lg"
                        />
                      </Form.Item>
                    </div>
                  );
                }

                return null;
              }}
            </Form.Item>

            <hr className="my-4 border-gray-100" />

            {/* Thời gian */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Giờ bắt đầu
                  </span>
                }
                name="startTime"
                rules={[
                  { required: true, message: "Vui lòng chọn giờ bắt đầu!" },
                ]}
              >
                <DatePicker
                  size="large"
                  showTime={{ format: "HH:mm", hideDisabledOptions: true }}
                  format="HH:mm - DD/MM"
                  className="w-full rounded-xl border-gray-200"
                  placeholder="Chọn giờ"
                  showNow={false}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  disabledTime={disabledDateTime}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Thời lượng chơi
                  </span>
                }
                name="duration"
                rules={[{ required: true }]}
              >
                <Select size="large" className="w-full">
                  <Select.Option value={0.5}>30 phút</Select.Option>
                  <Select.Option value={1}>1 giờ</Select.Option>
                  <Select.Option value={1.5}>1.5 giờ</Select.Option>
                  <Select.Option value={2}>2 giờ</Select.Option>
                  <Select.Option value={2.5}>2 giờ 30 phút</Select.Option>
                  <Select.Option value={3}>3 giờ</Select.Option>
                  <Select.Option value={3.5}>3 giờ 30 phút</Select.Option>
                  <Select.Option value={4}>4 giờ</Select.Option>
                </Select>
              </Form.Item>
            </div>

            {/* Số lượng người */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Max người
                  </span>
                }
                name="maxPlayers"
                rules={[{ required: true, message: "Nhập max người!" }]}
              >
                <InputNumber
                  size="large"
                  min={2}
                  className="w-full rounded-xl"
                  onChange={(val) => {
                    if (val)
                      form.setFieldsValue({
                        minPlayersToStart: Math.ceil(val / 2),
                      });
                  }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Min chốt kèo
                  </span>
                }
                name="minPlayersToStart"
                rules={[
                  { required: true, message: "Nhập min người!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("maxPlayers") >= value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Min phải ≤ Max!"));
                    },
                  }),
                ]}
              >
                <InputNumber
                  size="large"
                  min={1}
                  className="w-full rounded-xl"
                />
              </Form.Item>
            </div>

            {/* Trường Ghi chú */}
            <Form.Item
              label={
                <span className="font-bold text-gray-500 uppercase text-xs">
                  Ghi chú thêm
                </span>
              }
              name="note"
            >
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: Trình độ trung bình khá, tự mang nước/bóng..."
                className="rounded-xl border-gray-200"
              />
            </Form.Item>

            {/* Nút Submit */}
            <div className="mt-6 flex justify-end items-center gap-6">
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 disabled:bg-gray-300 transition-all"
              >
                {loading ? "Đang đăng tin..." : "Đăng kèo ngay"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CreateMatchModal;
