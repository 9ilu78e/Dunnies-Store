import { Product } from '@/types';

const API_URL = '/api/products';

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    return response.json();
};

export const fetchProductById = async (id: string): Promise<Product> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch product with id: ${id}`);
    }
    return response.json();
};

export const createProduct = async (product: Product): Promise<Product> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        throw new Error('Failed to create product');
    }
    return response.json();
};

export const updateProduct = async (id: string, product: Product): Promise<Product> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        throw new Error(`Failed to update product with id: ${id}`);
    }
    return response.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete product with id: ${id}`);
    }
};