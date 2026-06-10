import React, { useState } from "react";
import { Modal, Form, Select, Radio, Button, message } from "antd";
import { Zap, Activity, MapPin } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";
import { LOCATION_DATA } from "../../../constants/locationData.ts";

interface AutoMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AutoMatchModal: React.FC<AutoMatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<any[]>([]);

  const handleCityChange = (cityName: string) => {
    const selectedCity = LOCATION_DATA.find((c) => c.name === cityName);
    setAvailableDistricts(selectedCity?.districts || []);
    form.setFieldsValue({ district: undefined });
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        categoryId: values.categoryId,
        matchType: values.matchType,
        city: values.city,
        district: values.district,
      };

      const response = await matchService.autoMatch(payload);
      if (response.code === 200) {
        message.success("Đã tìm thấy và tham gia trận đấu phù hợp!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
          "Không tìm thấy trận nào phù hợp lúc này. Hãy thử tự tạo phòng nhé!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-black text-amber-600 flex items-center gap-2 uppercase">
          <Zap size={24} className="fill-amber-500" /> Ghép Trận Siêu Tốc
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ matchType: "NORMAL" }}
        className="mt-4"
      >
        <Form.Item
          label={
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Activity size={16} /> Môn thể thao
            </span>
          }
          name="categoryId"
          rules={[{ required: true, message: "Vui lòng chọn môn!" }]}
        >
          <Select placeholder="Chọn môn bạn muốn chơi" size="large">
            <Select.Option value="1">Cầu lông</Select.Option>
            <Select.Option value="2">Bóng đá</Select.Option>
            <Select.Option value="3">Pickleball</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Zap size={16} /> Thể thức
            </span>
          }
          name="matchType"
        >
          <Radio.Group className="flex w-full gap-2">
            <Radio.Button
              value="NORMAL"
              className="flex-1 text-center rounded-lg font-bold"
            >
              Giao lưu
            </Radio.Button>
            <Radio.Button
              value="BET"
              className="flex-1 text-center rounded-lg font-bold"
            >
              Đánh đánh
            </Radio.Button>
            <Radio.Button
              value="RANKED"
              className="flex-1 text-center rounded-lg font-bold"
            >
              Leo Rank
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <Form.Item
            label={
              <span className="text-xs font-bold text-slate-500">
                <MapPin size={12} className="inline" /> Thành phố
              </span>
            }
            name="city"
            className="mb-0"
          >
            <Select onChange={handleCityChange} placeholder="Tất cả">
              {LOCATION_DATA.map((city) => (
                <Select.Option key={city.id} value={city.name}>
                  {city.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={
              <span className="text-xs font-bold text-slate-500">
                Quận / Huyện
              </span>
            }
            name="district"
            className="mb-0"
          >
            <Select placeholder="Tất cả" disabled={!availableDistricts.length}>
              {availableDistricts.map((dist) => (
                <Select.Option key={dist.name} value={dist.name}>
                  {dist.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold text-lg border-0 shadow-lg"
        >
          TÌM TRẬN NGAY
        </Button>
      </Form>
    </Modal>
  );
};

export default AutoMatchModal;
