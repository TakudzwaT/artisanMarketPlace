import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BuyerTrack from './Buyer'; // Assuming your component is in Buyer.jsx
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Mock firebase firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn((_collectionRef, ...constraints) => ({
    _collectionRef, // Keep a reference to the base collection
    _constraints: constraints, // Store constraints for inspection
  })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the Navigation component
jest.mock('./components/nav', () => {
  return function MockNavigation() {
    return <section data-testid="navigation-component">Navigation</section>;
  };
});

// Mock the OrderCard component
jest.mock('./components/OrderCard', () => {
  return function MockOrderCard(props) {
    return (
      <section data-testid="order-card">
        <section data-testid="order-card-description">{props.description}</section>
        <section data-testid="order-card-price">{props.price}</section>
        <section data-testid="order-card-shopname">{props.shopName}</section>
      </section>
    );
  };
});

describe('BuyerTrack', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();

    // Default mock for collection and doc to allow testing without specific paths
    collection.mockImplementation((_db, path) => ({ _path: path }));
    doc.mockImplementation((_db, ...pathSegments) => ({ _path: { segments: pathSegments } }));
  });

  test('renders loading state initially', () => {
    localStorageMock.setItem('userId', 'testUserId');

    render(<BuyerTrack />);
    expect(screen.getByText(/Gathering your artisanal orders.../i)).toBeInTheDocument();
  });

  test('redirects to login if no userId in localStorage', async () => {
    const mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

    render(<BuyerTrack />);

    await waitFor(() => {
      expect(screen.getByText(/Please login to view your orders/i)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays "No orders yet" if no orders are found', async () => {
    localStorageMock.setItem('userId', 'testUserId');

    // Mock getDocs to return an empty snapshot for the initial orders query
    getDocs.mockResolvedValueOnce({
      docs: [],
      empty: true,
    });

    render(<BuyerTrack />);

    await waitFor(() => {
      expect(screen.getByText(/You haven't placed any orders yet./i)).toBeInTheDocument();
      expect(getDocs).toHaveBeenCalledTimes(1); // Only the initial order fetch
    });
  });

  

  test('handles errors during order fetching', async () => {
    localStorageMock.setItem('userId', 'testUserId');

    // Mock getDocs to throw an error
    getDocs.mockRejectedValueOnce(new Error('Firestore read failed'));

    render(<BuyerTrack />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load orders. Please try again./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});