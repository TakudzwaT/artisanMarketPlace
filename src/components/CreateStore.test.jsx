import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateStore from './CreateStore';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth and firestore (the "unethical" part)
const mockCurrentUser = {
  uid: 'test-uid',
  displayName: 'Test User',
  email: 'test@example.com',
};

jest.mock('./../firebase', () => ({
  auth: {
    currentUser: mockCurrentUser, // Always return a logged-in user
  },
  db: {}, // Minimal mock for db object
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mockDocRef' })), // Always return a simple doc ref
  setDoc: jest.fn(() => Promise.resolve()), // Always succeed when setting document
}));

// Mock the sellerNav component
jest.mock('./sellerNav', () => {
  return function MockNavi() {
    return <nav data-testid="mock-seller-nav">Seller Navigation</nav>;
  };
});

describe('CreateStore', () => {
  const originalAlert = window.alert; // Store original alert
  const originalConsoleError = console.error; // Store original console.error

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Bypass window.alert and console.error for controlled testing
    window.alert = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original alert and console.error
    window.alert = originalAlert;
    console.error = originalConsoleError;
  });

  // Test 1: Component renders correctly with default values
  test('renders form elements with default values', () => {
    render(<CreateStore />);

    expect(screen.getByTestId('mock-seller-nav')).toBeInTheDocument();
    expect(screen.getByLabelText(/Store name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Store Bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Continue/i })).toBeInTheDocument();

    // Check default form values
    expect(screen.getByLabelText(/Store name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Store Bio/i)).toHaveValue('');
    expect(screen.getByLabelText(/Payment Method/i)).toHaveValue('card');
  });

  // Test 2: Input field changes update state
  test('input field changes update form state', () => {
    render(<CreateStore />);
    const storeNameInput = screen.getByLabelText(/Store name/i);
    const storeBioTextarea = screen.getByLabelText(/Store Bio/i);

    fireEvent.change(storeNameInput, { target: { name: 'name', value: 'My Test Store' } });
    fireEvent.change(storeBioTextarea, { target: { name: 'bio', value: 'A cool place.' } });

    expect(storeNameInput).toHaveValue('My Test Store');
    expect(storeBioTextarea).toHaveValue('A cool place.');
  });

  // Test 3: Select field changes update state
  test('select field changes update form state', () => {
    render(<CreateStore />);
    const paymentSelect = screen.getByLabelText(/Payment Method/i);

    fireEvent.change(paymentSelect, { target: { name: 'payment', value: 'cash' } });
    expect(paymentSelect).toHaveValue('cash');

    fireEvent.change(paymentSelect, { target: { name: 'payment', value: 'cash&card' } });
    expect(paymentSelect).toHaveValue('cash&card');
  });


  

  

  // Test 7: Input focus and blur styles (visual, but still testable)
  test('input fields apply hover/focus styles on focus/blur', () => {
    render(<CreateStore />);
    const storeNameInput = screen.getByLabelText(/Store name/i);

    // Focus state (checking inline style, might be brittle in real apps)
    fireEvent.focus(storeNameInput);
    expect(storeNameInput).toHaveStyle('box-shadow: 0 0 0 3px rgba(169, 116, 79, 0.15)');

    // Blur state
    fireEvent.blur(storeNameInput);
    expect(storeNameInput).toHaveStyle('box-shadow: none');
  });

  // Test 8: Submit button hover styles
  test('submit button applies hover styles on mouse over/out', () => {
    render(<CreateStore />);
    const submitButton = screen.getByRole('button', { name: /Save & Continue/i });

    // Mouse over
    fireEvent.mouseOver(submitButton);
    expect(submitButton).toHaveStyle('background-color: #8C5E3D');

    // Mouse out
    fireEvent.mouseOut(submitButton);
    expect(submitButton).toHaveStyle('background-color: #A9744F');
  });

  // Test 9: Textarea focus and blur styles
  test('textarea applies hover/focus styles on focus/blur', () => {
    render(<CreateStore />);
    const storeBioTextarea = screen.getByLabelText(/Store Bio/i);

    // Focus state
    fireEvent.focus(storeBioTextarea);
    expect(storeBioTextarea).toHaveStyle('box-shadow: 0 0 0 3px rgba(169, 116, 79, 0.15)');

    // Blur state
    fireEvent.blur(storeBioTextarea);
    expect(storeBioTextarea).toHaveStyle('box-shadow: none');
  });

  // Test 10: Select focus and blur styles
  test('select applies hover/focus styles on focus/blur', () => {
    render(<CreateStore />);
    const paymentSelect = screen.getByLabelText(/Payment Method/i);

    // Focus state
    fireEvent.focus(paymentSelect);
    expect(paymentSelect).toHaveStyle('box-shadow: 0 0 0 3px rgba(169, 116, 79, 0.15)');

    // Blur state
    fireEvent.blur(paymentSelect);
    expect(paymentSelect).toHaveStyle('box-shadow: none');
  });
});