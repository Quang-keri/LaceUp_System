import { Card, Input } from "antd";

interface UserInfo {
  userName: string;
  userPhone: string;
  note: string;
}

interface Props {
  formData: UserInfo;
  setFormData?: (data: UserInfo) => void;
  readonly?: boolean;
}

export default function BookingContactForm({
  formData,
  setFormData,
  readonly = false,
}: Props) {
  const handleChange = (field: keyof UserInfo, value: string) => {
    if (readonly || !setFormData) return;
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Card title="Thông tin người đặt" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label>Tên người đặt</label>
        <Input
          value={formData.userName}
          readOnly={readonly}
          variant={readonly ? "filled" : "outlined"}
          onChange={(e) => handleChange("userName", e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Số điện thoại</label>
        <Input
          value={formData.userPhone}
          readOnly={readonly}
          variant={readonly ? "filled" : "outlined"}
          onChange={(e) => handleChange("userPhone", e.target.value)}
        />
      </div>

      <div>
        <label>Ghi chú</label>
        <Input.TextArea
          rows={3}
          value={formData.note}
          readOnly={readonly}
          variant={readonly ? "filled" : "outlined"}
          onChange={(e) => handleChange("note", e.target.value)}
        />
      </div>
    </Card>
  );
}