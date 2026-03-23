import api from "../config/axios";

const BASE = "/slots";

export interface ExtendRequest {
  amount: number;
  unit: "minute" | "hour";
}

export interface SwapRequest {
  courtCopyId: string;
  newStartTime: string;
}

export interface ExtendCheckResponse {
  available: boolean;
  extraPrice?: number;
  newEndTime?: string;
  conflictReason?: string;
}

export interface SwapCheckResponse {
  available: boolean;
  newPrice?: number;
  priceDiff?: number;
  conflictReason?: string;
}

export interface CourtOption {
  courtCopyId: string;
  courtCode: string;
  courtName: string;
}

export const bookingSlotService = {
  getCourts: (rentalAreaId: string): Promise<CourtOption[]> =>
    api.get(`${BASE}/rental/${rentalAreaId}/courts`).then((r) => r.data.result),

  checkExtend: (
    slotId: string,
    data: ExtendRequest,
  ): Promise<ExtendCheckResponse> =>
    api.post(`${BASE}/${slotId}/extend/check`, data).then((r) => r.data.result),

  confirmExtend: (slotId: string, data: ExtendRequest): Promise<void> =>
    api.post(`${BASE}/${slotId}/extend/confirm`, data).then((r) => r.data),

  checkSwap: (slotId: string, data: SwapRequest): Promise<SwapCheckResponse> =>
    api.post(`${BASE}/${slotId}/swap/check`, data).then((r) => r.data.result),

  confirmSwap: (slotId: string, data: SwapRequest): Promise<void> =>
    api.post(`${BASE}/${slotId}/swap/confirm`, data).then((r) => r.data),
};
