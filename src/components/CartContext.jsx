// src/components/CartContext.jsx
import React, { createContext, useReducer, useContext } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD':
            const existingItem = state.find(item => item.ProductID === action.item.ProductID);
            if (existingItem) {
                return state.map(item =>
                    item.ProductID === action.item.ProductID
                        ? {
                            ...item,
                            qty: item.qty + 1,
                            TotalProductPrice: (item.qty + 1) * Number(item.ProductPrice)
                        }
                        : item
                );
            }
            return [...state, {
                ...action.item,
                ProductPrice: Number(action.item.ProductPrice),
                TotalProductPrice: Number(action.item.ProductPrice)
            }];
            
        case 'INC':
            return state.map(item =>
                item.ProductID === action.id
                    ? {
                        ...item,
                        qty: item.qty + 1,
                        TotalProductPrice: (item.qty + 1) * Number(item.ProductPrice)
                    }
                    : item
            );
            
        case 'DEC':
            return state.map(item =>
                item.ProductID === action.id && item.qty > 1
                    ? {
                        ...item,
                        qty: item.qty - 1,
                        TotalProductPrice: (item.qty - 1) * Number(item.ProductPrice)
                    }
                    : item
            );
            
        case 'DELETE':
            return state.filter(item => item.ProductID !== action.id);
            
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [shoppingCart, dispatch] = useReducer(cartReducer, []);
    
    const totalPrice = shoppingCart.reduce((total, item) => total + item.TotalProductPrice, 0);
    const totalQty = shoppingCart.reduce((total, item) => total + item.qty, 0);
    
    return (
        <CartContext.Provider value={{ shoppingCart, dispatch, totalPrice, totalQty }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;