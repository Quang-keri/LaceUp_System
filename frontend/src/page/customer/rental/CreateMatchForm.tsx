import { useEffect, useState } from "react";
import {
  Form,
  InputNumber,
  Select,
  Input,
  Button,
  message,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";

import type { MatchRequest } from "../../../types/match";
import type { CourtResponse, CourtPriceResponse } from "../../../types/court";
import type { ApiErrorResponse } from "../../../types/ApiResponse";
import type { CategoryRankResponse, UserResponse } from "../../../types/user";

export interface MatchFormValues {
  startTime: dayjs.Dayjs;
  duration: number;
  matchType: "NORMAL" | "BET" | "RANKED";
  maxPlayers: number;
  minPlayersToStart: number;
  note?: string;
}

const calculateTotalPrice = (
  court: CourtResponse | null | undefined,
  startTime: dayjs.Dayjs,
  duration: number,
) => {
  if (!court || !startTime || !duration) return 0;

  const rules: CourtPriceResponse[] = court.priceRules || [];
  const basePrice = Number(court.pricePerHour || 0);

  if (rules.length === 0) {
    return basePrice * duration;
  }

  let totalPrice = 0;
  let currentTime = startTime.clone();
  const chunks = duration * 2;

  for (let i = 0; i < chunks; i++) {
    const currentMinutes = currentTime.hour() * 60 + currentTime.minute();

    const applicableRules = rules.filter((rule) => {
      if (!rule.startTime || !rule.endTime) return false;
      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);

      const ruleStartMins = startHour * 60 + startMin;
      const ruleEndMins = endHour * 60 + endMin;

      return currentMinutes >= ruleStartMins && currentMinutes < ruleEndMins;
    });

    applicableRules.sort(
      (a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0),
    );

    const activeRule = applicableRules[0];
    const pricePerHour = activeRule
      ? Number(activeRule.pricePerHour)
      : basePrice;

    totalPrice += pricePerHour * 0.5;
    currentTime = currentTime.add(30, "minute");
  }

  return totalPrice;
};

interface CreateMatchFormProps {
  court?: CourtResponse | null;
  selectedDate?: dayjs.Dayjs;
  selectedTime?: string | null;
  selectedDuration?: number;
}

export default function CreateMatchForm({
  court,
  selectedDate,
  selectedTime,
  selectedDuration,
}: CreateMatchFormProps) {
  const { user } = useAuth();
  const [form] = Form.useForm<MatchFormValues>();
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const watchStartTime = Form.useWatch("startTime", form);
  const watchDuration = Form.useWatch("duration", form);
  const watchMatchType = Form.useWatch("matchType", form);

  const currentStartTime = watchStartTime || form.getFieldValue("startTime");
  const currentDuration = watchDuration || form.getFieldValue("duration") || 1;

  const navigate = useNavigate();
  const location = useLocation();

  const categoryName = (court?.categoryName || "").toLowerCase();
  const isFootball =
    categoryName.includes("bóng đá") || categoryName.includes("đá banh");

  const minAllowed = isFootball ? 10 : 2;
  const maxAllowed = isFootball ? 12 : 4;

  const currentCategoryId = court?.categoryId;
  const currentCategoryName = court?.categoryName;

  const typedUser = user as UserResponse | null;
  const ranks: CategoryRankResponse[] = typedUser?.categoryRanks || [];

  const userRankData = ranks.find(
    (item: CategoryRankResponse) =>
      (currentCategoryId &&
        String(item.categoryId) === String(currentCategoryId)) ||
      (currentCategoryName &&
        item.categoryName?.trim().toLowerCase() ===
          currentCategoryName?.trim().toLowerCase()),
  );

  const currentRank = userRankData ? userRankData.rankPoint : 0;
  const calculatedMinRank = Math.max(0, currentRank - 500);
  const calculatedMaxRank = currentRank + 500;

  useEffect(() => {
    const savedData = sessionStorage.getItem("pendingMatchForm");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.startTime) {
          parsedData.startTime = dayjs(parsedData.startTime);
        }
        form.setFieldsValue(parsedData);
      } catch (e) {
        console.error("Lỗi khi khôi phục dữ liệu form", e);
      }
      sessionStorage.removeItem("pendingMatchForm");
    }
  }, [form]);

  useEffect(() => {
    if (currentStartTime && currentDuration) {
      const price = calculateTotalPrice(
        court,
        currentStartTime,
        currentDuration,
      );
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  }, [currentStartTime, currentDuration, court]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hour, minute] = selectedTime.split(":").map(Number);
      const newDateTime = selectedDate
        .clone()
        .hour(hour)
        .minute(minute)
        .second(0);

      form.setFieldsValue({
        startTime: newDateTime,
        duration: selectedDuration || form.getFieldValue("duration") || 1,
      });
    } else if (!selectedTime) {
      form.setFieldsValue({ startTime: undefined as unknown as dayjs.Dayjs });
    }
  }, [selectedDate, selectedTime, selectedDuration, form]);

  useEffect(() => {
    if (!court) return;

    if (!form.getFieldValue("matchType")) {
      form.setFieldsValue({
        maxPlayers: minAllowed,
        minPlayersToStart: minAllowed / 2,
        duration: selectedDuration || 1,
        matchType: "NORMAL",
        note: "",
      });
    }
  }, [court, minAllowed, selectedDuration, form]);

  const handleRequireLogin = (values: MatchFormValues) => {
    message.warning("Vui lòng đăng nhập để tiếp tục tạo trận đấu!");
    sessionStorage.setItem(
      "pendingMatchForm",
      JSON.stringify({
        ...values,
        startTime: values.startTime ? values.startTime.toISOString() : null,
      }),
    );
    navigate("/login", {
      state: { from: location.pathname + location.search },
    });
  };

  const handleCreateMatch = async (values: MatchFormValues) => {
    if (!user) {
      handleRequireLogin(values);
      return;
    }

    setLoadingMatch(true);
    try {
      const matchStart = values.startTime;
      const matchEnd = matchStart.add(values.duration * 60, "minute");

      const payload: MatchRequest = {
        courtId: court?.courtId || null,
        categoryId: currentCategoryId ? Number(currentCategoryId) : 0,

        startTime: matchStart.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: matchEnd.format("YYYY-MM-DDTHH:mm:ss"),

        maxPlayers: Number(values.maxPlayers),
        minPlayersToStart: Number(values.minPlayersToStart),
        isRecurring: false,
        matchType: values.matchType,

        minRank: values.matchType === "RANKED" ? calculatedMinRank : undefined,
        maxRank: values.matchType === "RANKED" ? calculatedMaxRank : undefined,
        note: values.note || "",
      };

      await matchService.createMatch(payload);
      message.success("Tạo trận đấu thành công!");
      form.resetFields();
      navigate("/my-matches");
    } catch (error: unknown) {
      const apiErr = error as ApiErrorResponse;
      const errRes = apiErr.response?.data;
      const errMessage = errRes?.message;

      if (
        apiErr.response?.status === 401 ||
        errMessage?.toLowerCase().includes("unauthenticated")
      ) {
        handleRequireLogin(values);
        return;
      }

      console.error("Lỗi Backend trả về:", errRes);
      message.error(errMessage || "Không thể tạo trận đấu.");
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

  const courtName = court?.courtName || "Sân chưa rõ tên";
  const catName = court?.categoryName || "Sân thể thao";
  const displayDate = currentStartTime
    ? currentStartTime.format("DD/MM/YYYY")
    : selectedDate
    ? selectedDate.format("DD/MM/YYYY")
    : "Chưa chọn giờ";
  const displayStartTime = currentStartTime
    ? currentStartTime.format("HH:mm")
    : selectedTime || "--:--";
  const displayEndTime =
    currentStartTime && currentDuration
      ? currentStartTime.add(currentDuration * 60, "minute").format("HH:mm")
      : "--:--";

  const isSlotSelected = !!currentStartTime && calculatedPrice > 0;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-3 p-3 bg-[#f3e8ff]/50 rounded-lg border border-[#e9d5ff]">
        <p className="text-sm text-purple-900 font-semibold">
          Sân áp dụng cho trận ghép kèo
        </p>
      </div>

      <div className="border border-[#e9d5ff] rounded-xl p-3 bg-[#f3e8ff]/40 mb-6">
        <div className="flex justify-between gap-3">
          <div>
            <p className="font-bold text-gray-800">{courtName}</p>

            <p className="text-sm text-gray-500 mt-1">
              {displayDate} • {displayStartTime} - {displayEndTime}
            </p>

            <p className="text-xs font-medium text-[#9156F1] mt-1">
              Loại sân: {catName}
            </p>

            <p className="text-xs font-medium text-gray-500 mt-1">
              Thời lượng: {currentDuration} giờ
            </p>
          </div>

          <div className="text-right flex-shrink-0 flex items-center">
            {calculatedPrice > 0 ? (
              <p className="font-bold text-lg text-[#9156F1] whitespace-nowrap">
                {calculatedPrice.toLocaleString("vi-VN")} đ
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-400 whitespace-nowrap">
                Chưa tính giá
              </p>
            )}
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateMatch}
        initialValues={{
          duration: selectedDuration || 1,
          matchType: "NORMAL",
          maxPlayers: minAllowed,
          minPlayersToStart: minAllowed / 2,
        }}
      >
        <Form.Item name="startTime" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="duration" hidden>
          <InputNumber />
        </Form.Item>

        <div className="flex flex-wrap md:flex-nowrap gap-3 mb-4">
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
            className="mb-0 flex-grow"
            style={{ minWidth: "110px" }}
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
                    Đội thua sẽ chịu phạt (tiền sân, nước...)
                  </span>
                </div>
              </Select.Option>
              <Select.Option value="RANKED" label="Đánh Rank">
                <div className="flex flex-col py-1">
                  <span className="font-semibold text-[#9156F1]">
                    Đánh Rank
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Thi đấu nghiêm túc, tích lũy điểm hạng
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
                  title={`Số người chơi tối đa (từ ${minAllowed} đến ${maxAllowed} người)`}
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
            style={{ width: "100px", flexShrink: 0 }}
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
            style={{ width: "100px", flexShrink: 0 }}
          >
            <InputNumber
              readOnly
              className="w-full h-11 flex items-center rounded-lg bg-gray-50 text-gray-500 border-gray-200"
            />
          </Form.Item>
        </div>

        {/* Khối hiển thị vùng Elo khi chọn RANKED */}
        {watchMatchType === "RANKED" && user && (
          <div className="mb-4 px-3 py-2.5 bg-purple-50 rounded-lg border border-purple-100 flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-[13px] text-purple-900 font-medium">
              Vùng Elo cho phép:{" "}
              <span className="font-bold text-[#9156F1]">
                {calculatedMinRank} - {calculatedMaxRank}
              </span>
            </span>
            <span className="text-[11px] text-purple-600/80 italic mt-0.5">
              (Dựa trên điểm rank hiện tại của bạn là {currentRank})
            </span>
          </div>
        )}

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
          disabled={!isSlotSelected}
          className={`w-full h-[52px] text-base font-bold rounded-xl mt-1 flex items-center justify-center gap-2 shadow-md transition-colors ${
            !isSlotSelected
              ? ""
              : "!bg-[#9156F1] !border-[#9156F1] !text-white hover:!bg-[#7c3aed] hover:!border-[#7c3aed]"
          }`}
        >
          Tạo trận ghép kèo
        </Button>
      </Form>
    </div>
  );
}
