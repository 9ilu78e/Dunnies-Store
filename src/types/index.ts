

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
}

export interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    createdAt: Date;
    status: 'pending' | 'completed' | 'canceled';
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}