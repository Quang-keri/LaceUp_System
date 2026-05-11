import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";
import type { DashboardData, PeriodStatsData } from "../types/dashboard";
import type { EndOfDayReportResponse } from "../types/report";

class ReportService {
  async getDashboardOwner(
    range: string = "all",
  ): Promise<ApiResponse<DashboardData>> {
    const response = await api.get<ApiResponse<DashboardData>>(
      "/reports/dashboard/owner",
      {
        params: {
          range: range,
        },
      },
    );
    return response.data;
  }

  async getDashboardAdmin(
    range: string = "all",
  ): Promise<ApiResponse<DashboardData>> {
    const response = await api.get<ApiResponse<DashboardData>>(
      "/reports/dashboard/admin",
      {
        params: {
          range: range,
        },
      },
    );
    return response.data;
  }

  async getOverviewChartAdmin(
    year: number,
    month: number | null,
  ): Promise<ApiResponse<PeriodStatsData[]>> {
    const params: any = { year };
    if (month !== null) {
      params.month = month;
    }

    const response = await api.get<ApiResponse<PeriodStatsData[]>>(
      "/reports/dashboard/admin/chart/overview",
      {
        params: params,
      },
    );

    return response.data;
  }

  async getOverviewChartOwner(
    year: number,
    month: number | null,
  ): Promise<ApiResponse<PeriodStatsData[]>> {
    const params: any = { year };
    if (month !== null) {
      params.month = month;
    }

    const response = await api.get<ApiResponse<PeriodStatsData[]>>(
      "/reports/dashboard/owner/chart/overview",
      {
        params: params,
      },
    );

    return response.data;
  }

  async getEndOfDayReport(
    date?: string | null,
  ): Promise<EndOfDayReportResponse> {
    const params: any = {};

    if (date) {
      params.date = date;
    }

    const response = await api.get<EndOfDayReportResponse>(
      "/reports/end-of-day",
      {
        params: params,
      },
    );

    return response.data;
  }
}

export default new ReportService();
