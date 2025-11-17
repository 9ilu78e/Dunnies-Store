import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const fetchProducts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching products: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

export const fetchProductById = async (id: string | number) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/${id}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

export const fetchOrders = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/orders`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

export const fetchOrderById = async (id: string | number) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching order: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};