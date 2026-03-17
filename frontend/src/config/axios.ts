import axios from "axios";

export const AXIOS_AUTH_ERROR_EVENT = "axios-auth-error";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (config.headers) {
      if (isFormData) {
        delete (config.headers as any)["Content-Type"];
        delete (config.headers as any)["content-type"];
      } else {
        (config.headers as any)["Content-Type"] = "application/json";
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || "";
    if (url.startsWith("/auth")) return Promise.reject(error);

    if (error.response?.status !== 401) return Promise.reject(error);

    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      const { accessToken, refreshToken: newRefreshToken } = res.data.result;

      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);

      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

      return axios(originalRequest);
    } catch (refreshError: any) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new CustomEvent(AXIOS_AUTH_ERROR_EVENT));

      return Promise.reject(refreshError);
    }
  },
);

export default api;
