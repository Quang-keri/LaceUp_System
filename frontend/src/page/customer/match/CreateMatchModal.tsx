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
import {
  Trophy,
  Flame,
  MapPin,
  Map,
  Clock,
  Users,
  Target,
  Activity,
  Coffee,
  Utensils,
} from "lucide-react";
import { locationService } from "../../../service/locationService.ts";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Cập nhật cấu hình: Cầu lông (4), Bóng đá (Sân 5 hoặc sân 7 -> max là 14), Pickleball (4)
const SPORT_DEFAULTS: Record<string, { max: number; min: number; limitMax: number }> = {
  "1": { max: 4, min: 2, limitMax: 4 },
  "2": { max: 10, min: 5, limitMax: 14 }, // Bóng đá mặc định 10 người (5vs5), tối đa 14 người (7vs7)
  "3": { max: 4, min: 2, limitMax: 4 },
};

const CreateMatchModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateMatchModalProps) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  const getUserRank = (catId: string) => {
    const ranks = user?.categoryRanks || [];
    const rankData = ranks.find((r: any) => {
      if (r.categoryId?.toString() === catId) return true;
      if (catId === "1" && r.categoryName?.toLowerCase().includes("cầu lông")) return true;
      if (catId === "2" && r.categoryName?.toLowerCase().includes("bóng đá")) return true;
      if (catId === "3" && r.categoryName?.toLowerCase().includes("pickleball")) return true;
      return false;
    });
    return rankData?.rankPoint || 0;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const provincesData = await locationService.getProvinces();
        setCities(provincesData);
      } catch (error) {
        console.error("Không thể tải danh sách tỉnh/thành phố", error);
      }
    };

    if (isOpen) {
      fetchInitialData();
      setWards([]);

      const defaultRank = getUserRank("1");

      form.setFieldsValue({
        categoryId: "1",
        cityId: undefined,
        ward: undefined,
        street: "",
        startTime: null,
        duration: 1,
        maxPlayers: SPORT_DEFAULTS["1"].max,
        minPlayersToStart: SPORT_DEFAULTS["1"].min,
        matchType: "NORMAL",
        minRank: Math.max(0, defaultRank - 1000),
        maxRank: defaultRank + 1000,
        note: "",
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, user, form]);

  const handleCityChange = async (cityCode: number) => {
    setWards([]);
    form.setFieldsValue({ ward: undefined });

    if (!cityCode) return;

    setLoadingWards(true);
    try {
      const res = await locationService.getWardsByProvince(cityCode);
      setWards(res || []);
    } catch (error) {
      console.error("Lỗi lấy xã/phường:", error);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleCategoryChange = (e: any) => {
    const catId = e.target.value;
    const defaults = SPORT_DEFAULTS[catId];
    const currentRank = getUserRank(catId);

    if (defaults) {
      form.setFieldsValue({
        maxPlayers: defaults.max,
        minPlayersToStart: defaults.min,
        minRank: Math.max(0, currentRank - 1000),
        maxRank: currentRank + 1000,
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

    const selectedCity = cities.find((c) => c.code === values.cityId);
    const selectedWard = wards.find((w) => w.code === values.ward);

    setLoading(true);
    try {
      const startObj = dayjs(values.startTime);
      const endObj = startObj.add(values.duration, "hour");

      const payload = {
        categoryId: Number(values.categoryId),
        cityId: Number(values.cityId),
        ward: selectedWard ? selectedWard.name : values.ward || "Chưa xác định",
        street: values.street,
        startTime: startObj.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: endObj.format("YYYY-MM-DDTHH:mm:ss"),
        maxPlayers: Number(values.maxPlayers),
        minPlayersToStart: Number(values.minPlayersToStart),
        isRecurring: false,
        matchType: values.matchType,
        minRank:
          values.matchType === "RANKED" ? Number(values.minRank) : undefined,
        maxRank:
          values.matchType === "RANKED" ? Number(values.maxRank) : undefined,
        note: values.note || "",
        courtId: null,
      };

      const response = await matchService.createMatch(payload as any);

      if (response.code === 200) {
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
        className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden custom-scrollbar relative border-t-[5px] border-purple-700"
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

        <div className="mb-6">
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
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ================= CỘT BÊN TRÁI ================= */}
            <div className="flex flex-col space-y-5">
              {/* 1. Môn thể thao */}
              <div className="bg-purple-50/50 px-4 py-3 rounded-xl border border-purple-100">
                <Form.Item
                  label={
                    <span className="font-bold text-purple-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <Activity size={14} /> Môn thể thao
                    </span>
                  }
                  name="categoryId"
                  className="!mb-0"
                  style={{ marginBottom: 0 }}
                >
                  <Radio.Group
                    className="custom-radio-group"
                    onChange={handleCategoryChange}
                  >
                    <Radio.Button value="1" className="font-bold">
                      Cầu lông
                    </Radio.Button>
                    <Radio.Button value="2" className="font-bold">
                      Bóng đá
                    </Radio.Button>
                    <Radio.Button value="3" className="font-bold">
                      Pickleball
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </div>

              {/* 2. Thể thức thi đấu */}
              <div className="bg-purple-50/50 px-4 py-3 rounded-xl border border-purple-100">
                <Form.Item
                  label={
                    <span className="font-black text-purple-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 mb-1">
                      <Target className="text-orange-500" size={16} /> Thể thức
                      thi đấu
                    </span>
                  }
                  name="matchType"
                  className="!mb-0"
                  style={{ marginBottom: 0 }}
                >
                  <Radio.Group className="custom-radio-group">
                    <Radio.Button value="NORMAL" className="font-bold">
                      Giao lưu
                    </Radio.Button>
                    <Radio.Button value="BET" className="font-bold">
                      Chia Kèo
                    </Radio.Button>
                    <Radio.Button value="RANKED" className="font-bold">
                      Đánh Rank
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                {/* Box động cho Thể thức */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.matchType !== curr.matchType || prev.categoryId !== curr.categoryId
                  }
                >
                  {({ getFieldValue }) => {
                    const type = getFieldValue("matchType");

                    if (type === "BET") {
                      return (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 relative overflow-hidden animate-in slide-in-from-top-2 mt-4">
                          <Flame className="absolute -right-4 -bottom-4 text-orange-100 w-20 h-20 rotate-12" />
                          <Form.Item
                            label={
                              <span className="text-orange-800 font-bold uppercase tracking-wider text-[10px]">
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
                            className="!mb-0 relative z-10"
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Chọn phần thưởng..."
                              className="w-full font-bold"
                              size="large"
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
                        <div className="bg-purple-100/50 p-4 rounded-xl border border-purple-200 animate-in slide-in-from-top-2 mt-4">
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
                              className="!mb-0"
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                step={100}
                                placeholder="Tối thiểu"
                                className="w-full font-bold text-purple-700 rounded-lg custom-input-number"
                              />
                            </Form.Item>
                            <Form.Item
                              name="maxRank"
                              className="!mb-0"
                              style={{ marginBottom: 0 }}
                              rules={[
                                { required: true, message: "Nhập Max!" },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value || getFieldValue("minRank") <= value)
                                      return Promise.resolve();
                                    return Promise.reject(new Error("Max ≥ Min!"));
                                  },
                                }),
                              ]}
                            >
                              <InputNumber
                                step={100}
                                placeholder="Tối đa"
                                className="w-full font-bold text-purple-700 rounded-lg custom-input-number"
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

              {/* 3. Số lượng người */}
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="text-orange-500" size={14} />
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Số lượng người
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">
                      TỐI ĐA (MAX)
                    </span>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) => prev.categoryId !== curr.categoryId}
                    >
                      {({ getFieldValue }) => {
                        const catId = getFieldValue("categoryId");
                        const currentSport = SPORT_DEFAULTS[catId] || SPORT_DEFAULTS["1"];
                        
                        return (
                          <Form.Item
                            name="maxPlayers"
                            rules={[{ required: true, message: "Nhập Max!" }]}
                            className="!mb-0"
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={2}
                              max={currentSport.limitMax} // Giới hạn max theo môn (bóng đá max 14)
                              step={2}                    // Bước nhảy là 2 để ép người dùng luôn nhập số chẵn
                              className="w-16 rounded-lg font-bold custom-input-number"
                              onChange={(val) => {
                                if (val) {
                                  // SỬA TẠI ĐÂY: Lấy max chia đôi làm tối thiểu (min = max / 2)
                                  form.setFieldsValue({
                                    minPlayersToStart: Math.floor(val / 2),
                                  });
                                }
                              }}
                            />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">
                      TỐI THIỂU (MIN)
                    </span>
                    <Form.Item
                      name="minPlayersToStart"
                      className="!mb-0"
                      style={{ marginBottom: 0 }}
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
                        className="w-16 rounded-lg font-bold custom-input-number"
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>

              {/* 4. Ghi chú thêm */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.matchType !== curr.matchType}
              >
                {({ getFieldValue }) => {
                  if (getFieldValue("matchType") !== "BET") {
                    return (
                      <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                        <Form.Item
                          label={
                            <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                              Ghi chú thêm (Không bắt buộc)
                            </span>
                          }
                          name="note"
                          className="!mb-0"
                          style={{ marginBottom: 0 }}
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Trình độ trung bình khá..."
                            className="rounded-lg border-gray-300 p-2 text-sm"
                          />
                        </Form.Item>
                      </div>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </div>

            {/* ================= CỘT BÊN PHẢI ================= */}
            <div className="flex flex-col space-y-5">
              {/* 1. Khối Địa điểm */}
              <div className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 mb-4">
                  <MapPin className="text-orange-500" size={18} />
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[12px]">
                    Địa điểm thi đấu
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <Form.Item
                    label={
                      <span className="font-bold text-slate-500 text-[11px]">
                        Tỉnh / Thành phố
                      </span>
                    }
                    name="cityId"
                    rules={[{ required: true, message: "Chọn Thành phố!" }]}
                    className="!mb-0"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      onChange={handleCityChange}
                      placeholder="Chọn TP"
                      showSearch
                      optionFilterProp="children"
                      size="large"
                    >
                      {cities.map((city) => (
                        <Select.Option key={city.code} value={city.code}>
                          {city.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="font-bold text-slate-500 text-[11px]">
                        Phường / Xã
                      </span>
                    }
                    name="ward"
                    rules={[{ required: true, message: "Chọn Phường/Xã!" }]}
                    className="!mb-0"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Chọn Phường"
                      disabled={!wards.length || loadingWards}
                      loading={loadingWards}
                      showSearch
                      optionFilterProp="children"
                      size="large"
                    >
                      {wards.map((ward) => (
                        <Select.Option key={ward.code} value={ward.code}>
                          {ward.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="font-bold text-slate-500 text-[11px]">
                        Đường / Tên Sân *
                      </span>
                    }
                    name="street"
                    className="!mb-0"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      prefix={<Map size={16} className="text-slate-400 mr-2" />}
                      placeholder="Ví dụ: 123 Lê Lợi..."
                      className="rounded-lg border-gray-300"
                      size="large"
                    />
                  </Form.Item>
                </div>
              </div>

              {/* 2. Khung Thời gian */}
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="text-orange-500" size={14} />
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Thời Gian
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      GIỜ BẮT ĐẦU
                    </div>
                    <Form.Item
                      name="startTime"
                      rules={[{ required: true, message: "Chọn giờ bắt đầu!" }]}
                      className="!mb-0"
                      style={{ marginBottom: 0 }}
                    >
                      <DatePicker
                        showTime={{
                          format: "HH:mm",
                          hideDisabledOptions: true,
                        }}
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
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      THỜI GIAN CHƠI
                    </div>
                    <Form.Item
                      name="duration"
                      rules={[{ required: true }]}
                      className="!mb-0"
                      style={{ marginBottom: 0 }}
                    >
                      <Select className="w-full">
                        <Select.Option value={0.5}>30 phút</Select.Option>
                        <Select.Option value={1}>1 giờ</Select.Option>
                        <Select.Option value={1.5}>1.5 giờ</Select.Option>
                        <Select.Option value={2}>2 giờ</Select.Option>
                        <Select.Option value={2.5}>2.5 giờ</Select.Option>
                        <Select.Option value={3}>3 giờ</Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BUTTON ACTION ================= */}
          <div className="mt-4 border-t border-slate-100 pt-4 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-bold uppercase tracking-wider shadow-sm shadow-purple-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center gap-1.5 text-xs"
            >
              {loading ? "Đang xử lý..." : "Đăng Kèo Ngay"}
            </button>
          </div>
        </Form>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-radio-group {
          display: flex !important;
          width: 100%;
          gap: 12px;
        }
        .custom-radio-group .ant-radio-button-wrapper {
          flex: 1 !important; 
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important; 
          height: 40px;
          line-height: 38px;
          color: #64748b;
          background: #f8fafc;
          font-size: 13px;
          text-align: center;
          padding: 0 !important;
        }
        .custom-radio-group .ant-radio-button-wrapper::before {
          display: none !important;
        }
        .custom-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
          z-index: 1;
          color: #fff;
          background: #ea580c;
          border-color: #ea580c !important;
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