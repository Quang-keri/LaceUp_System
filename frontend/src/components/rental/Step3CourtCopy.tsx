import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Divider,
  Select,
  TimePicker,
  InputNumber,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useRentalForm } from "../../context/RentalFormContext";

const PRICE_TYPES = [
  { label: "Thường", value: "NORMAL" },
  { label: "Cuối tuần", value: "WEEKEND" },
  { label: "Giờ cao điểm", value: "PEAK" },
  { label: "Ngày lễ", value: "HOLIDAY" },
  { label: "Sự kiện", value: "EVENT" },
];

export default function Step3CourtCopy({ next, prev }: any) {
  const { formData, updateFormData } = useRentalForm();
  const [form] = Form.useForm();

  // Đồng bộ dữ liệu khi render hoặc quay lại từ step 4
  useEffect(() => {
    form.setFieldsValue({ courts: formData.courts });
  }, [formData.courts, form]);

  const processAndSaveData = (values: any) => {
    const formattedCourts = (values.courts || []).map(
      (court: any, index: number) => {
        const existing = formData.courts?.[index] || {};
        return {
          ...existing,
          ...court,
          // Format lại thời gian từ Dayjs sang string HH:mm để lưu Context
          prices: (court.prices || []).map((p: any) => ({
            ...p,
            startTime: p.timeRange?.[0]?.format?.("HH:mm") || p.startTime,
            endTime: p.timeRange?.[1]?.format?.("HH:mm") || p.endTime,
          })),
        };
      },
    );
    updateFormData("courts", formattedCourts);
  };

  const handleFinish = (values: any) => {
    processAndSaveData(values);
    next();
  };

  const handlePrev = () => {
    const values = form.getFieldsValue();
    processAndSaveData(values);
    prev();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.List name="courts">
        {(fields) => (
          <>
            {fields.map((field, index) => (
              <Card
                key={field.key}
                title={`Cấu hình: ${
                  formData.courts?.[index]?.courtName || "Sân"
                }`}
                style={{ marginBottom: 20 }}
              >
                <Divider>Danh sách sân cụ thể</Divider>
                <Form.List
                  name={[field.name, "courtCopies"]}
                  rules={[
                    {
                      validator: async (_, copies) => {
                        if (!copies || copies.length < 1) {
                          return Promise.reject(
                            new Error("Phải có ít nhất 1 sân"),
                          );
                        }
                      },
                    },
                  ]}
                >
                  {(copyFields, { add, remove }, { errors }) => (
                    <>
                      {copyFields.map((copyField) => (
                        <Space
                          key={copyField.key}
                          style={{ display: "flex", marginBottom: 8 }}
                        >
                          <Form.Item
                            {...copyField}
                            name={[copyField.name, "courtCode"]}
                            label="Mã sân"
                            rules={[{ required: true, message: "Thêm mã sân" }]}
                          >
                            <Input placeholder="VD: Sân 1" />
                          </Form.Item>
                          <Form.Item
                            {...copyField}
                            name={[copyField.name, "location"]}
                            label="Vị trí"
                          >
                            <Input placeholder="Tầng/Dãy" />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => remove(copyField.name)}
                            style={{ color: "red" }}
                          />
                        </Space>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                      >
                        Thêm sân cụ thể
                      </Button>
                      <Form.ErrorList
                        errors={errors}
                        className="text-red-500 font-medium"
                      />
                    </>
                  )}
                </Form.List>

                <Divider>Cấu hình giá</Divider>
                <Form.List
                  name={[field.name, "prices"]}
                  rules={[
                    {
                      validator: async (_, prices) => {
                        if (!prices || prices.length < 1) {
                          return Promise.reject(
                            new Error("Phải có ít nhất 1 khung giá"),
                          );
                        }
                      },
                    },
                  ]}
                >
                  {(priceFields, { add, remove }, { errors }) => (
                    <>
                      {priceFields.map((p) => (
                        <Space
                          key={p.key}
                          wrap
                          style={{ display: "flex", marginBottom: 8 }}
                        >
                          <Form.Item
                            {...p}
                            name={[p.name, "priceType"]}
                            label="Loại"
                            rules={[{ required: true }]}
                          >
                            <Select
                              style={{ width: 140 }}
                              options={PRICE_TYPES}
                            />
                          </Form.Item>
                          <Form.Item
                            {...p}
                            name={[p.name, "timeRange"]}
                            label="Giờ"
                            rules={[{ required: true }]}
                          >
                            <TimePicker.RangePicker format="HH:mm" />
                          </Form.Item>
                          <Form.Item
                            {...p}
                            name={[p.name, "pricePerHour"]}
                            label="Giá/h"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={0}
                              formatter={(v) =>
                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                              style={{ width: 120 }}
                            />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => remove(p.name)}
                            style={{ color: "red" }}
                          />
                        </Space>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Thêm khung giá
                      </Button>
                      <Form.ErrorList
                        errors={errors}
                        className="text-red-500 font-medium"
                      />
                    </>
                  )}
                </Form.List>
              </Card>
            ))}
          </>
        )}
      </Form.List>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          marginTop: 20,
        }}
      >
        <Button onClick={handlePrev} size="large">
          Quay lại
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          style={{
            background: "#9156F1",
            borderColor: "#9156F1",
          }}
        >
          Tiếp tục
        </Button>
      </div>
    </Form>
  );
}
