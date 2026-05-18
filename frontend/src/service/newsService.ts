import api from "../config/axios";

const newsService = {
  getAll: async (page = 0, size = 10, keyword = "") => {
    const res = await api.get("/news", { params: { page, size, keyword } });
    return res.data.result;
  },

  getById: async (id: number | string) => {
    const res = await api.get(`/news/${id}`);
    return res.data.result;
  },

  create: async (formData: FormData) => {
    const res = await api.post("/news", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.result;
  },

  update: async (id: number | string, formData: FormData) => {
    const res = await api.put(`/news/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.result;
  },

  delete: async (id: number | string) => {
    const res = await api.delete(`/news/${id}`);
    return res.data;
  },
};

export default newsService;
