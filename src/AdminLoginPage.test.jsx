// src/components/AdminLoginPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminLoginPage from './AdminLoginPage';

// --- Mocks ---

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth and firestore
// We use a pattern to import and then mock specific functions from 'firebase/auth' and 'firebase/firestore'
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

jest.mock('./firebase', () => ({
  auth: { currentUser: null }, // Mock initial auth state
  provider: {}, // Mock provider object
  db: {}, // Mock db object
}));

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Material-UI CircularProgress
jest.mock('@mui/material', () => ({
  CircularProgress: (props) => <section {...props} data-testid="mock-circular-progress" />,
}));

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AdminLoginPage', () => {
  const originalError = console.error; // Store original console.error

  beforeAll(() => {
    // Suppress console.error during tests, as we expect some errors (e.g., login failure)
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    localStorageMock.clear(); // Clear localStorage mock state
  });

  // --- Initial Rendering Tests ---

  test('renders initial login page elements', () => {
    render(<AdminLoginPage />);

    expect(screen.getByText('Artisan Market')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByTestId('market-logo')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-button')).toBeInTheDocument();
    expect(screen.getByText('Login as Admin')).toBeInTheDocument();
    expect(screen.getByTestId('home-button')).toBeInTheDocument();
    expect(screen.getByText('← Back to Home')).toBeInTheDocument();
    expect(screen.getByText('Only authorized administrators can access this portal.')).toBeInTheDocument();
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument(); // No error initially
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument(); // No spinner initially
  });

  // --- Loading State Tests ---

  

  // --- Navigation Tests ---

  test('navigates to landing page when "Back to Home" button is clicked', () => {
    render(<AdminLoginPage />);
    fireEvent.click(screen.getByTestId('home-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // --- Admin Login Scenarios ---

  

  

  

  test('login fails due to Firebase error displays generic error message', async () => {
    const firebaseError = new Error('Firebase authentication failed');
    firebaseAuth.signInWithPopup.mockRejectedValueOnce(firebaseError); // Simulate Firebase error

    render(<AdminLoginPage />);
    fireEvent.click(screen.getByTestId('admin-login-button'));

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Admin Login Error:', firebaseError); // Ensure error is logged
      expect(screen.getByTestId('error-message')).toHaveTextContent('Login failed. Please check your internet connection or try again.');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument(); // Spinner gone
    });
  });

  test('error message is cleared on new login attempt', async () => {
    // First, cause an error
    firebaseAuth.signInWithPopup.mockRejectedValueOnce(new Error('Initial error'));
    render(<AdminLoginPage />);
    fireEvent.click(screen.getByTestId('admin-login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Now, simulate a new attempt (even if it fails again, the error should be cleared first)
    firebaseAuth.signInWithPopup.mockResolvedValueOnce({
      user: { uid: 'admin-uid-123', email: 'admin@example.com' },
    });
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ admin: true }),
    });

    fireEvent.click(screen.getByTestId('admin-login-button'));

    // The error message should disappear after the click, before new error/success
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'); // Verify it proceeds
    });
  });
});