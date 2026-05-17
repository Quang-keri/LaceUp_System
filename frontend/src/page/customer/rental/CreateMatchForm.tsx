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
import dayjs from "dayjs";
import matchService from "../../../service/match/matchService";
import { useAuth } from "../../../context/AuthContext";
import type { MatchRequest } from "../../../types/match";
import { Coffee, MapPin, Utensils, Activity } from "lucide-react";

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

    const currentCategoryId =
      court?.category?.id || court?.categoryId;

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
      // KHÔI PHỤC LOGIC: Tự động tính toán biên độ rank của bản thân từ đầu
      minRank: Math.max(0, currentRank - 500),
      maxRank: currentRank + 500,
      note: "",
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
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 w-full mt-6">
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

      <Modal
        title={
          <div className="text-lg font-bold text-gray-800">
            Thiết lập kèo ghép khách
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
          {/* Thể thức thi đấu */}
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

          {/* Ô xử lý động theo thể thức thi đấu */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.matchType !== curr.matchType}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("matchType");

              // CHIA KÈO
              if (type === "BET") {
                return (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-4 animate-in fade-in duration-200">
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

              // ĐÁNH RANK: ĐÃ KHÔI PHỤC THUỘC TÍNH readOnly (Khóa cứng không cho sửa)
              if (type === "RANKED") {
                return (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-4 grid grid-cols-2 gap-4 animate-in fade-in duration-200">
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
                        readOnly // Khóa không cho nhập tay
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
                        readOnly // Khóa không cho nhập tay
                        className="w-full font-bold text-purple-700 text-lg bg-gray-100/50 cursor-not-allowed"
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

          {/* Ghi chú thêm (Ẩn đi khi chọn thể thức BET) */}
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
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ví dụ: Trình độ trung bình khá, tự mang nước/bóng..."
                      className="rounded-lg border-gray-300"
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}