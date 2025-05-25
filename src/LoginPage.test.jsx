import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers like .toBeInTheDocument()
import AdminLoginPage from './AdminLoginPage'; // Adjust path if necessary

// --- Mocking Dependencies ---

// 1. Mock 'firebase/auth' and 'firebase/firestore' at the top level.
//    Jest hoists these mocks, so they are available before imports.
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(), // Will be imported directly below
  signOut: jest.fn(),         // Will be imported directly below
  GoogleAuthProvider: jest.fn(() => ({})), // Mock the provider class/constructor
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})), // doc needs to return an object for chaining (even if empty)
  getDoc: jest.fn(),         // Will be imported directly below
}));

// 2. Mock your local './firebase' file.
//    This is crucial because your AdminLoginPage component imports from './firebase'.
//    We ensure it exports *objects* that *could* hold Firebase methods,
//    even if the methods themselves are mocked from their original modules.
jest.mock('./firebase', () => ({
  auth: {},     // The component imports 'auth' from here. Jest will ensure
                // that any methods on 'auth' (like signInWithPopup) are
                // resolved to the mocks defined in 'firebase/auth' mock.
  provider: {}, // Same for provider
  db: {},       // Same for db
}));

// 3. Import the mocked functions directly *after* mocking their modules.
//    This is the key to ensuring you're working with the Jest mock functions.
import { signInWithPopup, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// Mock react-router-dom's useNavigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedUseNavigate,
}));

// Mock localStorage
const localStorageMock = {
  setItem: jest.fn(),
  getItem: jest.fn(), // If your component uses getItem, mock it too
  removeItem: jest.fn(),
  clear: jest.fn(),   // If your component uses clear, mock it too
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true, // Allow redefining if needed, though not strictly necessary here
  configurable: true, // Allow reconfiguring if needed
});

// Mock console.error to prevent it from cluttering test output
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// --- Test Suite ---

describe('AdminLoginPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure isolation
    jest.clearAllMocks();

    // Set default mock resolutions for Firebase functions that are called
    // (these can be overridden with .mockResolvedValueOnce for specific tests)

    // Default successful sign-in popup result
    signInWithPopup.mockResolvedValue({
      user: {
        uid: 'test-admin-uid',
        email: 'test-admin@example.com',
      },
    });

    // Default getDoc mock: user exists and IS an admin
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ admin: true }),
    });

    // Reset localStorage mocks
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Reset navigate mock
    mockedUseNavigate.mockClear();

    // Reset console.error spy
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    // Restore console.error after all tests are done
    consoleErrorSpy.mockRestore();
  });

  test('renders login page correctly', () => {
    render(<AdminLoginPage />);

    expect(screen.getByText('Artisan Market')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
  });

  test('shows loading state during admin login attempt', async () => {
    // Make signInWithPopup never resolve to observe the persistent loading state
    signInWithPopup.mockReturnValue(new Promise(() => {}));

    render(<AdminLoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Login as Admin/i }));

    // Wait for the UI to update to the loading state
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });

    // To prevent unhandled promise rejection warnings in subsequent tests,
    // if a promise is returned but not resolved/rejected in the test,
    // explicitly resolve it here or use a resolved value.
    // For this test, it's fine since we are just checking the loading state.
    // However, if the test ends without resolving the promise, Jest might complain.
    // A simpler approach for the end of the test would be:
    // signInWithPopup.mockResolvedValue({}); // Reset for next tests, or mockRestore()
  });

  

  

  

  

  test('navigates to landing page when Back to Home is clicked', () => {
    render(<AdminLoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/');
  });
});