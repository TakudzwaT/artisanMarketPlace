import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddProduct from './AddProducts';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

// Mock firebase modules
jest.mock('../firebase', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

// Mock local storage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'test-store-id'),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
});

// Mock the LoadingBar component
jest.mock('./LoadingBar', () => () => <div data-testid="loading-bar" />);

describe('AddProduct', () => {
  test('renders the form with all inputs', () => {
    render(<AddProduct />);
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Image')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Product' })).toBeInTheDocument();
  });

  test('renders form with correct placeholders', () => {
    render(<AddProduct />);
    
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter price (e.g., R250)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter stock quantity')).toBeInTheDocument();
  });

  test('form has required fields', () => {
    render(<AddProduct />);
    
    const nameInput = screen.getByLabelText('Product Name');
    const categoryInput = screen.getByLabelText('Category');
    const priceInput = screen.getByLabelText('Price');
    const stockInput = screen.getByLabelText('Quantity');
    const imageInput = screen.getByLabelText('Product Image');
    
    expect(nameInput).toHaveAttribute('required');
    expect(categoryInput).toHaveAttribute('required');
    expect(priceInput).toHaveAttribute('required');
    expect(stockInput).toHaveAttribute('required');
    expect(imageInput).toHaveAttribute('required');
  });

  test('form has appropriate input types', () => {
    render(<AddProduct />);
    
    expect(screen.getByLabelText('Product Name')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Category')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Price')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Quantity')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Product Image')).toHaveAttribute('type', 'file');
  });
});