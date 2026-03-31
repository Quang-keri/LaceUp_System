import { useState } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Radio,
  Input,
  Button,
  message,
} from "antd";
import { PicRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";
import type { MatchRequest } from "../../../types/match";

export default function CreateMatchForm({
  court,
  address,
}: {
  court: any;
  address?: any;
}) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [openMatchModal, setOpenMatchModal] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);

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

  const openMatchForm = () => {
    if (!court) {
      message.error("Chưa có thông tin sân để tạo kèo!");
      return;
    }

    form.resetFields();

    // 1. Lấy tên category từ object sân
    // Lưu ý: Kiểm tra console.log(court) để xem categoryName nằm ở đâu
    const currentCategoryName =
      court?.category?.categoryName || court?.categoryName;

    // 2. Lấy mảng rank từ user
    // Dùng toán tử || để phòng hờ trường hợp Backend trả về 'categoryRank' thay vì 'categoryRanks'
    const ranks = (user as any)?.categoryRank || user?.categoryRanks || [];

    // 3. Tìm rank tương ứng
    const userRankData = ranks.find(
      (item: any) => item.categoryName === currentCategoryName,
    );

    const currentRank = userRankData ? userRankData.rankPoint : 0;

    // 4. Cập nhật vào form
    form.setFieldsValue({
      maxPlayers: 4,
      minPlayersToStart: 2,
      duration: 1,
      matchType: "NORMAL",
      winnerPercent: 50,
      // Set biên độ +- 500
      minRank: Math.max(0, currentRank - 500),
      maxRank: currentRank + 500,
    });

    setOpenMatchModal(true);
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
        district: address?.district || "",
        cityId: Number(address?.city?.cityId || address?.cityId || 1),

        startTime: matchStart.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: matchEnd.format("YYYY-MM-DDTHH:mm:ss"),

        maxPlayers: Number(values.maxPlayers),
        minPlayersToStart: Number(values.minPlayersToStart),
        isRecurring: false,
        matchType: values.matchType,
        winnerPercent:
          values.matchType === "BET" ? Number(values.winnerPercent) : undefined,
        minRank:
          values.matchType === "RANKED" ? Number(values.minRank) : undefined,
        maxRank:
          values.matchType === "RANKED" ? Number(values.maxRank) : undefined,
        note: values.note || "",
      };

      await matchService.createMatch(payload);
      message.success("Tạo trận đấu thành công!");
      setOpenMatchModal(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Lỗi Backend trả về:", error.response?.data);
      message.error(error.response?.data?.message || "Không thể tạo trận đấu.");
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <>
      {/* THÈ TẠO TRẬN RIÊNG, NẰM DƯỚI CARD BOOKING VÀ CÓ KHOẢNG CÁCH */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 w-full mt-6">
        {/* mt-6 tạo khoảng cách */}
        <p className="text-sm font-medium text-gray-500 mb-3 text-center">
          Không đủ người chơi? Tìm thêm đồng đội!
        </p>
        <Button
          type="primary"
          onClick={openMatchForm}
          className="w-full h-[52px] text-base font-bold rounded-xl
             !bg-orange-500 !border-orange-500
             hover:!bg-orange-600 hover:!border-orange-600
             flex items-center justify-center gap-2 shadow-md"
        >
          Tạo trận ghép kèo
        </Button>
      </div>

      {/* Modal Form Tạo Kèo */}
      <Modal
        title={
          <div className="text-lg font-bold text-gray-800">
            🏸 Thiết lập kèo ghép khách
          </div>
        }
        open={openMatchModal}
        onCancel={() => setOpenMatchModal(false)}
        onOk={() => form.submit()}
        confirmLoading={loadingMatch}
        okText="Xác nhận tạo kèo"
        cancelText="Hủy"
        width={500}
        centered
      >
        <div className="mb-6 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-2">
          <p className="text-sm text-blue-900">
            Sân áp dụng: <strong>{court?.courtName}</strong>
          </p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateMatch}>
          {/* Lựa chọn Thể thức */}
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">
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
                          <PicRightOutlined style={{ fontSize: "16px" }} />
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
                      className="mb-0"
                    >
                      <InputNumber
                        min={0}
                        step={100}
                        className="w-full font-bold text-purple-700 text-lg"
                        readOnly
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
                            if (!value || getFieldValue("minRank") <= value)
                              return Promise.resolve();
                            return Promise.reject(new Error("Phải ≥ Min!"));
                          },
                        }),
                      ]}
                    >
                      <InputNumber
                        step={100}
                        className="w-full font-bold text-purple-700 text-lg"
                        readOnly
                      />
                    </Form.Item>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>

          <hr className="my-5 border-gray-100" />

          {/* Thời gian */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700">Giờ bắt đầu</span>
              }
              name="startTime"
              rules={[
                { required: true, message: "Vui lòng chọn giờ bắt đầu!" },
              ]}
            >
              <DatePicker
                showTime={{ format: "HH:mm", hideDisabledOptions: true }}
                format="HH:mm - DD/MM"
                className="w-full"
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
            >
              <Select className="w-full">
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
                <span className="font-semibold text-gray-700">
                  Số người tối đa
                </span>
              }
              name="maxPlayers"
              rules={[{ required: true, message: "Nhập số người tối đa!" }]}
            >
              <InputNumber
                min={2}
                className="w-full"
                onChange={(val) => {
                  if (val)
                    form.setFieldValue("minPlayersToStart", Math.ceil(val / 2));
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
              tooltip="Trận đấu sẽ bị hủy nếu không đủ số người này"
              rules={[
                { required: true, message: "Nhập số người tối thiểu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("maxPlayers") >= value)
                      return Promise.resolve();
                    return Promise.reject(new Error("Tối thiểu ≤ Tối đa!"));
                  },
                }),
              ]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          {/* Ghi chú */}
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">Ghi chú thêm</span>
            }
            name="note"
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Trình độ trung bình khá, tự mang nước/bóng..."
              className="rounded-lg border-gray-300"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
