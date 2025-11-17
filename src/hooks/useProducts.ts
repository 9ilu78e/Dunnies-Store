import { useEffect, useState } from 'react';
import { fetchProducts } from '../services/products';

interface Product {
    id: string | number;
    name: string;
    price: number;
}

const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    return { products, loading, error };
};

export default useProducts;