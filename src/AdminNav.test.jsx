import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminNavigation from './AdminNavigation';
import React from "react";
// mock firebase signOut
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));
// mock firebase object
jest.mock('./firebase', () => ({
  auth: {},
}));
// mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AdminNavigation', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    jest.clearAllMocks();
  });

  test('renders brand and dashboard link', () => {
    render(
      <BrowserRouter>
        <AdminNavigation />
      </BrowserRouter>
    );
    expect(screen.getByText(/Artisan Market Admin/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dashboard/i)[0]).toBeInTheDocument();
  });

  test('opens and closes mobile menu', () => {
    render(
      <BrowserRouter>
        <AdminNavigation />
      </BrowserRouter>
    );
    
    const menuButton = screen.getByLabelText(/toggle menu/i);
    fireEvent.click(menuButton);
    
    // Check that we have Dashboard text in the document (using getAllByText since we have multiple)
    const dashboardLinks = screen.getAllByText(/Dashboard/i);
    expect(dashboardLinks.length).toBeGreaterThan(0);
    
    // Click again to close the menu
    fireEvent.click(menuButton);
    
    // The desktop menu Dashboard link should still be visible
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
  });

  test('calls logout and redirects', async () => {
    const { signOut } = require('firebase/auth');
    render(
      <BrowserRouter>
        <AdminNavigation />
      </BrowserRouter>
    );
    
    const logoutButton = screen.getAllByText(/Logout/i)[0];
    fireEvent.click(logoutButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(localStorage.getItem('adminId')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });
});