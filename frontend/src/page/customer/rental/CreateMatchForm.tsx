import { useEffect, useState } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Select,
  Input,
  Button,
  message,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";
import type { MatchRequest } from "../../../types/match";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const calculateTotalPrice = (
  court: any,
  startTime: dayjs.Dayjs,
  duration: number,
) => {
  if (!court || !startTime || !duration) return 0;

  const rules = court.priceRules || [];

  if (rules.length === 0) {
    return (court.price || court.minPrice || 0) * duration;
  }

  let totalPrice = 0;
  let currentTime = startTime.clone();
  const chunks = duration * 2;

  for (let i = 0; i < chunks; i++) {
    const currentMinutes = currentTime.hour() * 60 + currentTime.minute();

    const applicableRules = rules.filter((rule: any) => {
      if (!rule.startTime || !rule.endTime) return false;
      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);

      const ruleStartMins = startHour * 60 + startMin;
      const ruleEndMins = endHour * 60 + endMin;

      return currentMinutes >= ruleStartMins && currentMinutes < ruleEndMins;
    });

    applicableRules.sort(
      (a: any, b: any) => (b.priority || 0) - (a.priority || 0),
    );

    const activeRule = applicableRules[0];
    const pricePerHour = activeRule
      ? activeRule.pricePerHour
      : court.price || court.minPrice || 0;

    totalPrice += pricePerHour * 0.5;
    currentTime = currentTime.add(30, "minute");
  }

  return totalPrice;
};

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
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const watchStartTime = Form.useWatch("startTime", form);
  const watchDuration = Form.useWatch("duration", form);

  const navigate = useNavigate();

  const categoryName = (
    court?.categoryName ||
    court?.category?.categoryName ||
    ""
  ).toLowerCase();
  const isFootball =
    categoryName.includes("bóng đá") || categoryName.includes("đá banh");

  const minAllowed = isFootball ? 10 : 2;
  const maxAllowed = isFootball ? 12 : 4;

  useEffect(() => {
    if (watchStartTime && watchDuration) {
      const price = calculateTotalPrice(court, watchStartTime, watchDuration);
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  }, [watchStartTime, watchDuration, court]);

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
      maxPlayers: minAllowed,
      minPlayersToStart: minAllowed / 2,
      duration: 1,
      matchType: "NORMAL",
      minRank: Math.max(0, currentRank - 500),
      maxRank: currentRank + 500,
      note: "",
    });
  }, [court, user, form, minAllowed]);

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
      navigate("/my-matches");
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

      <div className="flex items-end gap-2 mb-6 border-b border-gray-100 pb-4 min-h-[56px]">
        {calculatedPrice > 0 ? (
          <>
            <span className="text-gray-600 font-medium pb-1">Tạm tính</span>
            <span className="text-3xl font-extrabold text-[#9156F1]">
              {calculatedPrice.toLocaleString()}
            </span>
            <span className="text-gray-500 font-medium pb-1">VNĐ</span>
          </>
        ) : (
          <span className="text-xl font-extrabold text-[#9156F1] pb-1">
            Vui lòng chọn giờ để xem giá
          </span>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleCreateMatch}>
        <div className="grid grid-cols-2 gap-4 mb-4">
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

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Form.Item
            label={
              <span className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                Thể thức
                <Tooltip title="Luật chơi riêng biệt cho trận đấu này">
                  <Info size={14} className="text-gray-400" />
                </Tooltip>
              </span>
            }
            name="matchType"
            className="mb-0"
          >
            <Select
              className="w-full h-11 [&_.ant-select-selector]:!border-[#9156F1] [&_.ant-select-selector]:!shadow-[0_0_0_2px_rgba(145,86,241,0.15)]"
              optionLabelProp="label"
              popupMatchSelectWidth={false}
            >
              <Select.Option value="NORMAL" label="Giao lưu">
                <div className="flex flex-col py-1">
                  <span className="font-semibold text-gray-800">Giao lưu</span>
                  <span className="text-[11px] text-gray-500">
                    Chơi vui vẻ cọ xát, không ghi nhận kết quả
                  </span>
                </div>
              </Select.Option>
              <Select.Option value="BET" label="Chia Kèo">
                <div className="flex flex-col py-1">
                  <span className="font-semibold text-[#ea580c]">Chia Kèo</span>
                  <span className="text-[11px] text-gray-500">
                    Đội thua sẽ phải chịu phạt (tiền sân, nước, bữa ăn,...)
                  </span>
                </div>
              </Select.Option>
              <Select.Option value="RANKED" label="Đánh Rank">
                <div className="flex flex-col py-1">
                  <span className="font-semibold text-[#9156F1]">
                    Đánh Rank
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Thi đấu nghiêm túc, tích lũy điểm hạng hệ thống
                  </span>
                </div>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                Tối đa
                <Tooltip
                  title={`Số người chơi tối đa được phép tham gia (từ ${minAllowed} đến ${maxAllowed} người)`}
                >
                  <Info size={14} className="text-gray-400" />
                </Tooltip>
              </span>
            }
            name="maxPlayers"
            rules={[
              { required: true, message: "Nhập!" },
              {
                validator: (_, value) =>
                  value % 2 === 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("Phải chẵn!")),
              },
            ]}
            className="mb-0"
          >
            <InputNumber
              min={minAllowed}
              max={maxAllowed}
              step={2}
              className="w-full h-11 flex items-center rounded-lg"
              onChange={(val) => {
                if (val && val % 2 === 0) {
                  form.setFieldValue("minPlayersToStart", val / 2);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                Tối thiểu
                <Tooltip title="Số lượng tối thiểu chia đều 2 bên để trận đấu được phép bắt đầu.">
                  <Info size={14} className="text-gray-400" />
                </Tooltip>
              </span>
            }
            name="minPlayersToStart"
            rules={[{ required: true }]}
            className="mb-0"
          >
            <InputNumber
              readOnly
              className="w-full h-11 flex items-center rounded-lg bg-gray-50 text-gray-500 border-gray-200"
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className="font-semibold text-gray-700">Ghi chú thêm</span>
          }
          name="note"
          className="mb-6"
        >
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Trình độ trung bình khá, ai có bóng mang theo nha..."
            className="rounded-lg border-gray-300"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loadingMatch}
          className="w-full h-[52px] text-base font-bold rounded-xl mt-1
               !bg-[#9156F1] !border-[#9156F1]
               hover:!bg-[#7e43d9] hover:!border-[#7e43d9]
               flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          Xác nhận tạo kèo
        </Button>
      </Form>
    </div>
  );
}
