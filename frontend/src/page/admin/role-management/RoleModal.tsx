import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Checkbox, Row, Col, Divider, message } from "antd";
import type { RoleResponse } from "../../../types/role.ts";
import { permissionService } from "../../../service/permissionService.ts";
import type { PermissionResponse } from "../../../types/permission.ts";

interface RoleModalProps {
    open: boolean;
    editingRole: RoleResponse | null;
    onCancel: () => void;
    onSuccess: (values: any) => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ open, editingRole, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>([]);
    const [loadingPerms, setLoadingPerms] = useState(false);

    useEffect(() => {
        if (open) {
            fetchPermissions();
            if (editingRole) {
                // Map list object permission sang list ID để Checkbox.Group hiểu được
                const permissionIds = editingRole.permissions?.map(p => p.permissionId) || [];
                form.setFieldsValue({
                    roleName: editingRole.roleName,
                    description: editingRole.description,
                    permissionIds: permissionIds,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, editingRole]);

    const fetchPermissions = async () => {
        setLoadingPerms(true);
        try {
            const res = await permissionService.getAllPermissions();
            setAllPermissions(res.result);
        } catch (error) {
            message.error("Không thể tải danh sách quyền");
        } finally {
            setLoadingPerms(false);
        }
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            Modal.confirm({
                title: editingRole ? "Xác nhận cập nhật vai trò?" : "Xác nhận tạo vai trò mới?",
                content: "Các thay đổi về quyền hạn sẽ được áp dụng ngay lập tức.",
                onOk: () => onSuccess(values),
            });
        });
    };

    return (
        <Modal
            title={editingRole ? `Chỉnh sửa Vai trò: ${editingRole.roleName}` : "Thêm Vai trò mới"}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={700}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: "20px" }}>
                <Form.Item
                    name="roleName"
                    label="Tên vai trò"
                    rules={[{ required: true, message: "Không được để trống" }]}
                >
                    <Input placeholder="Ví dụ: ADMIN" disabled={!!editingRole} />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={2} placeholder="Mô tả vai trò..." />
                </Form.Item>

                <Divider orientation="left">Quyền hạn (Permissions)</Divider>

                <Form.Item name="permissionIds">
                    <Checkbox.Group style={{ width: '100%' }}>
                        <Row gutter={[16, 16]}>
                            {allPermissions.map((perm) => (
                                <Col span={12} key={perm.permissionId}>
                                    <Checkbox value={perm.permissionId}>
                                        <span style={{ fontWeight: 500 }}>{perm.permissionName}</span>
                                        <br />
                                        <small style={{ color: '#8c8c8c' }}>{perm.description}</small>
                                    </Checkbox>
                                </Col>
                            ))}
                        </Row>
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RoleModal;