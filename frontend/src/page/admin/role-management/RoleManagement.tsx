import React, {useEffect, useState} from "react";
import {
    Table,
    Button,
    Space,
    Tag,
    Card,
    Modal,
    Form,
    message,
    Tooltip,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import {roleService} from "../../../service/roleService.ts";
import type {RoleResponse} from "../../../types/role.ts";
import RoleModal from "./RoleModal.tsx";


const RoleManagement: React.FC = () => {
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
    const [form] = Form.useForm();

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response: any = await roleService.getAllRoles();
            console.log("Check API Response:", response);

            const actualData = response.result || response.data?.result;

            if (actualData) {
                setRoles(actualData);
            } else {
                setRoles(response);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            message.error("Không thể tải danh sách vai trò");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async (values: any) => {
        try {
            if (editingRole) {
                await roleService.updateRole(editingRole.roleId, values);
                message.success("Cập nhật vai trò thành công");
            } else {
                await roleService.createRole({...values, active: true});
                message.success("Tạo vai trò thành công");
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu");
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const showModal = (role?: RoleResponse) => {
        if (role) {
            setEditingRole(role);
            form.setFieldsValue({
                roleName: role.roleName,
                description: role.description,
            });
        } else {
            setEditingRole(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "roleId",
            key: "roleId",
            width: 80,
        },
        {
            title: "Tên vai trò",
            dataIndex: "roleName",
            key: "roleName",
            render: (text: string) => (
                <Tag color="geekblue" style={{fontWeight: "bold"}}>
                    {text}
                </Tag>
            ),
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            key: "active",
            render: (active: boolean) => (
                <Tag color={active ? "green" : "red"}>
                    {active ? "Hoạt động" : "Đã khóa"}
                </Tag>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            render: (_: any, record: RoleResponse) => (
                <Space size="middle">
                    <Tooltip title="Sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{color: "#1890ff"}}/>}
                            onClick={() => showModal(record)}
                        />
                    </Tooltip>

                    {/* Nút bấm tự động đổi màu và Icon dựa theo trạng thái active */}
                    <Tooltip title={record.active ? "Vô hiệu hóa" : "Kích hoạt lại"}>
                        <Button
                            type="text"
                            danger={record.active} // Đỏ khi đang hoạt động (để khóa)
                            style={{color: !record.active ? "#52c41a" : undefined}} // Xanh khi đang khóa (để mở)
                            icon={record.active ? <DeleteOutlined/> : <ReloadOutlined/>}
                            onClick={() => {
                                const actionText = record.active
                                    ? "vô hiệu hóa"
                                    : "kích hoạt lại";
                                Modal.confirm({
                                    title: `Xác nhận ${actionText} role ${record.roleName}?`,
                                    onOk: () =>
                                        roleService
                                            .updateStatus(record.roleId, !record.active)
                                            .then(() => {
                                                message.success(`Đã ${actionText} thành công`);
                                                fetchRoles();
                                            }),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{padding: "24px"}}>
            <Card title="Quản lý Vai trò" extra={
                <Space>
                    <Button icon={<ReloadOutlined/>} onClick={fetchRoles}>Làm mới</Button>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={() => {
                        setEditingRole(null);
                        setIsModalOpen(true);
                    }}>
                        Thêm vai trò
                    </Button>
                </Space>
            }>
                <Table columns={columns} dataSource={roles} rowKey="roleId" loading={loading}/>
            </Card>

            <RoleModal
                open={isModalOpen}
                editingRole={editingRole}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleSaveRole}
            />
        </div>
    );
};

export default RoleManagement;