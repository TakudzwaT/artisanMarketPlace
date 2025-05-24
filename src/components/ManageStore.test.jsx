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

// Mock firebase config
jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: '123', displayName: 'Test User' },
  },
  db: {},
}));

// Mock navigation component
jest.mock('./sellerNav', () => ({
  __esModule: true,
  default: () => <div data-testid="seller-nav">Navigation</div>,
}));

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

  test('displays loading state initially', () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(() => () => {}); // don't call callback yet

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error when user is not authenticated', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
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

    fireEvent.click(screen.getByText('Back to Login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows store data and products when authenticated', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return () => {};
    });

    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ storeName: 'Test Store' }),
    });

    firestore.onSnapshot.mockImplementation((_, callback) => {
      callback({
        docs: mockProducts.map(p => ({
          id: p.id,
          data: () => p,
        })),
      });
      return () => {};
    });

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

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el.textContent === 'R10.99')).toBeInTheDocument();


    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('R20.99')).toBeInTheDocument();
  });

  test('creates store if it doesn’t exist', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return () => {};
    });

    firestore.getDoc
      .mockResolvedValueOnce({ exists: () => false }) // store does not exist
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ seller: true }) }); // user is seller

    firestore.onSnapshot.mockImplementation((_, callback) => {
      callback({ docs: [] });
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

  test('shows error when store fetch fails', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return () => {};
    });

    const error = new Error('firestore failed');
    firestore.getDoc.mockRejectedValueOnce(error);

    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load store data')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching store:', error);
    });
  });

  test('filters products using search', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return () => {};
    });

    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ storeName: 'Test Store' }),
    });

    firestore.onSnapshot.mockImplementation((_, callback) => {
      callback({
        docs: mockProducts.map(p => ({
          id: p.id,
          data: () => p,
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

    const search = screen.getByPlaceholderText('Search products...');
    fireEvent.change(search, { target: { value: 'Category 1' } });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  test('updates product stock', async () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return () => {};
    });

    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ storeName: 'Test Store' }),
    });

    firestore.onSnapshot.mockImplementation((_, callback) => {
      callback({
        docs: mockProducts.map(p => ({
          id: p.id,
          data: () => p,
        })),
      });
      return () => {};
    });

    firestore.updateDoc.mockResolvedValueOnce();

    global.prompt = jest.fn().mockReturnValue('10');

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Test Store')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const editButton = buttons.find(b => b.innerHTML.includes('Edit'));
    fireEvent.click(editButton);

    expect(global.prompt).toHaveBeenCalledWith('Enter new stock quantity:');
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      stock: 10,
      status: 'Active',
    });
  });
});
