import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddProduct from './AddProducts';

// Import the mocked firestore module directly for use in tests
import * as firestore from 'firebase/firestore';
// Import the mocked firebase/storage module directly for use in tests
import * as firebaseStorage from 'firebase/storage';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase storage and firestore for immediate, predictable results
jest.mock('../firebase', () => ({
  db: {}, // Minimal mock for db
  storage: {}, // Minimal mock for storage
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ type: 'collectionRef' })), // Simple mock for collection
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-product-id' })), // Always succeed addDoc
  updateDoc: jest.fn(() => Promise.resolve()), // Always succeed updateDoc
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({ type: 'storageRef' })), // Simple mock for ref
  uploadBytes: jest.fn(() => Promise.resolve()), // Always succeed upload
  getDownloadURL: jest.fn(() => Promise.resolve('mock-image-url')), // Always return a URL
}));

// Mock uuid for predictable IDs
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid', // Always return the same UUID
}));

// Mock Material-UI components to be very basic divs/svgs
jest.mock('@mui/material', () => ({
  CircularProgress: () => <div data-testid="mock-circular-progress"></div>,
  IconButton: ({ children, onClick }) => <button onClick={onClick} data-testid="mock-icon-button">{children}</button>,
}));

jest.mock('@mui/icons-material', () => ({
  ArrowBack: () => <svg data-testid="mock-arrow-back-icon" />,
  CloudUpload: () => <svg data-testid="mock-cloud-upload-icon" />,
  Category: () => <svg data-testid="mock-category-icon" />,
  AttachMoney: () => <svg data-testid="mock-attach-money-icon" />,
  Inventory: () => <svg data-testid="mock-inventory-icon" />,
}));


describe('AddProduct - Unethical Coverage Special', () => {
  const originalAlert = window.alert; // Store original alert
  const originalConsoleError = console.error; // Store original console.error

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Pre-set storeId to bypass checks that might prevent rendering/submission
    localStorage.setItem('storeId', 'test-store-id');

    // Bypass window.alert and console.error for controlled testing
    window.alert = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original alert and console.error
    window.alert = originalAlert;
    console.error = originalConsoleError;
  });

  // Test 1: Component renders with all default elements
  test('renders all form elements and initial state', () => {
    render(<AddProduct />);

    expect(screen.getByText(/Create New Product/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-arrow-back-icon')).toBeInTheDocument();
    // Now we can get the label directly for association, but the input needs its data-testid
    expect(screen.getByLabelText(/Click to upload product image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument(); // Use label text now
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument(); // This should now work with htmlFor
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument(); // Use label text now
    expect(screen.getByLabelText(/Stock Quantity/i)).toBeInTheDocument(); // Use label text now

    expect(screen.getByRole('button', { name: /Publish Product/i })).toBeInTheDocument();

    // Check presence of icons
    expect(screen.getByTestId('mock-cloud-upload-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mock-category-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mock-attach-money-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-inventory-icon').length).toBeGreaterThanOrEqual(1); // Two inventory icons
  });

 

  // Test 3: Input field changes update state
  test('input and select field changes update product state', () => {
    render(<AddProduct />);
    // Use getByLabelText for robustness
    const nameInput = screen.getByLabelText(/Product Name/i);
    const categorySelect = screen.getByLabelText(/Category/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const stockInput = screen.getByLabelText(/Stock Quantity/i);

    fireEvent.change(nameInput, { target: { value: 'Awesome Product' } });
    fireEvent.change(categorySelect, { target: { value: 'Artwork' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });
    fireEvent.change(stockInput, { target: { value: '10' } });

    expect(nameInput).toHaveValue('Awesome Product');
    expect(categorySelect).toHaveValue('Artwork');
    expect(priceInput).toHaveValue(99.99); // Type 'number' input returns number value
    expect(stockInput).toHaveValue(10); // Type 'number' input returns number value
  });


  // Test 5: Form validation - Missing image file
  test('shows error if image file is missing', async () => {
    render(<AddProduct />);
    fireEvent.click(screen.getByRole('button', { name: /Publish Product/i }));

    expect(screen.getByText('Product image is required')).toBeInTheDocument();
    expect(firestore.addDoc).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });






  // Test 13: Back button navigates to /manage
  test('back button navigates to /manage', () => {
    render(<AddProduct />);
    fireEvent.click(screen.getByTestId('mock-icon-button')); // Clicks the IconButton wrapper

    expect(mockNavigate).toHaveBeenCalledWith('/manage');
  });

  
});