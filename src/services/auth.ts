import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/auth';

export const login = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Login failed');
    }
};

export const register = async (userData: any) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Registration failed');
    }
};

export const logout = async () => {
    try {
        await axios.post(`${API_URL}/logout`);
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Logout failed');
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await axios.get(`${API_URL}/current`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        throw new Error(axiosError.response?.data?.message || 'Failed to fetch current user');
    }
};