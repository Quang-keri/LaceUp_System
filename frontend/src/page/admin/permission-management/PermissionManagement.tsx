import React, {useEffect, useState} from "react";
import {Table, Button, Space, Card, Typography, Modal, Form, Input, message, Popconfirm} from "antd";
import {PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined} from "@ant-design/icons";
import permissionService from "../../../service/permissionService";
import type {PermissionResponse, PermissionRequest} from "../../../types/permission";

const {Title} = Typography;

const PermissionManagement: React.FC = () => {
    const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form] = Form.useForm();

    // 1. Lấy danh sách quyền
    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await permissionService.getAllPermissions();
            setPermissions(response.result);
        } catch (error) {
            message.error("Không thể tải danh sách quyền hạn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    // 2. Mở Modal (Thêm hoặc Sửa)
    const showModal = (record?: PermissionResponse) => {
        if (record) {
            setEditingId(record.permissionId);
            form.setFieldsValue(record);
        } else {
            setEditingId(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    // 3. Xử lý Lưu (Create/Update)
    const handleSubmit = async () => {
        try {
            const values: PermissionRequest = await form.validateFields();
            if (editingId) {
                await permissionService.updatePermission(editingId, values);
                message.success("Cập nhật quyền thành công");
            } else {
                await permissionService.createPermission(values);
                message.success("Tạo quyền mới thành công");
            }
            setIsModalOpen(false);
            fetchPermissions();
        } catch (error) {
            console.error(error);
        }
    };

    // 4. Xử lý Xóa
    const handleDelete = async (id: number) => {
        try {
            await permissionService.deletePermission(id);
            message.success("Xóa quyền thành công");
            fetchPermissions();
        } catch (error) {
            message.error("Xóa quyền thất bại");
        }
    };

    const columns = [
        {title: "ID", dataIndex: "permissionId", key: "permissionId", width: 80},
        {
            title: "Tên quyền hạn",
            dataIndex: "permissionName",
            key: "permissionName",
            render: (text: string) => <b style={{color: '#1890ff'}}>{text}</b>
        },
        {title: "Mô tả", dataIndex: "description", key: "description"},
        {
            title: "Hành động",
            key: "action",
            width: 150,
            render: (_: any, record: PermissionResponse) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{color: '#1890ff'}}/>}
                        onClick={() => showModal(record)}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa quyền này?"
                        onConfirm={() => handleDelete(record.permissionId)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="text" danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
                <Title level={3}>Quản lý Quyền hạn</Title>
                <Space>
                    <Button icon={<ReloadOutlined/>} onClick={fetchPermissions}>Làm mới</Button>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={() => showModal()}>
                        Thêm quyền hạn
                    </Button>
                </Space>
            </div>

            <Table
                dataSource={permissions}
                columns={columns}
                rowKey="permissionId"
                loading={loading}
                pagination={{pageSize: 10}}
            />

            {/* Modal Thêm/Sửa */}
            <Modal
                title={editingId ? "Cập nhật quyền hạn" : "Thêm quyền hạn mới"}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{marginTop: 20}}>
                    <Form.Item
                        name="permissionName"
                        label="Tên quyền hạn"
                        rules={[{required: true, message: 'Vui lòng nhập tên quyền!'}]}
                    >
                        <Input placeholder="Ví dụ: CREATE_USER, DELETE_POST..."/>
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết về quyền này"/>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default PermissionManagement;