import axios from "axios";

const BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined" && window.__APP_API_BASE__) ||
  "https://condominio-env.eba-ibwb3pvj.us-east-1.elasticbeanstalk.com"; // <--- AGREGADO https://
export const api = axios.create({
  baseURL: BASE.replace(/\/$/, ""),
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Error de red";
    return Promise.reject(new Error(msg));
  }
);
