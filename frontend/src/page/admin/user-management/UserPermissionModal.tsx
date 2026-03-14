import React, {useEffect, useState} from "react";
import {Modal, Checkbox, Row, Col, Divider, message, Spin} from "antd";
import {userService} from "../../../service/userService";
import {permissionService} from "../../../service/permissionService"; // QUAN TRỌNG: Import service này
import type {UserResponse} from "../../../types/user";
import type {PermissionResponse} from "../../../types/permission";

interface Props {
    open: boolean;
    user: UserResponse | null;
    onClose: () => void;
    onRefresh: () => void;
}

const UserPermissionModal: React.FC<Props> = ({open, user, onClose, onRefresh}) => {
    // 1. Thêm hàm setAllPermissions vào đây
    const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // 2. Thêm hàm fetch danh sách quyền từ hệ thống
    const fetchAllSystemPermissions = async () => {
        try {
            const response = await permissionService.getAllPermissions();
            // Lấy dữ liệu từ .result theo cấu trúc ApiResponse của bạn
            setAllPermissions(response.result || response);
        } catch (error) {
            message.error("Không thể tải danh sách quyền hệ thống");
        }
    };

    useEffect(() => {
        if (open) {
            fetchAllSystemPermissions(); // Lấy data khi mở modal
        }
    }, [open]);

    useEffect(() => {
        // Chỉ chạy khi modal mở VÀ đã có đủ data từ User + System Permissions
        if (open && user && allPermissions.length > 0) {
            const userPermissionNames = user.permissions || [];

            const currentIds = allPermissions
                .filter(p => userPermissionNames.includes(p.permissionName))
                .map(p => p.permissionId);

            setSelectedIds(currentIds);
        }
    }, [open, user, allPermissions]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.addExtraPermissions(user.userId, selectedIds);
            message.success(`Cập nhật quyền cho ${user.userName} thành công`);
            onRefresh();
            onClose();
        } catch (error) {
            message.error("Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<span>Quản lý quyền riêng: <b>{user?.userName}</b></span>}
            open={open}
            onOk={handleSave}
            onCancel={onClose}
            confirmLoading={loading}
            width={650}
            destroyOnClose
        >
            <p style={{color: '#8c8c8c'}}>
                * Những quyền này sẽ được cộng thêm vào quyền mặc định của Vai trò ({user?.role}).
            </p>
            <Divider/>
            <Spin spinning={loading || allPermissions.length === 0}>
                <Checkbox.Group
                    style={{width: '100%'}}
                    value={selectedIds}
                    onChange={(values) => setSelectedIds(values as number[])}
                >
                    <Row gutter={[16, 16]}>
                        {allPermissions.map(perm => (
                            <Col span={12} key={perm.permissionId}>
                                <Checkbox value={perm.permissionId}>
                                    <b>{perm.permissionName}</b>
                                    <div style={{fontSize: '12px', color: '#bfbfbf'}}>{perm.description}</div>
                                </Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>
            </Spin>
        </Modal>
    );
};

export default UserPermissionModal;