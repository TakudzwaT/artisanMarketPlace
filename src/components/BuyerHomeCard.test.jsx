// src/components/__tests__/BuyerHomeCard.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BuyerHomeCard from './BuyerHomeCard';

// Mock Firebase entirely
jest.mock('../firebase', () => ({
  db: {}
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

// Mock CartContext
jest.mock('./CartContext', () => ({
  useCart: jest.fn()
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Import the mocked functions
import { getAuth } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useCart } from './CartContext';

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BuyerHomeCard', () => {
  const mockProduct = {
    id: 'test-product-1',
    storeId: 'test-store-1',
    name: 'Test Product',
    imageUrl: 'https://example.com/image.jpg',
    price: 99.99,
    prevPrice: 149.99
  };

  const mockAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    useCart.mockReturnValue({
      addToCart: mockAddToCart
    });
    
    getAuth.mockReturnValue({
      currentUser: { uid: 'test-user' }
    });
    
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ stock: 10 })
    });
  });

  test('renders product information correctly', async () => {
    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    // Check product name
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    
    // Check image
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Product');
    
    // Check prices
    expect(screen.getByText('R149.99')).toBeInTheDocument(); // prevPrice
    expect(screen.getByText('R99.99')).toBeInTheDocument(); // price
    
    // Wait for stock to load
    await waitFor(() => {
      expect(screen.getByText('In stock: 10')).toBeInTheDocument();
    });
  });

  test('shows out of stock when stock is 0', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ stock: 0 })
    });

    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Out of stock')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).toBeDisabled();
  });

  test('navigates to login when user is not authenticated', async () => {
    getAuth.mockReturnValue({
      currentUser: null
    });

    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('In stock: 10')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    
    act(() => {
      fireEvent.click(addButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  test('adds product to cart when user is authenticated', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('In stock: 10')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    
    act(() => {
      fireEvent.click(addButton);
    });

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
    expect(screen.getByText('Added to cart successfully!')).toBeInTheDocument();

    // Fast-forward time to hide success message
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Added to cart successfully!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('handles missing product data gracefully', async () => {
    render(
      <TestWrapper>
        <BuyerHomeCard product={{}} />
      </TestWrapper>
    );

    expect(screen.getByText('Product')).toBeInTheDocument();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/placeholder.jpg');
  });

  test('handles missing stock data gracefully', async () => {
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });

    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    // Should still render the product without stock info
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    
    // Stock should not be displayed when document doesn't exist
    await waitFor(() => {
      expect(screen.queryByText(/In stock:/)).not.toBeInTheDocument();
    });
  });

  test('product link points to correct URL', () => {
    render(
      <TestWrapper>
        <BuyerHomeCard product={mockProduct} />
      </TestWrapper>
    );

    const productLink = screen.getByRole('link');
    expect(productLink).toHaveAttribute('href', '/product/test-product-1');
  });
});