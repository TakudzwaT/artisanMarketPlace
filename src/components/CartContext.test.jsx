import React from 'react';
import { render, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

// --- Firebase Firestore Mocks ---
const mockUnsubscribe = jest.fn();
jest.mock('firebase/firestore', () => {
  const mockDoc = {
    id: 'mockDocId',
    data: () => ({
      productId: '1',
      name: 'Test',
      price: 10,
      qty: 1,
      imageUrl: 'image.png',
      storeId: 'store1',
    }),
  };
  return {
    collection: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn((_, onNext) => {
      setTimeout(() => {
        onNext({ docs: [mockDoc] }); // simulate 1 cart item
      }, 0);
      return mockUnsubscribe;
    }),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ stock: 5 }) })),
  };
});

// --- Firebase Auth Mocks ---
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'mock-user' },
  })),
  onAuthStateChanged: jest.fn((_, cb) => {
    setTimeout(() => cb({ uid: 'mock-user' }), 0); // simulate async auth
    return () => {}; // mock unsubscribe
  }),
}));

// --- Firebase Config Mock ---
jest.mock('../firebase', () => ({
  db: {},
}));

// Dummy consumer component
const DummyConsumer = () => {
  const {
    addToCart,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    totalPrice,
    totalQty,
    shoppingCart,
    loading,
  } = useCart();

  React.useEffect(() => {
    addToCart({ productId: '1', name: 'Test', price: 10, storeId: 'store1' });
    incrementItem({ id: '1', qty: 1 });
    decrementItem({ id: '1', qty: 1 });
    removeItem({ id: '1' });
    clearCart();
  }, []);

  return (
    <section>
      <p>{loading ? 'Loading' : 'Done'}</p>
      <p>Items: {shoppingCart.length}</p>
      <p>Total: {totalPrice}</p>
      <p>Qty: {totalQty}</p>
    </section>
  );
};

// --- Test ---
describe('CartContext minimal test', () => {
  it('renders CartProvider and dummy consumer without crashing', async () => {
    await act(async () => {
      render(
        <CartProvider>
          <DummyConsumer />
        </CartProvider>
      );
    });

    // wait for setTimeout in onSnapshot and onAuthStateChanged
    await act(() => new Promise(res => setTimeout(res, 10)));
  });
});
