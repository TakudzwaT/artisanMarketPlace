// src/components/__tests__/OrderCard.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderCard from './OrderCard';

describe('OrderCard', () => {
  const props = {
    description: 'Cool Sneakers',
    price: '499.99',
    date: '2025-05-25',
    OrderID: 'order123456789',
    ProductID: 'prod123',
    Img: 'https://example.com/sneaker.jpg',
    status: 'Delivered',
    shopName: 'Sneaker Shop',
  };

  beforeEach(() => {
    render(<OrderCard {...props} />);
  });

  test('renders product image with correct alt text', () => {
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', props.Img);
    expect(img).toHaveAttribute('alt', props.description);
  });

  test('displays the correct order status and class', () => {
    const statusElement = screen.getByText(props.status);
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass(`status-${props.status.toLowerCase()}`);
  });

  test('renders shop name and product name', () => {
    expect(screen.getByText(props.shopName)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.description);
  });

  test('shows formatted price with two decimals', () => {
    expect(screen.getByText('R499.99')).toBeInTheDocument();
  });

  test('displays order date and datetime attribute', () => {
    const time = screen.getByText(props.date);
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', props.date);
  });

  test('shows truncated OrderID', () => {
    expect(screen.getByText(`Order #${props.OrderID.substring(0, 8)}`)).toBeInTheDocument();
  });
});
