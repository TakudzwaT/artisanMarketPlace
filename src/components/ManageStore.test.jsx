import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageStore from './ManageStore';
import { MemoryRouter } from 'react-router-dom';

// Mock Navi component to avoid unrelated rendering
jest.mock('./sellerNav', () => () => <div data-testid="mock-navi">Mock Navi</div>);

// Mock Firebase imports so we avoid triggering real calls
jest.mock('../firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn()
  }
}));

describe('ManageStore component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading message initially', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      // simulate loading (no immediate user callback)
      return jest.fn(); // return unsubscribe
    });

    render(<ManageStore />, { wrapper: MemoryRouter });

    expect(screen.getByText(/Loading store information/i)).toBeInTheDocument();
  });

  test('renders error if not logged in', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(null); // simulate unauthenticated user
      return jest.fn();
    });

    render(<ManageStore />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/Please login to access your store/i)).toBeInTheDocument();
    });
  });

  test('renders product table with mock data', async () => {
    const { auth } = require('../firebase');

    // Simulate a logged-in user
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback({ uid: '123', displayName: 'John' });
      return jest.fn();
    });

    // Mock useState to directly inject storeId and mock products
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => ['123', jest.fn()]) // storeId
      .mockImplementationOnce(() => [{ name: "John's Store" }, jest.fn()]) // store
      .mockImplementationOnce(() => ([ // products
        [
          { id: '1', name: 'Shirt', category: 'Clothing', price: 20, stock: 5, status: 'Active' }
        ], jest.fn()
      ]))
      .mockImplementation(jest.requireActual('react').useState); // default for others

    render(<ManageStore />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/Welcome to John's Store/i)).toBeInTheDocument();
      expect(screen.getByText(/Shirt/i)).toBeInTheDocument();
      expect(screen.getByText(/Clothing/i)).toBeInTheDocument();
    });
  });

  test('opens and closes delete modal', async () => {
    const { auth } = require('../firebase');

    auth.onAuthStateChanged.mockImplementation(callback => {
      callback({ uid: '123', displayName: 'John' });
      return jest.fn();
    });

    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => ['123', jest.fn()]) // storeId
      .mockImplementationOnce(() => [{ name: "Demo Store" }, jest.fn()]) // store
      .mockImplementationOnce(() => ([
        [{ id: '1', name: 'Item', category: 'Cat', price: 10, stock: 2, status: 'Active' }],
        jest.fn()
      ]))
      .mockImplementation(jest.requireActual('react').useState); // fallback

    render(<ManageStore />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/Delete Product/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancel/i));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('search filters products', async () => {
    const { auth } = require('../firebase');

    auth.onAuthStateChanged.mockImplementation(callback => {
      callback({ uid: '123', displayName: 'John' });
      return jest.fn();
    });

    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => ['123', jest.fn()]) // storeId
      .mockImplementationOnce(() => [{ name: "Demo Store" }, jest.fn()]) // store
      .mockImplementationOnce(() => ([
        [
          { id: '1', name: 'T-Shirt', category: 'Clothing', price: 10, stock: 5, status: 'Active' },
          { id: '2', name: 'Mug', category: 'Accessories', price: 8, stock: 10, status: 'Active' }
        ], jest.fn()
      ]))
      .mockImplementation(jest.requireActual('react').useState);

    render(<ManageStore />, { wrapper: MemoryRouter });

    const searchBox = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchBox, { target: { value: 'Mug' } });

    expect(await screen.findByText(/Mug/)).toBeInTheDocument();
    expect(screen.queryByText(/T-Shirt/)).not.toBeInTheDocument();
  });
});
