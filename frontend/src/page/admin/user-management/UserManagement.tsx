import React, {useEffect, useState} from "react";
import {Card, Button, message, Modal} from "antd";
import type {TablePaginationConfig} from "antd/es/table";
import {ReloadOutlined} from "@ant-design/icons";
import {userService} from "../../../service/userService";
import type {UserResponse} from "../../../types/user";

import UserFilter from "./UserFilter";
import UserTable from "./UserTable";
import UserDetailModal from "./UserDetailModal";
import UserEditModal from "./UserEditModal";
import UserAddModal from "./UserAddModal";
import UserPermissionModal from "./UserPermissionModal.tsx";

const UserManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<UserResponse[]>([]);

    // --- STATE ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);

    const [filters, setFilters] = useState({
        role: undefined as string | undefined,
        active: true as boolean | undefined,
        keyword: "" as string,
    });

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ["5", "10", "20", "50"],
    });

    // --- API CALLS ---
    const fetchUsers = async (
        page: number,
        size: number,
        currentFilters = filters,
    ) => {
        setLoading(true);
        try {
            const apiPage = page;
            const response: any = await userService.getAllUsers(
                apiPage,
                size,
                currentFilters.role,
                currentFilters.active,
                currentFilters.keyword,
            );

            const actualResponse = response.data ? response.data : response;

            if (actualResponse && actualResponse.code === 200) {
                const pageData = actualResponse.result;
                setData(pageData.data);
                setPagination((prev) => ({
                    ...prev,
                    current: page,
                    total: pageData.totalElements,
                    pageSize: size,
                }));
            } else {
                message.error(actualResponse?.message || "Lấy danh sách thất bại");
            }
        } catch (error) {
            console.error("Fetch users error:", error);
            message.error("Đã xảy ra lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(pagination.current || 1, pagination.pageSize || 10, filters);
    }, []);

    // --- HANDLERS LOGIC ---

    const handleCreateSubmit = async (values: any) => {
        setLoading(true);
        try {
            const requestData = {
                ...values,
                dateOfBirth: values.dateOfBirth
                    ? values.dateOfBirth.format("YYYY-MM-DD")
                    : null,
            };

            const response: any = await (userService as any).adminCreateUser(
                requestData,
            );

            if (response?.code === 201 || response?.data?.code === 201) {
                message.success("Thêm mới người dùng thành công!");
                setIsCreateModalOpen(false);
                fetchUsers(1, pagination.pageSize || 10, filters); // Reset về trang 1 để xem user mới
            } else {
                message.error(response?.message || "Thêm mới thất bại");
            }
        } catch (error: any) {
            console.error("Create error:", error);
            // Xử lý hiển thị lỗi từ Validation hoặc Logic Backend
            const errorMsg =
                error.response?.data?.message || "Đã xảy ra lỗi khi thêm mới";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = {...filters, [key]: value};
        setFilters(newFilters);
        fetchUsers(1, pagination.pageSize || 10, newFilters);
    };

    const handleTableChange = (newPagination: TablePaginationConfig) => {
        fetchUsers(
            newPagination.current || 1,
            newPagination.pageSize || 10,
            filters,
        );
    };

    // Logic View Detail
    const handleViewDetail = (user: UserResponse) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedUser(null);
    };

    // Logic Edit
    const handleEdit = (user: UserResponse) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleUpdateSubmit = async (values: any) => {
        if (!editingUser) return;

        setLoading(true);
        try {
            const requestData: any = {
                userName: values.userName,
                phone: values.phone,
                gender: values.gender,
                dateOfBirth: values.dateOfBirth
                    ? values.dateOfBirth.format("YYYY-MM-DD")
                    : null,
            };

            const response: any = await userService.updateUser(
                editingUser.userId,
                requestData,
            );

            if (response?.code === 200 || response?.data?.code === 200) {
                message.success("Cập nhật thông tin thành công!");
                handleCloseEditModal();
                fetchUsers(pagination.current || 1, pagination.pageSize || 10, filters);
            } else {
                message.error(response?.message || "Cập nhật thất bại");
            }
        } catch (error) {
            console.error("Update error:", error);
            message.error("Đã xảy ra lỗi khi cập nhật");
        } finally {
            setLoading(false);
        }
    };

    // Logic Toggle Status
    const handleToggleStatus = (user: UserResponse) => {
        const newStatus = !user.active;
        const actionText = newStatus ? "mở khóa" : "khóa";

        Modal.confirm({
            title: `Xác nhận ${actionText}`,
            content: (
                <span>
          Bạn có chắc muốn <b>{actionText}</b> tài khoản <b>{user.userName}</b>?
        </span>
            ),
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const response: any = await userService.updateStatus(
                        user.userId,
                        newStatus,
                    );

                    if (response?.code === 200 || response?.data?.code === 200) {
                        message.success(`Đã ${actionText} tài khoản thành công!`);
                        fetchUsers(
                            pagination.current || 1,
                            pagination.pageSize || 10,
                            filters,
                        );
                    } else {
                        message.error(response?.message || "Cập nhật thất bại");
                    }
                } catch (error) {
                    console.error("Lỗi update status:", error);
                    message.error("Đã xảy ra lỗi khi cập nhật trạng thái.");
                }
            },
        });
    };

    const handleOpenPermission = (user: UserResponse) => {
        setTargetUser(user);
        setIsPermissionModalOpen(true);
    };

    // --- RENDER ---
    return (
        // <div className="">
        <>
            <Card
                title="Danh sách người dùng"
                className="shadow-md"
                extra={
                    <Button
                        type="primary"
                        icon={<ReloadOutlined/>}
                        onClick={() =>
                            fetchUsers(
                                pagination.current || 1,
                                pagination.pageSize || 10,
                                filters,
                            )
                        }
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                }
            >
                <UserFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onCreate={() => setIsCreateModalOpen(true)}
                />

                <UserTable
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    onTableChange={handleTableChange}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onManagePermissions={handleOpenPermission}
                />
            </Card>

            <UserDetailModal
                open={isDetailModalOpen}
                user={selectedUser}
                onClose={handleCloseDetailModal}
            />

            <UserAddModal
                open={isCreateModalOpen}
                loading={loading}
                onCancel={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
            />

            <UserEditModal
                open={isEditModalOpen}
                user={editingUser}
                loading={loading}
                onCancel={handleCloseEditModal}
                onSubmit={handleUpdateSubmit}
            />

            <UserPermissionModal
                open={isPermissionModalOpen}
                user={targetUser}
                onClose={() => setIsPermissionModalOpen(false)}
                onRefresh={() => fetchUsers(pagination.current || 1, pagination.pageSize || 10, filters)}
            />
        </>

        // </div>
    );
};

export default UserManagement;
