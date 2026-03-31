import api from "../config/axios";

export interface LegalProfileRequest {
  rentalAreaId: string;
  businessLicenseNumber?: string;
  taxId?: string;
  legalNote?: string;
  imageFiles?: any[]; 
}

class LegalProfileService {
  async createLegalProfile(data: LegalProfileRequest) {
    const formData = new FormData();

    formData.append("rentalAreaId", data.rentalAreaId);
    if (data.businessLicenseNumber)
      formData.append("businessLicenseNumber", data.businessLicenseNumber);
    if (data.taxId) formData.append("taxId", data.taxId);
    if (data.legalNote) formData.append("legalNote", data.legalNote);

    
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append("imageFiles", file.originFileObj);
        }
      });
    }

    const res = await api.post("/legal-profiles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
}

export default new LegalProfileService();
