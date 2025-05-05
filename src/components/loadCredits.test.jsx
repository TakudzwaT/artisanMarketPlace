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
    
    // Set up mocks
    auth.getAuth.mockReturnValue(mockAuth);
    
    // Mock console.error to prevent error logs in test output
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

  test('handles invalid amount input', async () => {
    render(<LoadCredits />);
    
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });
    
    // Test with negative value
    fireEvent.change(input, { target: { value: '-10' } });
    fireEvent.click(button);
    
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    
    // Test with non-numeric value
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(button);
    
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
  });

  test('successfully loads credits when user has no previous credits', async () => {
    // Mock Firestore document references and responses
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
    
    // Check loading state
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 50 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });
    
    // Check that input was cleared
    expect(input.value).toBe('');
  });

  test('successfully adds to existing credits', async () => {
    // Mock Firestore document references and responses
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ credits: 100 }) // User already has 100 credits
    });
    firestore.updateDoc.mockResolvedValue();
    
    render(<LoadCredits />);
    
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });
    
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 150 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });
  });

  test('handles error when loading credits', async () => {
    // Mock Firestore to throw an error
    firestore.doc.mockReturnValue('userDocRef');
    firestore.getDoc.mockRejectedValue(new Error('Database error'));
    
    render(<LoadCredits />);
    
    const input = screen.getByLabelText(/load credits/i);
    const button = screen.getByRole('button', { name: /load/i });
    
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(button);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load credits', expect.any(Error));
      expect(screen.getByText('Error loading credits')).toBeInTheDocument();
    });
  });

  test('handles document that does not exist', async () => {
    // Mock non-existent document
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
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith('userDocRef', { credits: 50 });
      expect(screen.getByText('Successfully loaded R50.00')).toBeInTheDocument();
    });
  });
});