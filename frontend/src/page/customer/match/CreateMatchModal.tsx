import { useEffect, useState } from "react";
import matchService from "../../../service/match/matchService.ts";
import {
  DatePicker,
  InputNumber,
  Form,
  Select,
  Radio,
  Input,
  message,
} from "antd";
import dayjs from "dayjs";
import { useAuth } from "../../../context/AuthContext.tsx";
import { LOCATION_DATA } from "../../../constants/locationData.ts";
import {
  Trophy,
  Flame,
  MapPin,
  Map,
  Clock,
  Users,
  Target,
  Activity,
} from "lucide-react";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Cấu hình số người mặc định cho từng môn thể thao
const SPORT_DEFAULTS: Record<string, { max: number; min: number }> = {
  "1": { max: 4, min: 2 }, // Cầu lông
  "2": { max: 10, min: 10 }, // Bóng đá
  "3": { max: 4, min: 2 }, // Pickleball
};

const CreateMatchModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateMatchModalProps) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [availableDistricts, setAvailableDistricts] = useState<any[]>([]);
  const [availableWards, setAvailableWards] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const currentRank = user?.rankPoint || 0;
      const defaultCity = LOCATION_DATA.find((c) => c.id === 1);

      setAvailableDistricts(defaultCity?.districts || []);
      setAvailableWards([]);

      form.setFieldsValue({
        categoryId: "1",
        cityId: 1,
        district: undefined,
        ward: undefined,
        street: "",
        startTime: null,
        duration: 1,
        maxPlayers: SPORT_DEFAULTS["1"].max,
        minPlayersToStart: SPORT_DEFAULTS["1"].min,
        matchType: "NORMAL",
        winnerPercent: 50,
        minRank: Math.max(0, currentRank - 1000),
        maxRank: currentRank + 1000,
        note: "",
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, user, form]);

  const handleCityChange = (cityId: number) => {
    const selectedCity = LOCATION_DATA.find((c) => c.id === cityId);
    setAvailableDistricts(selectedCity?.districts || []);
    setAvailableWards([]);
    form.setFieldsValue({ district: undefined, ward: undefined });
  };

  const handleDistrictChange = (districtName: string) => {
    const selectedDistrict = availableDistricts.find(
      (d) => d.name === districtName,
    );
    setAvailableWards(selectedDistrict?.wards || []);
    form.setFieldsValue({ ward: undefined });
  };

  // Hàm bắt sự kiện khi thay đổi Môn Thể Thao
  const handleCategoryChange = (e: any) => {
    const catId = e.target.value;
    const defaults = SPORT_DEFAULTS[catId];
    if (defaults) {
      form.setFieldsValue({
        maxPlayers: defaults.max,
        minPlayersToStart: defaults.min,
      });
    }
  };

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
      return message.warning("Điểm tối thiểu không được lớn hơn điểm tối đa!");
    }

    setLoading(true);
    try {
      const startObj = dayjs(values.startTime);
      const endObj = startObj.add(values.duration, "hour");

      const payload = {
        categoryId: Number(values.categoryId),
        cityId: Number(values.cityId),
        district: values.district,
        ward: values.ward || "Chưa xác định",
        street: values.street,
        startTime: startObj.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: endObj.format("YYYY-MM-DDTHH:mm:ss"),
        maxPlayers: Number(values.maxPlayers),
        minPlayersToStart: Number(values.minPlayersToStart),
        isRecurring: false,
        recurring: false,
        matchType: values.matchType,
        winnerPercent:
          values.matchType === "BET" ? Number(values.winnerPercent) : undefined,
        minRank:
          values.matchType === "RANKED" ? Number(values.minRank) : undefined,
        maxRank:
          values.matchType === "RANKED" ? Number(values.maxRank) : undefined,
        note: values.note || "",
        courtId: null,
      };

      const response = await matchService.createMatch(payload as any);

      if (
        response.code === 200 ||
        response.code === 1000 ||
        response.code === 0
      ) {
        message.success("Đăng tin tìm đồng đội thành công!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.message;

      if (errorCode === 1001 || errorMsg === "Unauthenticated") {
        message.error("Bạn cần đăng nhập trước khi tạo kèo!");
      } else {
        message.error(errorMsg || "Lỗi tạo trận");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar relative border-t-[5px] border-purple-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-slate-400 hover:text-orange-500 hover:rotate-90 transition-all duration-300 p-1"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h2 className="text-2xl font-black text-purple-900 flex items-center gap-2 uppercase tracking-tight">
            <Trophy className="text-orange-500" size={24} />
            Lên Kèo Giao Lưu
          </h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="create-match-form"
          initialValues={{
            categoryId: "1",
            maxPlayers: SPORT_DEFAULTS["1"].max,
            minPlayersToStart: SPORT_DEFAULTS["1"].min,
            duration: 1,
            matchType: "NORMAL",
          }}
        >
          <div className="space-y-4">
            {/* Khối 1: Môn thể thao */}
            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <Form.Item
                label={
                  <span className="font-bold text-purple-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Activity size={14} /> Môn thể thao
                  </span>
                }
                name="categoryId"
                className="mb-0"
              >
                <Radio.Group
                  className="flex w-full gap-2 custom-radio-group"
                  onChange={handleCategoryChange}
                >
                  <Radio.Button
                    value="1"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    🏸 Cầu lông
                  </Radio.Button>
                  <Radio.Button
                    value="2"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    ⚽ Bóng đá
                  </Radio.Button>
                  <Radio.Button
                    value="3"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    🏓 Pickleball
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* Khối 2: Địa điểm */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="text-orange-500" size={16} />
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Địa điểm thi đấu
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Form.Item
                  label={
                    <span className="font-bold text-slate-500 text-[10px]">
                      Tỉnh / Thành phố
                    </span>
                  }
                  name="cityId"
                  rules={[{ required: true, message: "Chọn Thành phố!" }]}
                  className="mb-0"
                >
                  <Select onChange={handleCityChange} placeholder="Chọn TP">
                    {LOCATION_DATA.map((city) => (
                      <Select.Option key={city.id} value={city.id}>
                        {city.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-bold text-slate-500 text-[10px]">
                      Quận / Huyện
                    </span>
                  }
                  name="district"
                  rules={[{ required: true, message: "Chọn Quận/Huyện!" }]}
                  className="mb-0"
                >
                  <Select
                    onChange={handleDistrictChange}
                    placeholder="Chọn Quận"
                    disabled={!availableDistricts.length}
                  >
                    {availableDistricts.map((dist) => (
                      <Select.Option key={dist.name} value={dist.name}>
                        {dist.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-bold text-slate-500 text-[10px]">
                      Phường / Xã
                    </span>
                  }
                  name="ward"
                  rules={[{ required: true, message: "Chọn Phường/Xã!" }]}
                  className="mb-0"
                >
                  <Select
                    placeholder="Chọn Phường"
                    disabled={!availableWards.length}
                  >
                    {availableWards.map((ward) => (
                      <Select.Option key={ward} value={ward}>
                        {ward}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-bold text-slate-500 text-[10px]">
                      Đường / Tên Sân *
                    </span>
                  }
                  name="street"
                  className="mb-0"
                >
                  <Input
                    prefix={<Map size={14} className="text-slate-400 mr-1" />}
                    placeholder="Ví dụ: 123 Lê Lợi..."
                    className="rounded-lg border-gray-300"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Khối 3: Thể thức thi đấu */}
            <div>
              <Form.Item
                label={
                  <span className="font-black text-purple-900 uppercase text-xs tracking-wider flex items-center gap-1.5 mb-1">
                    <Target className="text-orange-500" size={16} /> Thể thức
                    thi đấu
                  </span>
                }
                name="matchType"
                className="mb-3"
              >
                <Radio.Group className="flex w-full gap-2 custom-radio-group">
                  <Radio.Button
                    value="NORMAL"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    😊 Giao lưu
                  </Radio.Button>
                  <Radio.Button
                    value="BET"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    💰 Chia Kèo
                  </Radio.Button>
                  <Radio.Button
                    value="RANKED"
                    className="flex-1 text-center rounded-lg! font-bold border-slate-200"
                  >
                    🏆 Đánh Rank
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {/* Box động theo thể thức */}
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
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-4 relative overflow-hidden animate-in slide-in-from-top-2">
                        <Flame className="absolute -right-4 -bottom-4 text-orange-100 w-20 h-20 rotate-12" />
                        <Form.Item
                          label={
                            <span className="text-orange-800 font-bold uppercase tracking-wider text-[10px]">
                              Cài đặt tỉ lệ bao sân
                            </span>
                          }
                          className="mb-0 relative z-10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg border border-orange-200 shadow-sm flex flex-col items-center justify-center w-24">
                              <span className="text-[9px] text-orange-500 font-bold uppercase mb-0.5">
                                Phe Thắng trả
                              </span>
                              <Form.Item name="winnerPercent" noStyle>
                                <InputNumber
                                  min={0}
                                  max={50}
                                  step={10}
                                  formatter={(value) => `${value}%`}
                                  parser={(value) =>
                                    Number(value?.replace("%", "")) as 0 | 50
                                  }
                                  className="w-full text-center font-black text-orange-600 text-base custom-input-number border-none shadow-none"
                                />
                              </Form.Item>
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 py-2.5 px-3 rounded-lg text-white flex items-center justify-between shadow-md">
                              <span className="font-semibold text-orange-50 uppercase text-[10px]">
                                Phe Thua Bao
                              </span>
                              <span className="font-black text-xl">
                                {loserPercent}%
                              </span>
                            </div>
                          </div>
                        </Form.Item>
                      </div>
                    );
                  }

                  if (type === "RANKED") {
                    return (
                      <div className="bg-purple-100/50 p-4 rounded-xl border border-purple-200 mb-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Trophy className="text-purple-600" size={14} />
                          <span className="text-purple-800 font-bold uppercase tracking-wider text-[10px]">
                            Khoảng Rank yêu cầu
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Form.Item
                            name="minRank"
                            rules={[{ required: true, message: "Nhập Min!" }]}
                            className="mb-0"
                          >
                            <InputNumber
                              min={0}
                              step={100}
                              placeholder="Tối thiểu"
                              className="w-full font-bold text-purple-700 rounded-lg"
                            />
                          </Form.Item>
                          <Form.Item
                            name="maxRank"
                            className="mb-0"
                            rules={[
                              { required: true, message: "Nhập Max!" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (
                                    !value ||
                                    getFieldValue("minRank") <= value
                                  )
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error("Max ≥ Min!"),
                                  );
                                },
                              }),
                            ]}
                          >
                            <InputNumber
                              step={100}
                              placeholder="Tối đa"
                              className="w-full font-bold text-purple-700 rounded-lg"
                            />
                          </Form.Item>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </div>

            {/* Khối 4: Thời gian & Số lượng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột Thời gian */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="text-purple-600" size={14} />
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Thời Gian
                  </span>
                </div>

                <Form.Item
                  name="startTime"
                  rules={[{ required: true, message: "Chọn giờ bắt đầu!" }]}
                  className="mb-0"
                >
                  <DatePicker
                    showTime={{ format: "HH:mm", hideDisabledOptions: true }}
                    format="HH:mm - DD/MM"
                    className="w-full rounded-lg"
                    placeholder="Chọn giờ"
                    showNow={false}
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                    disabledTime={disabledDateTime}
                  />
                </Form.Item>

                <Form.Item
                  name="duration"
                  rules={[{ required: true }]}
                  className="mb-0"
                >
                  <Select className="w-full">
                    <Select.Option value={0.5}>⏱️ 30 phút</Select.Option>
                    <Select.Option value={1}>⏱️ 1 giờ</Select.Option>
                    <Select.Option value={1.5}>⏱️ 1.5 giờ</Select.Option>
                    <Select.Option value={2}>⏱️ 2 giờ</Select.Option>
                    <Select.Option value={2.5}>⏱️ 2.5 giờ</Select.Option>
                    <Select.Option value={3}>⏱️ 3 giờ</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              {/* Cột Nhân sự */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="text-orange-500" size={14} />
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Số lượng người
                  </span>
                </div>

                {/* ĐÃ FIX BINDING CỦA ANT DESIGN: Đưa label ra ngoài Form.Item */}
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      TỐI ĐA (MAX)
                    </div>
                    <Form.Item
                      name="maxPlayers"
                      rules={[{ required: true, message: "Nhập Max!" }]}
                      className="mb-0"
                    >
                      <InputNumber
                        min={2}
                        className="w-full rounded-lg font-bold"
                        onChange={(val) => {
                          if (val)
                            form.setFieldsValue({
                              minPlayersToStart: Math.ceil(val / 2),
                            });
                        }}
                      />
                    </Form.Item>
                  </div>

                  <div className="w-1/2">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      CHỐT KÈO LÚC
                    </div>
                    <Form.Item
                      name="minPlayersToStart"
                      className="mb-0"
                      rules={[
                        { required: true, message: "Nhập Min!" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("maxPlayers") >= value)
                              return Promise.resolve();
                            return Promise.reject(new Error("Min ≤ Max!"));
                          },
                        }),
                      ]}
                    >
                      <InputNumber
                        min={1}
                        className="w-full rounded-lg font-bold"
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <Form.Item
              label={
                <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  Ghi chú thêm (Không bắt buộc)
                </span>
              }
              name="note"
              className="mb-0"
            >
              <Input.TextArea
                rows={2}
                placeholder="Trình độ trung bình khá..."
                className="rounded-lg border-gray-300 p-2 text-sm"
              />
            </Form.Item>

            {/* Nút Submit */}
            <div className="pt-3 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 font-bold text-slate-400 hover:text-slate-700 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-wider shadow-md shadow-purple-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center gap-2 text-sm"
              >
                {loading ? "Đang xử lý..." : "Đăng Kèo Ngay"}
              </button>
            </div>
          </div>
        </Form>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-radio-group .ant-radio-button-wrapper {
          border-radius: 8px !important;
          border-inline-start-width: 1px !important;
          height: 38px;
          line-height: 36px;
          color: #64748b;
          background: #f8fafc;
          font-size: 13px;
        }
        .custom-radio-group .ant-radio-button-wrapper::before {
          display: none !important;
        }
        .custom-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
          z-index: 1;
          color: #fff;
          background: #ea580c;
          border-color: #ea580c;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
        }
        .custom-input-number .ant-input-number-input {
          text-align: center;
        }
        `,
        }}
      />
    </div>
  );
};

export default CreateMatchModal;
