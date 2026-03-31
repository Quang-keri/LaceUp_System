import React, {useEffect, useState} from 'react';
import {Card, Row, Col, Statistic, Spin, Divider, Select, Space, Button} from 'antd';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';

const {Option} = Select;
import {CheckCircle, CreditCard} from 'lucide-react';
import reportService from "../../../service/reportService.ts";
import type {DashboardData} from "../../../types/dashboard.ts";

const OwnerDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardData | null>(null);
    const [range, setRange] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // API nhận param range: ?range=7d
                const response = await reportService.getDashboardOwner(range);
                setStats(response.result);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [range]);

    if (loading) return <Spin size="large" style={{display: 'block', margin: '100px auto'}}/>;
    if (!stats) return <div>Không có dữ liệu hiển thị.</div>;

    const COLORS: Record<string, string> = {
        BOOKED: '#1890ff',
        COMPLETED: '#52c41a',
        CANCELLED: '#f5222d',
    };

    const translate = (key: string) => {
        const map: Record<string, string> = {
            BOOKED: 'Đã đặt', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
            SUCCESS: 'Thành công', FAILED: 'Thất bại'
        };
        return map[key] || key;
    };

    // Xử lý dữ liệu biểu đồ
    const bookingChartData = Object.entries(stats.bookingStats).map(([name, value]) => ({
        name: translate(name),
        originalName: name,
        value
    }));

    const paymentChartData = Object.entries(stats.paymentStats).map(([name, value]) => ({
        name: translate(name),
        originalName: name,
        value
    }));

    return (
        <div style={{padding: '24px', background: '#f5f5f5', minHeight: '100vh'}}>
            <h2 style={{marginBottom: '24px'}}>Tổng quan hệ thống</h2>

            <Space style={{marginBottom: '24px'}}>
                {/* Nút Tháng trước */}
                <Button
                    type={range === 'last_month' ? 'primary' : 'default'}
                    onClick={() => setRange('last_month')} // Đổi từ 30d thành last_month
                >
                    Tháng trước
                </Button>

                {/* Nút Năm nay */}
                <Button
                    type={range === 'this_year' ? 'primary' : 'default'}
                    onClick={() => setRange('this_year')}
                >
                    Năm nay
                </Button>

                {/* Select: Bắt buộc phải có value={range} để đồng bộ với Button */}
                <Select
                    value={range}
                    style={{width: 150}}
                    onChange={(val) => setRange(val)}
                >
                    <Option value="all">Tất cả thời gian</Option>
                    <Option value="24h">24 giờ qua</Option>
                    <Option value="7d">7 ngày qua</Option>
                    <Option value="30d">30 ngày qua</Option>
                </Select>

                {/* Nút Reset nhanh về Tất cả */}
                {range !== 'all' && (
                    <Button onClick={() => setRange('all')} type="link">
                        Xóa lọc
                    </Button>
                )}
            </Space>

            {/* Row 1: Thống kê tổng quát & Doanh thu */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats.totalRevenue}
                            precision={0}
                            suffix="VNĐ"
                            valueStyle={{color: '#20cf13'}}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Thanh toán thành công"
                            value={stats.paymentStats.COMPLETED || 0}
                            prefix={<CheckCircle size={18} color={COLORS.COMPLETED}/>}
                            valueStyle={{color: COLORS.COMPLETED}}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider orientation="horizontal">Thống kê đặt phòng (Booking)</Divider>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Card title="Trạng thái đặt phòng" bordered={false}>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <BarChart data={bookingChartData}>
                                    <XAxis dataKey="name"/>
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip/>
                                    <Bar dataKey="value" barSize={50}>
                                        {bookingChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.originalName]}/>
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Tỷ lệ đặt phòng" bordered={false}>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={bookingChartData.filter(d => d.value > 0)} innerRadius={60}
                                         outerRadius={80} dataKey="value">
                                        {bookingChartData.map((entry, index) => (
                                            <Cell key={`pie-${index}`} fill={COLORS[entry.originalName]}/>
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="horizontal" dashed>
                <span style={{ float: 'left' }}>Thống kê giao dịch (Payment)</span>
            </Divider>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="Tỷ lệ thanh toán" bordered={false}>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={paymentChartData.filter(d => d.value > 0)} innerRadius={60}
                                         outerRadius={80} dataKey="value">
                                        {paymentChartData.map((entry, index) => (
                                            <Cell key={`pay-pie-${index}`} fill={COLORS[entry.originalName]}/>
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="Chi tiết thanh toán" bordered={false}>
                        <Row gutter={[16, 16]}>
                            {Object.entries(stats.paymentStats).map(([key, value]) => (
                                <Col span={8} key={key}>
                                    <Statistic
                                        title={translate(key)}
                                        value={value}
                                        valueStyle={{color: COLORS[key]}}
                                        prefix={<CreditCard size={16}/>}
                                    />
                                </Col>
                            ))}
                        </Row>
                        <div style={{marginTop: 20, padding: '15px', background: '#fafafa', borderRadius: '8px'}}>
                            <p>💡 <b>Ghi chú:</b> Dữ liệu thanh toán bao gồm tất cả các phương thức chuyển khoản và tiền
                                mặt.</p>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OwnerDashboard;