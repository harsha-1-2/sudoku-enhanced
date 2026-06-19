import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Skip interceptor for refresh call itself + already retried requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh") // ← stops the loop
    ) {
      originalRequest._retry = true;

      try {
        await axiosClient.post("/auth/refresh");
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear any stale state and redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;