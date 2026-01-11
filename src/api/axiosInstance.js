import axios from "axios";

let logoutHandler = null;
let tokenRefreshedHandler = null;

export const setLogoutHandler = (fn) => { logoutHandler = fn; };
export const setTokenRefreshedHandler = (fn) => { tokenRefreshedHandler = fn; };

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "/amongus/api",
  withCredentials: true, // per i cookie di refresh
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // 🔄 refresh
        const refreshResponse = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL || "/amongus/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.access_token;
        localStorage.setItem("token", newToken);

        if (tokenRefreshedHandler) {
          tokenRefreshedHandler(newToken); // 🔑 aggiorna anche lo stato React
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (logoutHandler) logoutHandler();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
