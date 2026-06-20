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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await axiosClient.post("/auth/refresh");
        return axiosClient(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;