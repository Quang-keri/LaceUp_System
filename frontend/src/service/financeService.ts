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
  generateDailySettlements: async (date: string) => {
    const res = await api.post(`/admin/settlements/generate`, null, {
      params: { date },
    });
    return res.data.result;
  },

  getSettlementsByDate: async (date: string) => {
    const res = await api.get(`/admin/settlements`, {
      params: { date },
    });
    return res.data.result;
  },

  getSettlementSummary: async (date: string) => {
    const res = await api.get(`/admin/settlements/summary`, {
      params: { date },
    });
    return res.data.result;
  },

  markSettlementAsPaid: async (
    settlementId: string,
    data: PayoutConfirmRequest,
  ) => {
    const res = await api.patch(
      `/admin/settlements/${settlementId}/paid`,
      data,
    );
    return res.data.result;
  },

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

  getOwnerSettlements: async (rentalAreaId: string) => {
    const res = await api.get(`/owner/settlements`, {
      params: { rentalAreaId },
    });
    return res.data.result;
  },

  getOwnerBankAccount: async () => {
    const res = await api.get(`/owner/bank-accounts`);
    return res.data.result;
  },

  saveOwnerBankAccount: async (data: any) => {
    const res = await api.put(`/owner/bank-accounts`, data);
    return res.data.result;
  },
};
