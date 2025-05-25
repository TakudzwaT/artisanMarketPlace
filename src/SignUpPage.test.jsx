import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from './SignupPage';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase module at the top level
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})), // doc needs to return an object for subsequent calls
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock your local './firebase' file, which exports auth, provider, and db.
jest.mock('./firebase', () => ({
  auth: {},     // Mock auth object
  provider: {}, // Mock provider object
  db: {},       // Mock db object
}));

// Import the mocked functions so we can control them in tests
import { signInWithPopup } from 'firebase/auth';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';

describe('SignupPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock for signInWithPopup to resolve successfully
    signInWithPopup.mockResolvedValue({
      user: {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      },
    });

    // Default mock for getDoc to simulate user not existing
    getDoc.mockResolvedValue({
      exists: () => false,
    });

    setDoc.mockResolvedValue();
    updateDoc.mockResolvedValue();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  test('renders signup page with role selection buttons', () => {
    render(<SignupPage />);

    expect(screen.getByText('Join Artisan Market')).toBeInTheDocument();
    expect(screen.getByText('Choose your role to get started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue as Buyer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue as Seller/i })).toBeInTheDocument();
  });

  
  test('handles successful buyer signup (new user)', async () => {
    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Buyer/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        {}, // Mocked doc ref, actual value depends on how doc is mocked
        expect.objectContaining({
          uid: 'test-uid',
          name: 'Test User',
          email: 'test@example.com',
          buyer: true,
          seller: false,
        })
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', 'test-uid');
      expect(mockNavigate).toHaveBeenCalledWith('/buyer');
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign-up failed.')).not.toBeInTheDocument();
    });
  });

  test('handles successful seller signup (new user)', async () => {
    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Seller/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        {}, // Mocked doc ref
        expect.objectContaining({
          uid: 'test-uid',
          name: 'Test User',
          email: 'test@example.com',
          buyer: false,
          seller: true,
        })
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith('storeId', 'test-uid');
      expect(mockNavigate).toHaveBeenCalledWith('/createStore');
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign-up failed.')).not.toBeInTheDocument();
    });
  });

  test('handles existing user and updates buyer role', async () => {
    // Mock getDoc to simulate user existing for this specific test
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ uid: 'test-uid', name: 'Test User' }),
    });

    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Buyer/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        {}, // Mocked doc ref
        { buyer: true }
      );
      expect(setDoc).not.toHaveBeenCalled(); // Should not call setDoc for existing user
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', 'test-uid');
      expect(mockNavigate).toHaveBeenCalledWith('/buyer');
    });
  });

  test('handles existing user and updates seller role', async () => {
    // Mock getDoc to simulate user existing for this specific test
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ uid: 'test-uid', name: 'Test User' }),
    });

    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Seller/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        {}, // Mocked doc ref
        { seller: true }
      );
      expect(setDoc).not.toHaveBeenCalled(); // Should not call setDoc for existing user
      expect(window.localStorage.setItem).toHaveBeenCalledWith('storeId', 'test-uid');
      expect(mockNavigate).toHaveBeenCalledWith('/createStore');
    });
  });

  test('displays error message on signup failure', async () => {
    const errorMessage = 'Firebase: Error (auth/popup-closed-by-user).';
    signInWithPopup.mockRejectedValueOnce(new Error(errorMessage));

    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Buyer/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue as Buyer/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Continue as Seller/i })).not.toBeDisabled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('displays generic error message if error is not an Error object', async () => {
    signInWithPopup.mockRejectedValueOnce('Something went wrong!'); // Reject with a string

    render(<SignupPage />);

    fireEvent.click(screen.getByRole('button', { name: /Continue as Buyer/i }));

    await waitFor(() => {
      expect(screen.getByText('Sign-up failed. Please try again.')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});