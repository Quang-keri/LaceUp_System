import React from "react";
import {
    Table,
    Tag,
    Tooltip,
    Button,
    Dropdown,
    type MenuProps,
} from "antd";
import {
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
    LockOutlined,
    UnlockOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import type {UserResponse} from "../../../types/user.ts";

interface UserTableProps {
    data: UserResponse[];
    loading: boolean;
    pagination: TablePaginationConfig;
    onTableChange: (pagination: TablePaginationConfig) => void;
    onViewDetail: (user: UserResponse) => void;
    onEdit: (user: UserResponse) => void;
    onToggleStatus: (user: UserResponse) => void;
    onManagePermissions: (user: UserResponse) => void;
}

const UserTable: React.FC<UserTableProps> = ({
                                                 data,
                                                 loading,
                                                 pagination,
                                                 onTableChange,
                                                 onViewDetail,
                                                 onEdit,
                                                 onToggleStatus,
                                                 onManagePermissions,
                                             }) => {
    const columns: ColumnsType<UserResponse> = [
        {
            title: "STT",
            key: "index",
            width: 45,
            align: "center",
            render: (_, __, index) => {
                const currentPage = pagination.current || 1;
                const pageSize = pagination.pageSize || 10;
                return (currentPage - 1) * pageSize + index + 1;
            },
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 250,
            ellipsis: {showTitle: false},
            render: (email) => (
                <Tooltip placement="topLeft" title={email}>
                    {email}
                </Tooltip>
            ),
        },
        {
            title: "Username",
            dataIndex: "userName",
            key: "userName",
            width: 150,
            ellipsis: true,
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            width: 80,
            align: "center",
            render: (role) => {
                let color = "geekblue";
                if (role === "ADMIN") color = "blue";
                if (role === "RENTER") color = "cyan";
                if (role === "OWNER") color = "purple";
                return <Tag color={color}>{role ? role.toUpperCase() : "N/A"}</Tag>;
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            key: "active",
            width: 100,
            align: "center",
            render: (active) => (
                <Tag color={active ? "success" : "error"}>
                    {active ? "Hoạt động" : "Bị khóa"}
                </Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 100,
            align: "center",
            render: (date) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-",
        },
        {
            title: "Hành động",
            key: "action",
            align: "center",
            width: 80,
            fixed: "right",
            render: (_, record) => {
                const isAdmin = record.role === "ADMIN";
                const items: MenuProps["items"] = [
                    {
                        key: "detail",
                        label: "Xem chi tiết",
                        icon: <EyeOutlined/>,
                        onClick: () => onViewDetail(record),
                    },
                    {
                        key: "edit",
                        label: "Chỉnh sửa",
                        icon: <EditOutlined/>,
                        onClick: () => onEdit(record),
                    },
                    {
                        key: "permissions",
                        label: "Phân quyền riêng",
                        icon: <SafetyCertificateOutlined style={{color: '#52c41a'}}/>,
                        onClick: () => onManagePermissions(record), // Gọi function từ props
                    },
                    {
                        key: "toggle_status",
                        label: record.active ? "Khóa tài khoản" : "Mở khóa",
                        icon: record.active ? <LockOutlined/> : <UnlockOutlined/>,
                        danger: record.active,
                        disabled: isAdmin,
                        onClick: () => onToggleStatus(record),
                    },
                ];

                return (
                    <Dropdown
                        menu={{items}}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Tooltip
                            title={
                                isAdmin
                                    ? "Không thể thay đổi trạng thái tài khoản Quản trị viên"
                                    : ""
                            }
                        >
                            <Button
                                type="text"
                                icon={
                                    <MoreOutlined
                                        style={{
                                            fontSize: "20px",
                                            color: isAdmin ? "#d9d9d9" : "inherit",
                                        }}
                                    />
                                }
                            />
                        </Tooltip>
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <Table
            size="middle"
            columns={columns}
            dataSource={data}
            rowKey={(record) => record.userId || record.email}
            pagination={pagination}
            loading={loading}
            onChange={onTableChange}
            bordered
            scroll={{x: 800}}
        />
    );
};

export default UserTable;
