
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navi from './sellerNav'; 

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn(() => Promise.resolve()),
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Navi component', () => {
  it('renders the navigation title', () => {
    renderWithRouter(<Navi />);
    expect(screen.getByText(/Artisan Marketplace/i)).toBeInTheDocument();
  });

  it('renders all desktop links', () => {
    renderWithRouter(<Navi />);
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Store/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/About Us/i)).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    renderWithRouter(<Navi />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('☰');

    fireEvent.click(button);
    expect(button).toHaveTextContent('✕');
    expect(screen.getByTestId('mobile-manage-link')).toBeInTheDocument();


    fireEvent.click(button);
    expect(button).toHaveTextContent('☰');
  });
});
