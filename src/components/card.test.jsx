import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from './card';
import React from 'react';

describe('Card component', () => {
  const defaultProps = {
    OrderID: '1234567890abcdef',
    shopName: 'Test Store',
    status: 'Ready',
    date: '2025-05-01',
    description: 'Test Product Description',
    price: '199.99',
    Img: 'https://via.placeholder.com/150'
  };

  it('renders without crashing', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText(/Order #12345678/i)).toBeInTheDocument();
  });

  it('displays the shop name', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText(/from Test Store/i)).toBeInTheDocument();
  });

  it('displays the correct status', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
  });

  it('displays the price correctly', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText(/R199.99/i)).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    render(<Card />);
    expect(screen.getByText(/Order #Unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    expect(screen.getByText(/Unknown date/i)).toBeInTheDocument();
    expect(screen.getByText(/R0/i)).toBeInTheDocument();
    expect(screen.getByText(/Product/i)).toBeInTheDocument();
  });
});
