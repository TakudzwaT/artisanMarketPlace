import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoadCredits from './LoadCredits';
import * as firestore from 'firebase/firestore';
import * as auth from 'firebase/auth';

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  db: {}
}));

// Mock firebase/auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

// Mock firebase config
jest.mock('../firebase', () => ({
  db: {}
}));

describe('LoadCredits component tests', () => {
  const mockUser = { uid: 'user123' };
  const mockAuth = {
    currentUser: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auth.getAuth.mockReturnValue(mockAuth);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders LoadCredits component correctly', () => {
    render(<LoadCredits />);
    expect(screen.getByLabelText(/load credits/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('R0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  test('handles invalid amount input', () => {
    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '-10' } });
    fireEvent.click(button);
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(button);
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
  });

  test('successfully loads credits when user has no previous credits', async () => {
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Test User' }) // No credits field
    });
    firestore.updateDoc.mockResolvedValue();

    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 50 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });

    expect(input.value).toBe('');
  });

  test('successfully adds to existing credits under the cap', async () => {
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ credits: 100 })
    });
    firestore.updateDoc.mockResolvedValue();

    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 150 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });
  });

  test('prevents loading if total exceeds 10,000 credits', async () => {
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ credits: 9990 })
    });

    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '20' } }); // Would exceed the cap
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Cannot load more than 10,000 credits')).toBeInTheDocument();
    });

    expect(firestore.updateDoc).not.toHaveBeenCalled();
  });

  test('handles error when loading credits', async () => {
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockRejectedValue(new Error('Database error'));

    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load credits', expect.any(Error));
      expect(screen.getByText('Error loading credits')).toBeInTheDocument();
    });
  });

  test('handles non-existent user document', async () => {
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });
    firestore.updateDoc.mockResolvedValue();

    render(<LoadCredits />);
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 50 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });
  });
});
