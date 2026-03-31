import api from '../config/axios';
import type {ApiResponse} from '../types/ApiResponse';
import type {DashboardData} from '../types/dashboard';

class ReportService {

    async getDashboardOwner(range: string = 'all'): Promise<ApiResponse<DashboardData>> {
        const response = await api.get<ApiResponse<DashboardData>>('/reports/dashboard/owner', {
            params: {
                range: range
            }
        });
        return response.data;
    }

    async getDashboardAdmin(range: string = 'all'): Promise<ApiResponse<DashboardData>> {
        const response = await api.get<ApiResponse<DashboardData>>('/reports/dashboard/admin', {
            params: {
                range: range
            }
        });
        return response.data;
    }

}

export default new ReportService();