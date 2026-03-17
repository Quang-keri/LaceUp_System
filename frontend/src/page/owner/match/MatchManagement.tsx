import React, {useState, useEffect, useCallback} from "react";
import {
    Table,
    Tag,
    Space,
    Button,
    Input,
    Select,
    DatePicker,
    Card,
    Typography,
    message
} from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    CalendarOutlined,
    PlusOutlined // Import thêm icon dấu cộng
} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import matchService from "../../../service/matchService.ts";
import type {MatchResponse} from "../../../types/match.ts";
import dayjs from "dayjs";
import MatchDetailModal from "./MatchDetailModal.tsx";
import CreateMatchModal from "./CreateMatchModal.tsx"; // Import Modal tạo trận

const {Title} = Typography;
const {RangePicker} = DatePicker;

const MatchManagement: React.FC = () => {
    const [data, setData] = useState<MatchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);

    // Quản lý Modal Chi tiết
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);

    // Quản lý Modal Tạo trận
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    // State cho bộ lọc
    const [params, setParams] = useState({
        page: 1,
        size: 10,
        status: undefined as string | undefined,
        category: undefined as string | undefined,
        keyword: "",
        startDate: undefined as string | undefined,
        endDate: undefined as string | undefined,
    });

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const res = await matchService.getAllMatches(
                params.page,
                params.size,
                params.status,
                params.category,
                params.keyword,
                params.startDate,
                params.endDate
            );
            if (res.code === 1000 || res.code === 0) {
                setData(res.result.data);
                setTotalElements(res.result.totalElements);
            }
        } catch (error) {
            message.error("Không thể tải danh sách trận đấu");
        } finally {
            setLoading(false);
        }
    }, [params]);

    const handleViewDetail = async (matchId: string) => {
        try {
            const res = await matchService.getMatchDetail(matchId);
            if (res.code === 1000 || res.code === 0) {
                setSelectedMatch(res.result);
                setIsModalVisible(true);
            }
        } catch (error) {
            message.error("Không thể lấy thông tin chi tiết");
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const handleTableChange = (pagination: any) => {
        setParams({...params, page: pagination.current, size: pagination.pageSize});
    };

    const handleFilterChange = (key: string, value: any) => {
        setParams({...params, [key]: value, page: 1});
    };

    const columns: ColumnsType<MatchResponse> = [
        {
            title: "Tên trận / Sân",
            key: "courtName",
            render: (record: MatchResponse) => (
                <div>
                    <div className="font-bold text-blue-600">{record.title || "Trận vãng lai"}</div>
                    <div className="text-xs text-gray-400">{record.courtName}</div>
                </div>
            ),
        },
        {
            title: "Môn thi đấu",
            dataIndex: "categoryName",
            key: "categoryName",
            render: (cat) => <Tag color="blue">{cat || "N/A"}</Tag>,
        },
        {
            title: "Thời gian",
            key: "time",
            render: (record: MatchResponse) => (
                <div className="text-xs">
                    <div><CalendarOutlined/> {dayjs(record.startTime).format("DD/MM/YYYY")}</div>
                    <div className="text-gray-500">{dayjs(record.startTime).format("HH:mm")} - {dayjs(record.endTime).format("HH:mm")}</div>
                </div>
            ),
        },
        {
            title: "Số người",
            key: "players",
            render: (record: MatchResponse) => (
                <span>
                    <b className="text-blue-600">{record.currentPlayers}</b> / {record.maxPlayers}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                let color = "default";
                if (status === "OPEN") color = "processing";
                if (status === "CONFIRMED") color = "success";
                if (status === "FULL") color = "warning";
                if (status === "CANCELLED") color = "error";
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        icon={<EyeOutlined/>}
                        size="small"
                        onClick={() => handleViewDetail(record.matchId)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={3} className="!mb-0">Quản lý Trận đấu Vãng lai</Title>
                    <Typography.Text type="secondary">Quản lý và theo dõi các kèo ghép sân cộng đồng</Typography.Text>
                </div>
                <Space>
                    <Button
                        icon={<ReloadOutlined/>}
                        onClick={() => fetchMatches()}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined/>}
                        onClick={() => setIsCreateModalVisible(true)}
                    >
                        Tạo Trận Đấu
                    </Button>
                </Space>
            </div>

            <Card className="mb-6 shadow-sm border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        placeholder="Tìm theo tên sân..."
                        prefix={<SearchOutlined/>}
                        onChange={(e) => handleFilterChange("keyword", e.target.value)}
                        allowClear
                    />

                    <Select
                        placeholder="Trạng thái"
                        allowClear
                        className="w-full"
                        onChange={(val) => handleFilterChange("status", val)}
                        options={[
                            {label: "Đang mở (OPEN)", value: "OPEN"},
                            {label: "Đã chốt (CONFIRMED)", value: "CONFIRMED"},
                            {label: "Đã đầy (FULL)", value: "FULL"},
                            {label: "Đã hủy (CANCELLED)", value: "CANCELLED"},
                        ]}
                    />

                    <Select
                        placeholder="Môn thể thao"
                        allowClear
                        className="w-full"
                        onChange={(val) => handleFilterChange("category", val)}
                        options={[
                            {label: "Bóng đá", value: "Bóng đá"},
                            {label: "Cầu lông", value: "Cầu lông"},
                            {label: "Pickleball", value: "Pickleball"},
                        ]}
                    />

                    <RangePicker
                        className="w-full"
                        onChange={(dates) => {
                            setParams({
                                ...params,
                                startDate: dates ? dates[0]?.startOf('day').toISOString() : undefined,
                                endDate: dates ? dates[1]?.endOf('day').toISOString() : undefined,
                                page: 1
                            });
                        }}
                    />
                </div>
            </Card>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="matchId"
                loading={loading}
                pagination={{
                    current: params.page,
                    pageSize: params.size,
                    total: totalElements,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total) => `Tổng cộng ${total} trận`,
                }}
                onChange={handleTableChange}
                className="shadow-sm border rounded-lg"
            />

            {/* Modal Chi Tiết */}
            <MatchDetailModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                match={selectedMatch}
            />

            {/* Modal Tạo Mới */}
            <CreateMatchModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onSuccess={() => {
                    setIsCreateModalVisible(false);
                    fetchMatches(); // Load lại danh sách khi tạo thành công
                }}
            />
        </div>
    );
};

export default MatchManagement;