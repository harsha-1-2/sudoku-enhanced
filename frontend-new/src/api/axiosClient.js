import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NODE_ENV === "development"
    ? "/api"
    : `${process.env.REACT_APP_BACKEND_URL}/api`, // ✅ full URL in production
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthCheck = originalRequest.url.includes("/auth/me");
    const isRefreshCall = originalRequest.url.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshCall &&
      !isAuthCheck // let AuthContext handle /auth/me itself, avoid reload loop
    ) {
      originalRequest._retry = true;
      try {
        await axiosClient.post("/auth/refresh");
        return axiosClient(originalRequest);
      } catch (refreshError) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
