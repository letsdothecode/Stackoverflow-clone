import axios from "axios";

// Get base URL - Next.js will replace NEXT_PUBLIC_BACKEND_URL at build time
// Fallback to localhost:5000 for development
const getBaseURL = () => {
  // In browser/client-side
  if (typeof window !== "undefined") {
    // NEXT_PUBLIC_ variables are available in client-side Next.js
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }
  // Server-side (SSR)
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (req) => {
    if (typeof window !== "undefined") {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          const token = userData?.token;
          if (token) {
            req.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error: No response from server", error.request);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
