import { useState, useEffect } from 'react';

interface CartItem {
    id: string | number;
    price: number;
    quantity: number;
}

const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setTotalAmount(total);
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item: any) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
            if (existingItem) {
                return prevItems.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevItems, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string | number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return {
        cartItems,
        totalAmount,
        addToCart,
        removeFromCart,
        clearCart,
    };
};

export default useCart;