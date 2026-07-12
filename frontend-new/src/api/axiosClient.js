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
<<<<<<< HEAD
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isPublicRoute = ["/", "/login", "/register"].includes(pathname);
=======
    const isAuthCheck = originalRequest.url.includes("/auth/me");
    const isRefreshCall = originalRequest.url.includes("/auth/refresh");
>>>>>>> 4b77b984879ebe11aaad1c157881663a221b3ef3

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
<<<<<<< HEAD
      !originalRequest.url?.includes("/auth/refresh")
=======
      !isRefreshCall &&
      !isAuthCheck // let AuthContext handle /auth/me itself, avoid reload loop
>>>>>>> 4b77b984879ebe11aaad1c157881663a221b3ef3
    ) {
      originalRequest._retry = true;
      try {
        await axiosClient.post("/auth/refresh");
        return axiosClient(originalRequest);
<<<<<<< HEAD
      } catch {
        if (!isPublicRoute) {
          window.location.assign("/login");
        }
        return Promise.reject(error);
=======
      } catch (refreshError) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
>>>>>>> 4b77b984879ebe11aaad1c157881663a221b3ef3
      }
    }

    if (error.response?.status === 401 && isPublicRoute) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
