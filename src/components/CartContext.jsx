// src/components/CartContext.jsx
import React, { createContext, useReducer, useEffect, useState, useContext } from 'react';
import { doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [shoppingCart, dispatch] = useReducer(cartReducer, []);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const totalPrice = shoppingCart.reduce((total, item) => total + (item.qty * Number(item.price)), 0);
  const totalQty = shoppingCart.reduce((total, item) => total + item.qty, 0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      if (user) {
        const cartRef = collection(db, 'users', user.uid, 'cart');
        const unsubscribe = onSnapshot(cartRef, snapshot => {
          const cartItems = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              qty: data.qty,
              totalProductPrice: data.qty * Number(data.price)
            };
          });
          dispatch({ type: 'SET_CART', payload: cartItems });
          setLoading(false);
        }, error => {
          console.error('Error fetching cart:', error);
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        dispatch({ type: 'SET_CART', payload: [] });
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  const addToCart = async (product, quantity = 1) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const productRef = doc(db, 'stores', product.storeId, 'products', product.productId);
      const productSnap = await getDoc(productRef);
      const stock = productSnap.exists() ? productSnap.data().stock || 0 : 0;

      const cartItemsRef = collection(db, 'users', user.uid, 'cart');
      const q = query(cartItemsRef, where('productId', '==', product.productId));
      const querySnapshot = await getDocs(q);
      const existing = !querySnapshot.empty ? querySnapshot.docs[0] : null;
      const currentQty = existing ? existing.data().qty : 0;

      if (currentQty + quantity > stock) {
        alert('Cannot add more than available stock.');
        return;
      }

      if (existing) {
        await updateDoc(existing.ref, { qty: currentQty + quantity });
      } else {
        const cartItemRef = doc(cartItemsRef);
        await setDoc(cartItemRef, {
          productId: product.productId,
          name: product.name,
          price: Number(product.price),
          qty: quantity,
          imageUrl: product.imageUrl,
          storeId: product.storeId
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const incrementItem = async (item) => {
    await addToCart(item, 1);
  };

  const decrementItem = async (item) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      if (item.qty > 1) {
        const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
        await updateDoc(itemRef, { qty: item.qty - 1 });
      } else {
        await removeItem(item);
      }
    } catch (error) {
      console.error('Error decrementing item:', error);
    }
  };

  const removeItem = async (item) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snapshot = await getDocs(cartRef);
      const promises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error clearing cart:', error);
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
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
