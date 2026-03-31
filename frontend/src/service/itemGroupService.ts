import api from "../config/axios";

export interface ItemGroupResponse {
  itemGroupId: number;
  name: string;
}

class ItemGroupService {
  async getAll() {
    const res = await api.get<ItemGroupResponse[]>("/item-groups");

    return res.data;
  }
}

export default new ItemGroupService();
