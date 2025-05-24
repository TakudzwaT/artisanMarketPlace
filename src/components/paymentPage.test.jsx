import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentPage from './PaymentPage';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useCart } from '../components/CartContext';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

jest.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
}));
// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user' },
  })),
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'timestamp'),
}));

// Mock CartContext
jest.mock('../components/CartContext', () => ({
  useCart: jest.fn(),
}));

describe('PaymentPage', () => {
  beforeEach(() => {
    // Provide mock cart context values
    useCart.mockReturnValue({
      shoppingCart: [],
      clearCart: jest.fn(),
    });

    // Mock getDoc to return a user with 1000 credits
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ credits: 1000 }),
    });

    doc.mockImplementation((...args) => args.join('/'));
  });

  test('renders payment info and load credits input', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment', state: { totalAmount: 250 } }]}>
        <PaymentPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /payment/i })).toBeInTheDocument();
    expect(screen.getByText(/order total: r250.00/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/your credits: 1000/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/enter credits to load/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load credits/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay with credits/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to cart/i })).toBeInTheDocument();
  });

  test('shows error when invalid credit amount is entered', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment', state: { totalAmount: 100 } }]}>
        <PaymentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/enter credits to load/i);
    fireEvent.change(input, { target: { value: '-5' } });

    fireEvent.click(screen.getByRole('button', { name: /load credits/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid amount to load/i)).toBeInTheDocument();
    });
  });
});
