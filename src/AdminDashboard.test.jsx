// AdminDashboard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

// ==== Mocks ====

// Mock Firebase modules
jest.mock('./firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    writeBatch: jest.fn(() => ({
      delete: jest.fn(),
      update: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
    query: jest.fn(),
    where: jest.fn(),
  };
});

// Mock React Router
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

// Mock MUI components
jest.mock('@mui/material', () => {
  const actualMUI = jest.requireActual('@mui/material');
  return {
    ...actualMUI,
    CircularProgress: () => <section data-testid="circular-progress">Loading...</section>,
    Tabs: ({ children }) => <section data-testid="tabs">{children}</section>,
    Tab: ({ label }) => <button>{label}</button>,
    Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
    TextField: ({ onChange, value, placeholder }) => (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e)}
      />
    ),
    Dialog: ({ open, children }) => open ? <section>{children}</section> : null,
    DialogActions: ({ children }) => <section>{children}</section>,
    DialogContent: ({ children }) => <section>{children}</section>,
    DialogContentText: ({ children }) => <section>{children}</section>,
    DialogTitle: ({ children }) => <section>{children}</section>,
  };
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('redirects to login if no adminId in localStorage', async () => {
  render(<AdminDashboard />);
  await waitFor(() => {
    expect(mockedNavigate).toHaveBeenCalledWith('/admin/login');
  });
});

test('displays loading spinner initially', async () => {
  localStorage.setItem('adminId', 'admin123');

  // Stub getDoc to return a never-resolving promise to simulate loading
  const getDoc = require('firebase/firestore').getDoc;
  getDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

  render(<AdminDashboard />);
  
  // Assert the spinner shows up during loading
  expect(await screen.findByTestId('circular-progress')).toBeInTheDocument();
});


test('renders dashboard after loading data', async () => {
  localStorage.setItem('adminId', 'admin123');

  const mockUserDoc = {
    exists: () => true,
    data: () => ({ admin: true }),
  };

  const mockUserSnapshot = {
    forEach: (cb) => cb({ id: 'user1', data: () => ({ email: 'user1@example.com', name: 'User One', buyer: true }) }),
  };

  const mockStoreSnapshot = {
    docs: [
      {
        id: 'store1',
        data: () => ({ storeName: 'Test Store', ownerId: 'user1' }),
      },
    ],
  };

  const mockProductSnapshot = {
    forEach: (cb) =>
      cb({
        id: 'product1',
        data: () => ({
          name: 'Product One',
          description: 'Description',
          price: 10,
          quantity: 1,
        }),
      }),
  };

  const mockOwnerDoc = {
    exists: () => true,
    data: () => ({ name: 'Seller One' }),
  };

  const {
    getDoc,
    getDocs,
    collection,
    doc,
  } = require('firebase/firestore');

  getDoc.mockImplementation((ref) => {
    if (ref === 'users/admin123') return Promise.resolve(mockUserDoc);
    if (ref === 'users/user1') return Promise.resolve(mockOwnerDoc);
    return Promise.resolve(mockUserDoc);
  });

  getDocs.mockImplementation((ref) => {
    if (typeof ref === 'string' && ref.includes('users')) return Promise.resolve(mockUserSnapshot);
    if (typeof ref === 'string' && ref.includes('stores/store1/products')) return Promise.resolve(mockProductSnapshot);
    if (typeof ref === 'string' && ref.includes('stores')) return Promise.resolve(mockStoreSnapshot);
    return Promise.resolve({ forEach: () => {} });
  });

  doc.mockImplementation((...args) => args.join('/'));
  collection.mockImplementation((...args) => args.join('/'));

  render(<AdminDashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search users/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});

test('calls logout and navigates to login', async () => {
  localStorage.setItem('adminId', 'admin123');
  localStorage.setItem('adminEmail', 'admin@test.com');

  const getDoc = require('firebase/firestore').getDoc;
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ admin: true }),
  });

  const getDocs = require('firebase/firestore').getDocs;
  getDocs.mockResolvedValue({ forEach: () => {} });

  render(<AdminDashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(/Logout/i));

  await waitFor(() => {
    expect(mockedNavigate).toHaveBeenCalledWith('/admin/login');
  });
});
