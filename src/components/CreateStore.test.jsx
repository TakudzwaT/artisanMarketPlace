import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateStore from './CreateStore';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => <div>{children}</div>
}));

// Mock Firebase imports as no-ops
jest.mock('./../firebase', () => ({
  auth: { currentUser: { uid: '123', displayName: 'Test User', email: 'test@example.com' } },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: () => ({}),
  setDoc: () => Promise.resolve()
}));

describe('CreateStore (logic only, no Firebase)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the form fields', () => {
    render(<CreateStore />, { wrapper: MemoryRouter });

    expect(screen.getByLabelText(/store name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/store bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pick-up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/local delivery/i)).toBeInTheDocument();
  });

  it('updates the store name field', () => {
    render(<CreateStore />, { wrapper: MemoryRouter });

    const input = screen.getByLabelText(/store name/i);
    fireEvent.change(input, { target: { value: 'Crafty Corner' } });

    expect(input.value).toBe('Crafty Corner');
  });

  it('toggles delivery options', () => {
    render(<CreateStore />, { wrapper: MemoryRouter });

    const pickup = screen.getByLabelText(/pick-up/i);
    fireEvent.click(pickup);
    expect(pickup.checked).toBe(true);

    fireEvent.click(pickup);
    expect(pickup.checked).toBe(false);
  });

  it('submits form and navigates (logic only)', async () => {
    render(<CreateStore />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByLabelText(/store name/i), {
      target: { value: 'Crafty Market' }
    });

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));

    // Assume navigation happens (mocked behavior)
    expect(mockNavigate).toHaveBeenCalled();
  });
});
