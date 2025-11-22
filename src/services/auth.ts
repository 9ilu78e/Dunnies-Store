import axios from "axios";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return Promise.reject(new Error("Incorrect email or password"));
    }
    if (!error.response) {
      return Promise.reject(new Error("Network error. Please check your connection"));
    }
    const msg = error.response?.data?.error || error.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);

export const login = async (email: string, password: string) => {
  const res = await api.post("/api/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
};

export const register = async (data: { name: string; email: string; password: string }) => {
  const res = await api.post("/api/auth/register", {
    fullName: data.name,
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });
  return res.data;
};

export const logout = async () => {
  await api.post("/api/auth/logout");
};

export const getCurrentUser = async () => {
  const res = await api.get("/api/auth/current");
  return res.data.user;
};