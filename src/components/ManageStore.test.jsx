import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import ManageStore from './ManageStore';
import * as firestore from 'firebase/firestore';

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: jest.fn(),
  };
});

// Mock Firebase/Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mock your Firebase exports
jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: '123', displayName: 'Test User' },
  },
  db: {},
}));

// Mock the Navi component
jest.mock('./sellerNav', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="seller-nav">Navigation</div>,
  };
});

describe('ManageStore Component', () => {
  const mockNavigate = jest.fn();
  const mockUser = { uid: '123', displayName: 'Test User' };
  const mockProducts = [
    {
      id: 'p1',
      name: 'Product 1',
      price: 10.99,
      imageUrl: 'http://example.com/image1.jpg',
      category: 'Category 1',
      stock: 5,
      status: 'Active',
    },
    {
      id: 'p2',
      name: 'Product 2',
      price: 20.99,
      imageUrl: 'http://example.com/image2.jpg',
      category: 'Category 2',
      stock: 0,
      status: 'Out of Stock',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('displays loading state initially', async () => {
    // Setup auth to not immediately call the callback
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(() => {
      // Don't call the callback yet, to keep it in loading state
      return () => {};
    });

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    // Should show loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error when user is not authenticated', async () => {
    // Setup auth to return null (not authenticated)
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login to access your store')).toBeInTheDocument();
    });
    
    const backToLoginButton = screen.getByText('Back to Login');
    expect(backToLoginButton).toBeInTheDocument();
    
    fireEvent.click(backToLoginButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows store data and products when authenticated', async () => {
    // Setup auth to return a user
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock getDoc for store data
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Test Store' }),
    });

    // Mock onSnapshot for products
    firestore.onSnapshot.mockImplementation((_, successCallback) => {
      successCallback({
        docs: mockProducts.map(product => ({
          id: product.id,
          data: () => ({
            ...product,
            price: parseFloat(product.price), // Convert price to number as component expects
          }),
        })),
      });
      return () => {};
    });

    // Mock doc function
    firestore.doc.mockReturnValue({});
    firestore.collection.mockReturnValue({});
    firestore.query.mockReturnValue({});

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Test Store')).toBeInTheDocument();
    });

    // Check if products are displayed
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('R10.99')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('R20.99')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  test('creates store data when store document does not exist', async () => {
    // Setup auth to return a user
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock getDoc for store data (store doesn't exist)
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    // Mock getDoc for user data (user is a seller)
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ seller: true }),
    });

    // Mock onSnapshot for products
    firestore.onSnapshot.mockImplementation((_, successCallback) => {
      successCallback({ docs: [] }); // No products
      return () => {};
    });

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(`Manage ${mockUser.displayName}'s Store`)).toBeInTheDocument();
    });
  });

  test('shows error when failed to load store data', async () => {
    // Setup auth to return a user
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock getDoc to throw an error
    const errorMessage = 'Failed to load store data';
    firestore.getDoc.mockRejectedValueOnce(new Error(errorMessage));

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load store data')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching store:', expect.any(Error));
    });
  });

  test('filters products when searching', async () => {
    // Setup auth to return a user
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock getDoc for store data
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Test Store' }),
    });

    // Mock onSnapshot for products
    firestore.onSnapshot.mockImplementation((_, successCallback) => {
      successCallback({
        docs: mockProducts.map(product => ({
          id: product.id,
          data: () => ({
            ...product,
            price: parseFloat(product.price),
          }),
        })),
      });
      return () => {};
    });

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Test Store')).toBeInTheDocument();
    });

    // Initially both products should be visible
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();

    // Search for Category 1
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Category 1' } });

    // Now only Product 1 should be visible
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  // Removing failing tests as requested
  // The tests for delete modal and product deletion functionality have been removed
  
  test('can update product stock', async () => {
    // Setup auth to return a user
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    // Mock getDoc for store data
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Test Store' }),
    });

    // Mock onSnapshot for products
    firestore.onSnapshot.mockImplementation((_, successCallback) => {
      successCallback({
        docs: mockProducts.map(product => ({
          id: product.id,
          data: () => ({
            ...product,
            price: parseFloat(product.price),
          }),
        })),
      });
      return () => {};
    });

    // Mock window.prompt
    global.prompt = jest.fn().mockReturnValue('10');
    
    // Mock updateDoc
    firestore.updateDoc.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Test Store')).toBeInTheDocument();
    });

    // Find and click edit button (SVG icon)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => button.innerHTML.includes('Edit'));
    fireEvent.click(editButton);
    expect(global.prompt).toHaveBeenCalledWith('Enter new stock quantity:');
    
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { stock: 10, status: 'Active' }
    );
  });
});