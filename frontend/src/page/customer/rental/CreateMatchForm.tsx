import { useEffect, useState } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Select,
  Radio,
  Input,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";
import type { MatchRequest } from "../../../types/match";
import {
  Coffee,
  MapPin,
  Utensils,
  Activity,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function CreateMatchForm({
  court,
  address,
  selectedDate,
  selectedTime,
}: {
  court: any;
  address?: any;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
}) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loadingMatch, setLoadingMatch] = useState(false);

  // State quản lý việc Ẩn/Hiện Cài đặt nâng cao
  const [showAdvanced, setShowAdvanced] = useState(false);

  const displayPrice = court?.minPrice || court?.price || 0;

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      const newDateTime = selectedDate
        .clone()
        .hour(hour)
        .minute(minute)
        .second(0);
      form.setFieldValue("startTime", newDateTime);
    }
  }, [selectedDate, selectedTime, form]);

  useEffect(() => {
    if (!court) return;

    const currentCategoryId = court?.category?.id || court?.categoryId;
    const ranks = (user as any)?.categoryRank || user?.categoryRanks || [];

    const userRankData = ranks.find(
      (item: any) => item.categoryId === currentCategoryId,
    );

    const currentRank = userRankData ? userRankData.rankPoint : 0;

    form.setFieldsValue({
      maxPlayers: 4,
      minPlayersToStart: 2,
      duration: 1,
      matchType: "NORMAL",
      minRank: Math.max(0, currentRank - 500),
      maxRank: currentRank + 500,
      note: "",
    });
  }, [court, user, form]);

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

  const handleCreateMatch = async (values: any) => {
    setLoadingMatch(true);
    try {
      const matchStart = values.startTime;
      const matchEnd = matchStart.add(values.duration, "hour");

      const payload: MatchRequest = {
        courtId: court?.courtId || null,
        categoryId: Number(court?.categoryId || court?.category?.categoryId),

        street: address?.street || "",
        ward: address?.ward || "",
        cityId: Number(address?.city?.cityId || address?.cityId || 1),

        startTime: matchStart.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: matchEnd.format("YYYY-MM-DDTHH:mm:ss"),

        maxPlayers: Number(values.maxPlayers),
        minPlayersToStart: Number(values.minPlayersToStart),
        isRecurring: false,
        matchType: values.matchType,
        minRank:
          values.matchType === "RANKED" ? Number(values.minRank) : undefined,
        maxRank:
          values.matchType === "RANKED" ? Number(values.maxRank) : undefined,
        note: values.note || "",
      };

      await matchService.createMatch(payload);
      message.success("Tạo trận đấu thành công!");
      form.resetFields();
    } catch (error: any) {
      console.error("Lỗi Backend trả về:", error.response?.data);
      message.error(error.response?.data?.message || "Không thể tạo trận đấu.");
    } finally {
      setLoadingMatch(false);
    }
  };

  if (!court) {
    return (
      <div className="text-center py-6 text-gray-500 italic">
        Đang tải thông tin sân...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center gap-2">
        <p className="text-sm text-purple-900">
          Sân áp dụng: <strong>{court?.courtName}</strong>
        </p>
      </div>

      <div className="flex items-end gap-2 mb-6 border-b border-gray-100 pb-4">
        {displayPrice > 0 ? (
          <>
            <span className="text-gray-600 font-medium pb-1">Giá từ</span>
            <span className="text-4xl font-extrabold text-orange-500">
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-gray-500 font-medium pb-1">VNĐ / giờ</span>
          </>
        ) : (
          <span className="text-2xl font-extrabold text-[#9156F1] pb-1">
            Liên hệ để biết giá
          </span>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleCreateMatch}>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">Giờ bắt đầu</span>
            }
            name="startTime"
            rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu!" }]}
            className="mb-0"
          >
            <DatePicker
              showTime={{ format: "HH:mm", hideDisabledOptions: true }}
              format="HH:mm - DD/MM"
              className="w-full h-11"
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
              <span className="font-semibold text-gray-700">
                Thời lượng chơi
              </span>
            }
            name="duration"
            rules={[{ required: true }]}
            className="mb-0"
          >
            <Select className="w-full h-11">
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

        <hr className="my-5 border-gray-100" />

        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Thể thức thi đấu
            </span>
          }
          name="matchType"
          className="mb-3"
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className="flex w-full"
          >
            <Radio.Button value="NORMAL" className="w-1/3 text-center">
              Giao lưu
            </Radio.Button>
            <Radio.Button value="BET" className="w-1/3 text-center">
              Chia Kèo
            </Radio.Button>
            <Radio.Button value="RANKED" className="w-1/3 text-center">
              Đánh Rank
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.matchType !== curr.matchType}
        >
          {({ getFieldValue }) => {
            const type = getFieldValue("matchType");

            if (type === "BET") {
              return (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 animate-in fade-in duration-200">
                  <Form.Item
                    label={
                      <span className="text-orange-800 font-bold uppercase tracking-wider text-[11px]">
                        Phần thưởng Kèo (Phe thua bao)
                      </span>
                    }
                    name="note"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn hoặc nhập phần thưởng kèo!",
                      },
                    ]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn phần thưởng..."
                      className="w-full font-bold"
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <div className="p-2 border-t border-slate-100">
                            <Input
                              placeholder="Hoặc tự nhập kèo khác..."
                              className="rounded-md"
                              onKeyDown={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                form.setFieldsValue({
                                  note: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    >
                      <Select.Option value="Chầu nước giải khát">
                        <div className="flex items-center gap-2">
                          <Coffee size={16} className="text-amber-600" />
                          <span>Chầu nước giải khát</span>
                        </div>
                      </Select.Option>
                      <Select.Option value="Tiền sân">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-600" />
                          <span>Thanh toán tiền sân</span>
                        </div>
                      </Select.Option>
                      <Select.Option value="Bữa ăn sáng/tối">
                        <div className="flex items-center gap-2">
                          <Utensils size={16} className="text-rose-600" />
                          <span>Bữa ăn sáng/tối</span>
                        </div>
                      </Select.Option>
                      <Select.Option value="Cầu/Bóng thi đấu">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className="text-blue-600" />
                          <span>Cầu/Bóng thi đấu</span>
                        </div>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              );
            }

            if (type === "RANKED") {
              return (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-6 grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <Form.Item
                    label={
                      <span className="text-purple-700 font-bold">
                        Rank tối thiểu
                      </span>
                    }
                    name="minRank"
                    className="mb-0"
                  >
                    <InputNumber
                      min={0}
                      step={100}
                      readOnly
                      className="w-full font-bold text-purple-700 text-lg bg-gray-100/50 cursor-not-allowed"
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
                  >
                    <InputNumber
                      step={100}
                      readOnly
                      className="w-full font-bold text-purple-700 text-lg bg-gray-100/50 cursor-not-allowed"
                    />
                  </Form.Item>
                </div>
              );
            }

            return <div className="mb-2"></div>;
          }}
        </Form.Item>

        {/* --- NÚT MỞ RỘNG CÀI ĐẶT NÂNG CAO --- */}
        <div
          className="flex items-center justify-between cursor-pointer py-3 border-t border-b border-gray-100 mb-5 text-gray-500 hover:text-[#9156F1] transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={16} />
            <span className="font-semibold text-sm">
              Cài đặt nâng cao (Số người, Ghi chú)
            </span>
          </div>
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {/* --- KHU VỰC ẨN/HIỆN --- */}
        {showAdvanced && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Số người tối đa
                  </span>
                }
                name="maxPlayers"
                rules={[{ required: true, message: "Nhập số người tối đa!" }]}
                className="mb-0"
              >
                <InputNumber
                  min={2}
                  className="w-full h-11 flex items-center rounded-lg"
                  onChange={(val) => {
                    if (val)
                      form.setFieldValue(
                        "minPlayersToStart",
                        Math.ceil(val / 2),
                      );
                  }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Người tối thiểu
                  </span>
                }
                name="minPlayersToStart"
                tooltip="Trận đấu sẽ bị hủy nếu không đủ số lượng"
                rules={[
                  { required: true, message: "Nhập số người!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("maxPlayers") >= value)
                        return Promise.resolve();
                      return Promise.reject(new Error("Tối thiểu ≤ Tối đa!"));
                    },
                  }),
                ]}
                className="mb-0"
              >
                <InputNumber
                  min={1}
                  className="w-full h-11 flex items-center rounded-lg"
                />
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.matchType !== curr.matchType}
            >
              {({ getFieldValue }) => {
                if (getFieldValue("matchType") !== "BET") {
                  return (
                    <Form.Item
                      label={
                        <span className="font-semibold text-gray-700">
                          Ghi chú thêm
                        </span>
                      }
                      name="note"
                      className="mb-6"
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Ví dụ: Trình độ trung bình khá, vui lòng mang theo nước..."
                        className="rounded-lg border-gray-300"
                      />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>
          </div>
        )}

        <Button
          type="primary"
          htmlType="submit"
          loading={loadingMatch}
          className="w-full h-[52px] text-base font-bold rounded-xl mt-1
               !bg-orange-500 !border-orange-500
               hover:!bg-orange-600 hover:!border-orange-600
               flex items-center justify-center gap-2 shadow-md"
        >
          Xác nhận tạo kèo
        </Button>
      </Form>
    </div>
  );
}
