import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, InputNumber, Select, Switch, message } from 'antd';
import matchService from '../../../service/matchService.ts';
import courtService from '../../../service/courtService.ts';
import type { MatchRequest } from '../../../types/match';

interface Props {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const CreateMatchModal: React.FC<Props> = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [courts, setCourts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMyCourts = async () => {
            try {
                const res = await courtService.getMyCourts(1, 100);
                if (res.code === 200) {
                    setCourts(res.result.data || []);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách sân:", error);
            }
        };

        if (visible) {
            fetchMyCourts();
        }
    }, [visible]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const requestData: MatchRequest = {
                courtId: values.courtId,
                // Chuyển về ISO string để Backend LocalDateTime nhận diện được
                startTime: values.timeRange[0].format('YYYY-MM-DDTHH:mm:ss'),
                endTime: values.timeRange[1].format('YYYY-MM-DDTHH:mm:ss'),
                maxPlayers: values.maxPlayers,
                minPlayersToStart: values.minPlayersToStart,
                isRecurring: values.isRecurring || false,
            };

            const res = await matchService.createMatch(requestData);

            if (res.code === 1000 || res.code === 0) {
                message.success("Tạo trận đánh vãng lai thành công!");
                form.resetFields();
                onSuccess();
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi tạo trận";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<span className="text-lg font-bold">Tạo Trận Đấu Vãng Lai</span>}
            open={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            width={600}
            okText="Xác nhận tạo"
            cancelText="Hủy bỏ"
            centered
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    maxPlayers: 10,
                    minPlayersToStart: 6,
                    isRecurring: false
                }}
                className="mt-4"
            >
                <Form.Item
                    name="courtId"
                    label="Sân thi đấu"
                    rules={[{ required: true, message: 'Vui lòng chọn sân!' }]}
                >
                    <Select placeholder="Chọn sân của bạn">
                        {courts.map((court) => (
                            <Select.Option key={court.courtId} value={court.courtId}>
                                {court.courtName} ({court.categoryName || 'Chưa xác định'})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="timeRange"
                    label="Thời gian diễn ra"
                    rules={[{ required: true, message: 'Vui lòng chọn khung giờ!' }]}
                >
                    <DatePicker.RangePicker
                        showTime
                        format="HH:mm DD/MM/YYYY"
                        className="w-full"
                        placeholder={['Giờ bắt đầu', 'Giờ kết thúc']}
                    />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        name="maxPlayers"
                        label="Số người tối đa"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={2} className="w-full" placeholder="Ví dụ: 10" />
                    </Form.Item>

                    <Form.Item
                        name="minPlayersToStart"
                        label="Tối thiểu để chốt kèo"
                        rules={[{ required: true }]}
                        tooltip="Trận đấu sẽ chuyển sang trạng thái CONFIRMED khi đủ số người này"
                    >
                        <InputNumber min={1} className="w-full" placeholder="Ví dụ: 6" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="isRecurring"
                    label="Tự động lặp lại hàng tuần"
                    valuePropName="checked"
                    help="Hệ thống sẽ tự động tạo trận tương tự vào tuần sau"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateMatchModal;