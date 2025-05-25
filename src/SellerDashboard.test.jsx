import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerDashboard from './sellerDashboard'; // Adjust path as needed
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((_collectionRef, ...constraints) => ({
    _collectionRef,
    _constraints: constraints,
  })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
}));

// Mock child components to simplify testing the parent
jest.mock('./components/sellerNav', () => () => <section data-testid="seller-nav">Seller Navigation</section>);
jest.mock('./components/DashboardSummary', () => ({ totalSales, totalRevenue, totalItems, totalProducts }) => (
  <section data-testid="dashboard-summary">
    <span>Sales: {totalSales}</span>
    <span>Revenue: {totalRevenue}</span>
    <span>Items: {totalItems}</span>
    <span>Products: {totalProducts}</span>
  </section>
));
jest.mock('./components/InventoryTable', () => ({ inventory }) => (
  <section data-testid="inventory-table">
    {inventory.map(p => <span key={p.id}>{p.name}</span>)}
  </section>
));
jest.mock('./components/SalesTable', () => ({ sales, startDate, endDate, handleStartDateChange, handleEndDateChange, applyDateFilter, resetDateFilter }) => (
  <section data-testid="sales-table">
    <span>Sales Count: {sales.length}</span>
    <input type="date" data-testid="sales-start-date" value={startDate} onChange={handleStartDateChange} />
    <input type="date" data-testid="sales-end-date" value={endDate} onChange={handleEndDateChange} />
    <button onClick={applyDateFilter}>Apply Filter</button>
    <button onClick={resetDateFilter}>Reset Filter</button>
  </section>
));
jest.mock('./components/DateFilter', () => ({ startDate, endDate, handleStartDateChange, handleEndDateChange, applyDateFilter, resetDateFilter }) => (
  <section data-testid="date-filter-component">
    <input type="date" value={startDate} onChange={handleStartDateChange} data-testid="df-start-date" />
    <input type="date" value={endDate} onChange={handleEndDateChange} data-testid="df-end-date" />
    <button onClick={applyDateFilter} data-testid="df-apply">Apply</button>
    <button onClick={resetDateFilter} data-testid="df-reset">Reset</button>
  </section>
));


// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SellerDashboard', () => {
  const mockUser = { uid: 'testStoreId', email: 'test@example.com' };
  const mockStoreInfo = { storeName: 'Test Store', storeBio: 'Bio', paymentMethod: 'Card', ownerName: 'Owner' };
  const mockInventory = [{ id: 'prod1', name: 'Product A', category: 'Cat1', price: 10, stock: 5, status: 'Active' }];
  const mockSales = [
    {
      id: 'order1',
      items: {
        item1: { productId: 'prod1', storeId: 'testStoreId', name: 'Product A', qty: 2, price: 10, total: 20 },
      },
      purchasedAt: { toDate: () => new Date('2023-03-15T10:00:00Z') }
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Default mock for collection and doc to allow testing without specific paths
    collection.mockImplementation((_db, path) => ({ _path: path }));
    doc.mockImplementation((_db, ...pathSegments) => ({ _path: { segments: pathSegments } }));

    // Mock initial auth state to logged in
    onAuthStateChanged.mockImplementation((authInstance, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe
    });

    // Mock getDoc for store info
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockStoreInfo,
    });

    // Mock getDocs for inventory and sales
    getDocs.mockImplementation((queryRef) => {
      if (queryRef._collectionRef._path === 'stores/testStoreId/products') {
        return Promise.resolve({
          docs: mockInventory.map(prod => ({ id: prod.id, data: () => prod })),
          empty: false,
        });
      }
      if (queryRef._collectionRef._path === 'orders') {
        return Promise.resolve({
          docs: mockSales.map(sale => ({ id: sale.id, data: () => sale })),
          empty: false,
        });
      }
      return Promise.resolve({ docs: [], empty: true });
    });
  });

  test('renders loading state initially', async () => {
    onAuthStateChanged.mockImplementationOnce((authInstance, callback) => {
      // Simulate async auth check
      setTimeout(() => callback(null), 100);
      return jest.fn();
    });
    localStorageMock.setItem('sellerId', 'testStoreId'); // Simulate stored ID

    render(<SellerDashboard />);
    expect(screen.getByText(/Loading your dashboard.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading your dashboard.../i)).not.toBeInTheDocument();
    });
  });

  test('redirects to login if not authenticated and no stored sellerId', async () => {
    onAuthStateChanged.mockImplementationOnce((authInstance, callback) => {
      callback(null); // No user authenticated
      return jest.fn();
    });
    localStorageMock.clear(); // Ensure no stored ID

    render(<SellerDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Please log in to access your seller dashboard/i)).toBeInTheDocument();
    });
  });

  


  
  
});