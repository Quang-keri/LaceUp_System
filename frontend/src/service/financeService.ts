import api from "../config/axios";

export interface PayoutConfirmRequest {
  transferCode: string;
  note?: string;
}

export interface CommissionConfigDTO {
  rentalAreaId?: string | null;
  minBookings?: number | null;
  maxBookings?: number | null;
  rate: number;
  isDefault: boolean;
  note?: string;
}

export interface RentalAreaOptionResponse {
  rentalAreaId: string;
  rentalAreaName: string;
  addressText?: string;
}

export const financeService = {
  // =========================
  // ADMIN - SETTLEMENT
  // =========================

  generateDailySettlements: async (date: string) => {
    const res = await api.post(`/settlements/admin/generate`, null, {
      params: { date },
    });

    return res.data.result;
  },

  getSettlementsByDate: async (date: string) => {
    const res = await api.get(`/settlements/admin`, {
      params: { date },
    });

    return res.data.result;
  },

  getSettlementSummary: async (date: string) => {
    const res = await api.get(`/settlements/admin/summary`, {
      params: { date },
    });

    return res.data.result;
  },

  markSettlementAsPaid: async (
    settlementId: string,
    data: PayoutConfirmRequest,
  ) => {
    const res = await api.patch(
      `/settlements/admin/${settlementId}/paid`,
      data,
    );

    return res.data.result;
  },

  // =========================
  // ADMIN - MONTHLY REPORT
  // =========================

  getMonthlySettlements: async (month: number, year: number) => {
    const res = await api.get(`/settlements/admin/monthly`, {
      params: { month, year },
    });

    return res.data.result;
  },

  getMonthlySettlementByRentalArea: async (
    rentalAreaId: string,
    month: number,
    year: number,
  ) => {
    const res = await api.get(`/settlements/admin/monthly/${rentalAreaId}`, {
      params: { month, year },
    });

    return res.data.result;
  },

  // =========================
  // OWNER - SETTLEMENT HISTORY
  // =========================

  getOwnerSettlements: async (rentalAreaId: string) => {
    const res = await api.get(
      `/settlements/owner/rental-areas/${rentalAreaId}`,
    );

    return res.data.result;
  },

  // =========================
  // COMMISSION CONFIG
  // =========================

  getCommissionConfigs: async () => {
    const res = await api.get(`/admin/commission-configs`);
    return res.data.result;
  },

  createCommissionConfig: async (data: CommissionConfigDTO) => {
    const res = await api.post(`/admin/commission-configs`, data);

    return res.data.result;
  },

  getRentalAreaOptions: async () => {
    const res = await api.get(`/rental-areas/dropdown/options`);

    return res.data.result;
  },

  getOwnerBankAccount: async () => {
    const res = await api.get(`/bank-accounts`);
    return res.data.result;
  },

  saveOwnerBankAccount: async (data: any) => {
    const res = await api.post(`/bank-accounts`, data);

    return res.data.result;
  },
};
