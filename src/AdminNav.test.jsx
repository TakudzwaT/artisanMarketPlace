// src/components/AdminNavigation.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminNavigation from './AdminNavigation';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>, // Mock Link as a simple anchor
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
jest.mock('./firebase', () => ({
  auth: {}, // Mock auth object
}));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(), // Mock signOut function
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});


describe('AdminNavigation', () => {
  const originalError = console.error; // Store original console.error
  const originalInnerWidth = window.innerWidth; // Store original window.innerWidth

  beforeAll(() => {
    console.error = jest.fn(); // Suppress console.error during tests
  });

  afterAll(() => {
    console.error = originalError; // Restore original console.error
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage mocks for each test
    localStorageMock.clear();
    localStorageMock.removeItem.mockClear(); // Clear specific removeItem mock
    localStorageMock.setItem.mockClear();

    // Default to desktop view for most tests
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  afterEach(() => {
    // Restore original innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });

  // --- Rendering Tests ---

  test('renders brand link correctly', () => {
    render(<AdminNavigation />);
    const brandLink = screen.getByTestId('brand-link');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveTextContent('Artisan Market Admin');
    expect(brandLink).toHaveAttribute('href', '/admin/dashboard');
  });

  test('renders desktop menu and hides mobile menu on large screens', () => {
    render(<AdminNavigation />); // Default innerWidth is 1024 (desktop)

    expect(screen.getByTestId('desktop-menu')).toBeVisible(); // Desktop menu is visible
    expect(screen.getByTestId('desktop-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-logout')).toBeInTheDocument();

    expect(screen.queryByTestId('menu-toggle')).not.toBeInTheDocument(); // Hamburger button not in DOM
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument(); // Mobile menu not in DOM
  });

  test('renders mobile menu toggle button and hides desktop menu on small screens', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 }); // Simulate mobile
    render(<AdminNavigation />);

    expect(screen.queryByTestId('desktop-menu')).not.toBeInTheDocument(); // Desktop menu not in DOM
    expect(screen.getByTestId('menu-toggle')).toBeVisible(); // Hamburger visible

    // Mobile menu starts closed (not rendered until toggled)
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  // --- Mobile Menu Interaction Tests ---

  test('toggles mobile menu visibility when hamburger button is clicked', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 }); // Simulate mobile
    render(<AdminNavigation />);

    const menuToggleButton = screen.getByTestId('menu-toggle');

    // Menu starts closed (not in DOM)
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    expect(menuToggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    fireEvent.click(menuToggleButton);
    await waitFor(() => { // Wait for state update to re-render mobile menu
      expect(screen.getByTestId('mobile-menu')).toBeVisible();
      expect(screen.getByTestId('mobile-menu')).toHaveClass('open'); // Ensure it has the 'open' class
    });
    expect(menuToggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mobile-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-logout')).toBeInTheDocument();

    // Close menu
    fireEvent.click(menuToggleButton);
    await waitFor(() => { // Wait for state update to remove mobile menu
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
    expect(menuToggleButton).toHaveAttribute('aria-expanded', 'false');
  });


  // --- Logout Functionality Tests ---

  test('calls signOut, removes items from localStorage, and navigates on successful desktop logout', async () => {
    signOut.mockResolvedValueOnce(); // Mock successful signOut
    render(<AdminNavigation />);

    const desktopLogoutButton = screen.getByTestId('desktop-logout');
    fireEvent.click(desktopLogoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminId'); // Use the mock
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminEmail'); // Use the mock
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  test('calls signOut, removes items from localStorage, navigates, and closes menu on successful mobile logout', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 }); // Simulate mobile
    signOut.mockResolvedValueOnce(); // Mock successful signOut
    render(<AdminNavigation />);

    fireEvent.click(screen.getByTestId('menu-toggle')); // Open mobile menu
    await waitFor(() => { expect(screen.getByTestId('mobile-menu')).toBeVisible(); });

    const mobileLogoutButton = screen.getByTestId('mobile-logout');
    fireEvent.click(mobileLogoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminId'); // Use the mock
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminEmail'); // Use the mock
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument(); // Ensure menu closes by being removed
    });
  });


  test('logs error on logout failure (desktop)', async () => {
    const logoutError = new Error('Logout failed');
    signOut.mockRejectedValueOnce(logoutError); // Mock failed signOut
    render(<AdminNavigation />);

    fireEvent.click(screen.getByTestId('desktop-logout'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(console.error).toHaveBeenCalledWith("Logout error:", logoutError);
      // Ensure navigation and localStorage removals are NOT called on failure
      expect(localStorageMock.removeItem).not.toHaveBeenCalled(); // Use the mock
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('logs error on logout failure (mobile)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 }); // Simulate mobile
    const logoutError = new Error('Mobile logout failed');
    signOut.mockRejectedValueOnce(logoutError); // Mock failed signOut
    render(<AdminNavigation />);

    fireEvent.click(screen.getByTestId('menu-toggle')); // Open mobile menu
    await waitFor(() => { expect(screen.getByTestId('mobile-menu')).toBeVisible(); });

    fireEvent.click(screen.getByTestId('mobile-logout'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(console.error).toHaveBeenCalledWith("Logout error:", logoutError);
      expect(localStorageMock.removeItem).not.toHaveBeenCalled(); // Use the mock
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument(); // Menu should still close even if logout fails by being removed
    });
  });
});