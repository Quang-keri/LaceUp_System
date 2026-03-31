import api from "../config/axios";

export interface ServiceItemRequest {
  rentalAreaId: string;
  itemGroupId: string;
  serviceName: string;
  quantity: number;
  rentalDuration: string;
  priceSell: number;
  priceOriginal: number;
  serviceNote?: string;
  images?: any[]; // Mảng file từ Ant Design
}

class ServiceItemService {
  async createServiceItem(data: ServiceItemRequest) {
    const formData = new FormData();

    formData.append("rentalAreaId", data.rentalAreaId);
    formData.append("itemGroupId", data.itemGroupId);
    formData.append("serviceName", data.serviceName);
    formData.append("quantity", data.quantity.toString());

    if (data.rentalDuration)
      formData.append("rentalDuration", data.rentalDuration);

    formData.append("priceSell", data.priceSell.toString());
    formData.append("priceOriginal", data.priceOriginal.toString());

    if (data.serviceNote) formData.append("serviceNote", data.serviceNote);


    if (data.images && data.images.length > 0) {
      data.images.forEach((file: any) => {
        if (file.originFileObj) {
         
          formData.append("imageUrls", file.originFileObj);
        }
      });
    }

    const res = await api.post("/service-items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
}

export default new ServiceItemService();
