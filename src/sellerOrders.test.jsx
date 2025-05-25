import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SellerOrders from './sellerOrders';
import * as firestore from 'firebase/firestore';
import { db } from './firebase'; // Mock this
import { useNavigate } from 'react-router-dom'; // Mock this
import Card from './components/seller_card'; // Mock this
import Navi from './components/sellerNav'; // Mock this

// Mock Firebase - absolute minimal mocks to prevent errors
jest.mock('./firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ id: 'mockCollectionPath' })), // Give it a path
  query: jest.fn((collectionRef, ...wheres) => ({
    id: collectionRef.id, // Use id for simplified path matching
    wheres: wheres.map(w => ({ field: w.field, operator: w.operator, value: w.value })),
    __isFirebaseQuery: true, // Custom flag
  })),
  where: jest.fn((field, operator, value) => ({ field, operator, value })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true })), // Default to empty
  doc: jest.fn(() => ({ id: 'mockDocId' })),
  updateDoc: jest.fn(() => Promise.resolve()), 
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ /* minimal data */ }) })), // Always exists
}));

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('./components/seller_card', () => {
  return function MockCard({ onStatusChange, status, description, price, quantity, OrderID, ProductID }) {
    return (
      <section data-testid="mock-card-rendered"> {}
        <section data-testid="card-order-id">Order ID: {OrderID || 'N/A'}</section>
        <section data-testid="card-product-id">Product ID: {ProductID || 'N/A'}</section>
        <section data-testid="card-description">Description: {description || 'Default Product'}</section> {/* Ensure this is always here */}
        <section data-testid="card-price">Price: {price || 0}</section>
        <section data-testid="card-quantity">Quantity: {quantity || 1}</section>
        <section data-testid="card-status">Status: {status || 'default'}</section>
        <button onClick={() => onStatusChange('shipped')}>Ship Item</button>
      </section>
    );
  };
});
jest.mock('./components/sellerNav', () => {
  return function MockNavi() {
    return <nav data-testid="mock-navi">Navigation</nav>;
  };
});

describe('SellerOrders', () => {
  const mockStoreId = 'testStore123';
  const mockNavigate = jest.fn();
  let reloadSpy;

  // Store the original window.location.reload to restore it
  const originalReload = window.location.reload;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useNavigate.mockReturnValue(mockNavigate);

    reloadSpy = jest.fn();
    // Force window.location.reload to be our mock
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
  });

  afterEach(() => {
    // Restore original reload after each test
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: originalReload },
    });
  });

  // Test Case 1: Initial load with no storeId in localStorage
  test('displays error if storeId is not found in localStorage', async () => {
    // Ensure localStorage is empty for this test
    localStorage.clear();

    render(<SellerOrders />);
    // Wait for the error message to appear
    expect(await screen.findByText(/Unable to retrieve store information/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });


  

  // Test Case 4: No orders found
  test('displays no orders message when no orders are found', async () => {
    localStorage.setItem('storeId', mockStoreId);
    firestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true }); // Ensure no docs are returned for the initial query

    render(<SellerOrders />);

    expect(await screen.findByText(/No orders found for your store./i)).toBeInTheDocument();
  });

  // Test Case 5: Error during order fetching
  test('displays error message if fetching orders fails', async () => {
    localStorage.setItem('storeId', mockStoreId);
    firestore.getDocs.mockRejectedValueOnce(new Error('Forced network error')); // Force an error

    render(<SellerOrders />);

    expect(await screen.findByText(/Failed to load orders\. Please try again\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  // Test Case 6: Updating an order item status (with items array)
  test('updates order item status correctly and updates UI', async () => {
    localStorage.setItem('storeId', mockStoreId);

    // Mock getDocs to return an order with items
    firestore.getDocs.mockImplementation((queryRef) => {
      if (queryRef.id === 'mockCollectionPath') { // Initial orders fetch
        return Promise.resolve({
          docs: [
            {
              id: 'order4',
              data: () => ({
                items: [
                  { productId: 'prodD', qty: 1, storeId: mockStoreId, status: 'processing' },
                ],
                createdAt: '2023-01-04',
              }),
            },
          ],
          empty: false,
        });
      }
      // Mock for product details
      if (queryRef.__isFirebaseQuery && queryRef.wheres && queryRef.wheres[0].value === 'prodD') {
        return Promise.resolve({
          docs: [{ id: 'prodD_doc', data: () => ({ name: 'Product D', price: 200, imageUrl: 'urlD' }) }],
          empty: false,
        });
      }
      // Mock for the 'stores/{storeId}/orders' query after status update
      if (queryRef.__isFirebaseQuery && queryRef.id === 'mockCollectionPath' && queryRef.wheres[0]?.field === 'orderId' && queryRef.wheres[0]?.value === 'order4') {
          return Promise.resolve({
              docs: [{ id: 'storeOrderDocId', data: () => ({ status: 'processing' }) }],
              empty: false,
          });
      }
      return Promise.resolve({ docs: [], empty: true });
    });

    // Mock getDoc for the order being updated to contain the items array
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        items: [
          { productId: 'prodD', qty: 1, storeId: mockStoreId, status: 'processing' },
        ],
      }),
    });

    // Mock updateDoc to always succeed
    firestore.updateDoc.mockResolvedValue();

    render(<SellerOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('card-status')).toHaveTextContent('Status: processing');
    });

    fireEvent.click(screen.getByRole('button', { name: /ship item/i }));

    await waitFor(() => {
      // Verify updateDoc was called for the main order
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mockDocId' }), // Expect a doc ref
        { items: [{ productId: 'prodD', qty: 1, storeId: mockStoreId, status: 'shipped' }] }
      );
      // Verify updateDoc was called for the store specific order
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mockDocId' }), // Expect a doc ref
        { status: 'shipped' }
      );
    });

    expect(screen.getByTestId('card-status')).toHaveTextContent('Status: shipped');
  });

  // Test Case 7: Updating an order item status (no items array, single product order)
  test('updates single product order status correctly', async () => {
    localStorage.setItem('storeId', mockStoreId);

    // Mock getDocs to return a single product order
    firestore.getDocs.mockImplementation((queryRef) => {
      if (queryRef.id === 'mockCollectionPath') { // Initial orders fetch
        return Promise.resolve({
          docs: [
            {
              id: 'order5',
              data: () => ({
                storeId: mockStoreId,
                productId: 'prodE',
                qty: 1,
                status: 'processing',
                createdAt: '2023-01-05',
              }),
            },
          ],
          empty: false,
        });
      }
      // Mock for product details
      if (queryRef.__isFirebaseQuery && queryRef.wheres && queryRef.wheres[0].value === 'prodE') {
        return Promise.resolve({
          docs: [{ id: 'prodE_doc', data: () => ({ name: 'Product E', price: 150, imageUrl: 'urlE' }) }],
          empty: false,
        });
      }
      // Mock for the 'stores/{storeId}/orders' query after status update
      if (queryRef.__isFirebaseQuery && queryRef.id === 'mockCollectionPath' && queryRef.wheres[0]?.field === 'orderId' && queryRef.wheres[0]?.value === 'order5') {
          return Promise.resolve({
              docs: [{ id: 'storeOrderDocId', data: () => ({ status: 'processing' }) }],
              empty: false,
          });
      }
      return Promise.resolve({ docs: [], empty: true });
    });

    // Mock getDoc for the order being updated (no items array)
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        storeId: mockStoreId,
        productId: 'prodE',
        qty: 1,
        status: 'processing',
      }),
    });

    firestore.updateDoc.mockResolvedValue();

    render(<SellerOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('card-status')).toHaveTextContent('Status: processing');
    });

    fireEvent.click(screen.getByRole('button', { name: /ship item/i }));

    await waitFor(() => {
      // Expect the updateDoc for the main order to be called with just status
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mockDocId' }), // Expect a doc ref
        { status: 'shipped' }
      );
      // The store specific order might also be updated if found
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mockDocId' }),
        { status: 'shipped' }
      );
    });

    expect(screen.getByTestId('card-status')).toHaveTextContent('Status: shipped');
  });

  // Test Case 8: Error during status update
  test('displays an alert if status update fails', async () => {
    localStorage.setItem('storeId', mockStoreId);

    firestore.getDocs.mockImplementation((queryRef) => {
      if (queryRef.id === 'mockCollectionPath') { // Initial orders fetch
        return Promise.resolve({
          docs: [
            {
              id: 'order6',
              data: () => ({
                items: [
                  { productId: 'prodF', qty: 1, storeId: mockStoreId, status: 'processing' },
                ],
                createdAt: '2023-01-06',
              }),
            },
          ],
          empty: false,
        });
      }
      if (queryRef.__isFirebaseQuery && queryRef.wheres && queryRef.wheres[0].value === 'prodF') {
        return Promise.resolve({
          docs: [{ id: 'prodF_doc', data: () => ({ name: 'Product F', price: 250, imageUrl: 'urlF' }) }],
          empty: false,
        });
      }
      return Promise.resolve({ docs: [], empty: true });
    });

    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        items: [{ productId: 'prodF', qty: 1, storeId: mockStoreId, status: 'processing' }],
      }),
    });

    // Force updateDoc to fail
    firestore.updateDoc.mockRejectedValue(new Error('Forced update failure'));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SellerOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('card-status')).toHaveTextContent('Status: processing');
    });

    fireEvent.click(screen.getByRole('button', { name: /ship item/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to update order item status. Please try again.');
    });

    alertSpy.mockRestore();
  });

  // Test Case 9: Handle product details not found

  
});