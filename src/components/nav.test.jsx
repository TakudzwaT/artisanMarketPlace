import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from './nav';
import { BrowserRouter } from 'react-router-dom';


jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    signOut: jest.fn(() => Promise.resolve()),
  }));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Navigation component', () => {
  test('renders desktop menu items', () => {
    renderWithRouter(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('mobile menu is not visible by default', () => {
    renderWithRouter(<Navigation />);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  test('toggles mobile menu when button is clicked', () => {
    renderWithRouter(<Navigation />);

    const toggleButton = screen.getByRole('button');
    
    // Initial state: closed
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('☰');

    // Click to open
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('✕');

    // Click to close
    fireEvent.click(toggleButton);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('☰');
  });

  test('mobile menu contains correct links when open', () => {
    renderWithRouter(<Navigation />);
    const toggleButton = screen.getByRole('button');

    fireEvent.click(toggleButton); // Open menu
    const mobileMenu = screen.getByTestId('mobile-menu');

    expect(mobileMenu).toHaveTextContent('Home');
    expect(mobileMenu).toHaveTextContent('Orders');
    expect(mobileMenu).toHaveTextContent('Cart');
    expect(mobileMenu).toHaveTextContent('Logout');
  });
});
