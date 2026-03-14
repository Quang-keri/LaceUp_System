import api from '../config/axios';
import type {ApiResponse} from '../types/ApiResponse';
import type {DashboardData} from '../types/dashboard';

class ReportService {

    // Thêm tham số range, mặc định là 'all'
    async getFullDashboard(range: string = 'all'): Promise<ApiResponse<DashboardData>> {
        const response = await api.get<ApiResponse<DashboardData>>('/reports/dashboard/all', {
            params: {
                range: range
            }
        });
        return response.data;
    }

}

export default new ReportService();