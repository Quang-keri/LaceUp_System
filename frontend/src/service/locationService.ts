import axios from "axios";

const API = "https://provinces.open-api.vn/api/v2";

const PROVINCES_KEY = "cached_provinces";
const WARDS_KEY = "cached_wards";

export const locationService = {

  async getProvinces() {
    try {
      const cached = localStorage.getItem(PROVINCES_KEY);

      if (cached) {
        return JSON.parse(cached);
      }

      const res = await axios.get(`${API}/p/`);

      localStorage.setItem(PROVINCES_KEY, JSON.stringify(res.data));

      return res.data;
    } catch (error) {
      console.error("Lỗi lấy tỉnh/thành:", error);
      return [];
    }
  },


  async getWardsByProvince(provinceCode: number) {
    try {
      const cacheKey = `${WARDS_KEY}_${provinceCode}`;

      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const res = await axios.get(`${API}/p/${provinceCode}?depth=2`);

      const wards = res.data?.wards || [];

      localStorage.setItem(cacheKey, JSON.stringify(wards));

      return wards;
    } catch (error) {
      console.error("Lỗi lấy phường/xã:", error);
      return [];
    }
  },


  clearCache() {
    localStorage.removeItem(PROVINCES_KEY);

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(WARDS_KEY)) {
        localStorage.removeItem(key);
      }
    });
  },
};
