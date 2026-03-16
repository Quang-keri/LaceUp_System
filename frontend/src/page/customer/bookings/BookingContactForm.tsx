import { Card, Input } from "antd";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
}

export default function BookingContactForm({ formData, setFormData }: Props) {
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <Card title="Thông tin người đặt" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label>Tên người đặt</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Số điện thoại</label>
        <Input
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <div>
        <label>Ghi chú</label>
        <Input.TextArea
          rows={3}
          value={formData.note}
          onChange={(e) => handleChange("note", e.target.value)}
        />
      </div>
    </Card>
  );
}