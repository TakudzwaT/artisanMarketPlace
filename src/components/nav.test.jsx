import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from './nav.jsx'; // Fixed import to match file name
import { BrowserRouter } from 'react-router-dom';
import { useCart } from './CartContext';

// Mock useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  NavLink: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock CartContext with totalQty property
jest.mock('./CartContext', () => ({
  useCart: jest.fn(),
}));

// Mock react-icons
jest.mock('react-icons/bs', () => ({
  BsCart: () => <div data-testid="cart-icon">Cart</div>
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Navigation component', () => {
  beforeEach(() => {
    // Add totalQty to the mock return value
    useCart.mockReturnValue({
      shoppingCart: [{ id: 1 }, { id: 2 }], // mock 2 items in cart
      totalQty: 2 // Add totalQty to match component implementation
    });
  });

  test('renders desktop menu items including cart with badge', () => {
    renderWithRouter(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Check for cart icon
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    
    // Cart badge count
    expect(screen.getByText('2')).toBeInTheDocument(); // badge showing 2 items
  });

  test('mobile menu is not visible by default', () => {
    renderWithRouter(<Navigation />);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  test('toggles mobile menu when button is clicked', () => {
    renderWithRouter(<Navigation />);
    const toggleButton = screen.getByRole('button', { name: /☰/i });
    
    // Menu closed initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    
    // Open menu
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /✕/i })).toBeInTheDocument();
    
    // Close menu again
    fireEvent.click(screen.getByRole('button', { name: /✕/i }));
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  test('mobile menu contains correct links when open', () => {
    renderWithRouter(<Navigation />);
    const toggleButton = screen.getByRole('button', { name: /☰/i });
    fireEvent.click(toggleButton); // open menu
    
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toContainElement(screen.getAllByText('Home')[1]);
    expect(mobileMenu).toContainElement(screen.getAllByText('Orders')[1]);
    expect(mobileMenu).toContainElement(screen.getAllByTestId('cart-icon')[1]);
    expect(mobileMenu).toContainElement(screen.getAllByText('Logout')[1]);
  });

  test('displays correct number of items in cart badge', () => {
    // Test with empty cart
    useCart.mockReturnValueOnce({
      shoppingCart: [],
      totalQty: 0 // Add totalQty to match component implementation
    });
    
    renderWithRouter(<Navigation />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument(); // No badge
    
    // Rerender with items
    useCart.mockReturnValueOnce({
      shoppingCart: [{ id: 1 }, { id: 2 }, { id: 3 }],
      totalQty: 3 // Add totalQty to match component implementation
    });
    
    renderWithRouter(<Navigation />);
    expect(screen.getByText('3')).toBeInTheDocument(); // Badge with 3 items
  });

  test('logout button calls signOut function', () => {
    const signOut = require('firebase/auth').signOut;
    renderWithRouter(<Navigation />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    expect(signOut).toHaveBeenCalled();
  });
});