import api from "../../config/axios";

export interface AmenityResponse {
  amenityId: number;
  amenityName: string;
  iconKey: string;
}

export interface CreateAmenityRequest {
  amenityName: string;
  iconKey: string;
}

export interface UpdateAmenityRequest {
  amenityName: string;
  iconKey: string;
}

const amenityAdminService = {
  getAll: async (): Promise<any> => {
    return api.get("/amenities");
  },

  getById: async (amenityId: number): Promise<any> => {
    return api.get(`/amenities/${amenityId}`);
  },

  create: async (request: CreateAmenityRequest): Promise<any> => {
    return api.post("/amenities", request);
  },

  update: async (
    amenityId: number,
    request: UpdateAmenityRequest,
  ): Promise<any> => {
    return api.put(`/amenities/${amenityId}`, request);
  },

  delete: async (amenityId: number): Promise<any> => {
    return api.delete(`/amenities/${amenityId}`);
  },
};

export default amenityAdminService;
