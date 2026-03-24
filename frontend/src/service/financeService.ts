import api from "../config/axios";

export interface PayoutRequest {
  rentalAreaId: string;
  month: number;
  year: number;
  transactionReference: string;
  note?: string;
}

export interface CommissionConfigDTO {
  commissionConfigId?: string;
  rentalAreaId?: string | null;
  minBookings: number;
  maxBookings?: number | null; 
  rate: number; 
  isDefault: boolean;
  note?: string;
}

export const financeService = {
  
  getMonthlySettlements: async (month: number, year: number) => {
    const response = await api.get(`/settlements/monthly`, {
      params: { month, year }
    });
    return response.data.result; 
  },

  
  confirmPayout: async (data: PayoutRequest) => {
    const response = await api.post(`/payouts/confirm`, data);
    return response.data.result;
  },

  
  getPayoutHistory: async (rentalAreaId: string) => {
    const response = await api.get(`/payouts/rental-area/${rentalAreaId}`);
    return response.data.result;
  },

  getCommissionConfigs: async () => {
    const response = await api.get(`/commissions`);
    return response.data.result;
  },


  createCommissionConfig: async (data: CommissionConfigDTO) => {
    const response = await api.post(`/commissions`, data);
    return response.data.result;
  }
};