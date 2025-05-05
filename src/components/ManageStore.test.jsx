import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManageStore from './ManageStore';
import { useAuthState } from 'react-firebase-hooks/auth';
import * as firestore from 'firebase/firestore';

// Mock react-firebase-hooks/auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(),
}));

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  return {
    ...originalModule,
    getDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    onSnapshot: jest.fn(),
    deleteDoc: jest.fn(),
    doc: jest.fn(),
    updateDoc: jest.fn(),
  };
});

// Mock auth
jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: '123' },
  },
  db: {},
}));

describe('ManageStore UI tests', () => {
  const mockUser = { uid: '123', displayName: 'Test User' };
  const mockProduct = {
    id: 'p1',
    data: () => ({
      name: 'Product 1',
      price: 10.99,
      imageUrl: 'http://example.com/image1.jpg',
      category: 'Category 1',
      stock: 5,
      status: 'Active'
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth.onAuthStateChanged implementation
    require('../firebase').auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    // Mock console.error to prevent error logs in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('displays loading spinner initially', async () => {
    useAuthState.mockReturnValue([{}, true, null]); // loading state
    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('displays error if user not authenticated', async () => {
    useAuthState.mockReturnValue([null, false, null]);
    require('../firebase').auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    
    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Please login to access your store')
      ).toBeInTheDocument();
    });
  });

  test('renders ManageStore UI with mock products', async () => {
    useAuthState.mockReturnValue([mockUser, false, null]);

    // Mock store document
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Test Store' }),
    });

    // Mock products collection
    const mockUnsubscribe = jest.fn();
    firestore.onSnapshot.mockImplementation((_, callback) => {
      callback({
        docs: [mockProduct],
      });
      return mockUnsubscribe;
    });

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Test Store')).toBeInTheDocument();
      // Use getAllByText instead of ambiguous role selectors
      expect(screen.getAllByText('Product 1')[0]).toBeInTheDocument();
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('R10.99')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  test('handles error when fetching store data', async () => {
    useAuthState.mockReturnValue([mockUser, false, null]);

    // Mock store document to throw error
    firestore.getDoc.mockRejectedValueOnce(new Error('Fetch error'));

    render(
      <MemoryRouter>
        <ManageStore />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching store:', expect.any(Error));
      expect(screen.getByText('Failed to load store data')).toBeInTheDocument();
    });
  });
});