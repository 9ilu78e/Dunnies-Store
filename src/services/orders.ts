import { Order } from '../types';

const API_URL = '/api/orders';

export const fetchOrders = async (): Promise<Order[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    return response.json();
};

export const createOrder = async (orderData: Order): Promise<Order> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) {
        throw new Error('Failed to create order');
    }
    return response.json();
};

export const updateOrder = async (orderId: string, orderData: Partial<Order>): Promise<Order> => {
    const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) {
        throw new Error('Failed to update order');
    }
    return response.json();
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete order');
    }
};