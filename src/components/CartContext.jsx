// src/components/CartContext.jsx
import React, { createContext, useReducer, useEffect, useState, useContext } from 'react';
import { doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    case 'ADD': {
      const existingItem = state.find(item => item.productId === action.item.productId);
      if (existingItem) {
        return state.map(item =>
          item.productId === action.item.productId
            ? {
                ...item,
                qty: item.qty + 1,
                totalProductPrice: (item.qty + 1) * Number(item.price)
              }
            : item
        );
      }
      return [...state, {
        ...action.item,
        qty: 1,
        totalProductPrice: Number(action.item.price)
      }];
    }
    case 'INC':
      return state.map(item =>
        item.productId === action.id
          ? {
              ...item,
              qty: item.qty + 1,
              totalProductPrice: (item.qty + 1) * Number(item.price)
            }
          : item
      );
    case 'DEC':
      return state.map(item =>
        item.productId === action.id && item.qty > 1
          ? {
              ...item,
              qty: item.qty - 1,
              totalProductPrice: (item.qty - 1) * Number(item.price)
            }
          : item
      );
    case 'DELETE':
      return state.filter(item => item.productId !== action.id);
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [shoppingCart, dispatch] = useReducer(cartReducer, []);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const totalPrice = shoppingCart.reduce((total, item) => total + item.totalProductPrice, 0);
  const totalQty = shoppingCart.reduce((total, item) => total + item.qty, 0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const cartRef = collection(db, 'users', user.uid, 'cart');
        const unsubscribe = onSnapshot(cartRef, (snapshot) => {
          const cartItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            totalProductPrice: doc.data().qty * Number(doc.data().price)
          }));

          dispatch({ type: 'SET_CART', payload: cartItems });
          setLoading(false);
        }, (error) => {
          console.error("Error fetching cart: ", error);
          setLoading(false);
        });

        return () => unsubscribe();
      } else {
        dispatch({ type: 'SET_CART', payload: [] });
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addToCart = async (product) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const productRef = doc(db, 'stores', product.storeId, 'products', product.productId);
      const productSnap = await getDoc(productRef);
      const availableStock = productSnap.data()?.stock || 0;

      const cartItemsRef = collection(db, 'users', user.uid, 'cart');
      const q = query(cartItemsRef, where('productId', '==', product.productId));
      const querySnapshot = await getDocs(q);
      const currentQty = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().qty;

      if (currentQty >= availableStock) {
        alert('Cannot add more than available stock.');
        return;
      }

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          qty: currentQty + 1,
        });
      } else {
        const cartItemRef = doc(collection(db, 'users', user.uid, 'cart'));
        await setDoc(cartItemRef, {
          id: cartItemRef.id,
          productId: product.productId,
          name: product.name,
          price: Number(product.price),
          qty: 1,
          imageUrl: product.imageUrl,
          storeId: product.storeId
        });
      }

      dispatch({ type: 'ADD', item: product });
    } catch (error) {
      console.error("Error adding to cart: ", error);
    }
  };

  const incrementItem = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const productRef = doc(db, 'stores', item.storeId, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      const availableStock = productSnap.data()?.stock || 0;

      if (item.qty >= availableStock) {
        alert('Cannot add more than available stock.');
        return;
      }

      const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
      await updateDoc(itemRef, {
        qty: item.qty + 1
      });

      dispatch({ type: 'INC', id: item.productId });
    } catch (error) {
      console.error("Error incrementing item: ", error);
    }
  };

  const decrementItem = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (item.qty > 1) {
        const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
        await updateDoc(itemRef, {
          qty: item.qty - 1
        });

        dispatch({ type: 'DEC', id: item.productId });
      } else {
        await removeItem(item);
      }
    } catch (error) {
      console.error("Error decrementing item: ", error);
    }
  };

  const removeItem = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
      await deleteDoc(itemRef);

      dispatch({ type: 'DELETE', id: item.productId });
    } catch (error) {
      console.error("Error removing item: ", error);
    }
  };

  const clearCart = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snapshot = await getDocs(cartRef);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      dispatch({ type: 'SET_CART', payload: [] });
    } catch (error) {
      console.error("Error clearing cart: ", error);
    }
  };

  return (
    <CartContext.Provider value={{ 
      shoppingCart, 
      totalPrice, 
      totalQty, 
      loading,
      addToCart,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart
    }}>
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
