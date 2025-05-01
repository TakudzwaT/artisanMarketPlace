import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuyerHomeCard from './BuyerHomeCard';

// Mock the hooks and components
jest.mock('./CartContext', () => ({
  useCart: () => ({
    dispatch: jest.fn(),
    shoppingCart: []
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

// Mock the react-icons
jest.mock('react-icons/bs', () => ({
  BsFillBagFill: () => <div data-testid="bag-icon" />,
  BsCart: () => <div data-testid="cart-icon" />
}));

describe('BuyerHomeCard', () => {
  test('renders the component with product information', () => {
    render(
      <BuyerHomeCard 
        img="/test-image.jpg"
        title="Test Product"
        newPrice="$19.99"
        product={{ id: 123 }}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    const img = screen.getByAltText('Test Product');
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  test('renders with default values when props are missing', () => {
    render(<BuyerHomeCard />);
    
    expect(screen.getByText('Product')).toBeInTheDocument();
    const img = screen.getByAltText('Product');
    expect(img).toHaveAttribute('src', '/placeholder.jpg');
  });

  test('has add to cart button', () => {
    render(<BuyerHomeCard title="Test Product" />);
    
    expect(screen.getByLabelText('Add to cart')).toBeInTheDocument();
    expect(screen.getByTestId('bag-icon')).toBeInTheDocument();
  });

  test('has view cart button', () => {
    render(<BuyerHomeCard />);
    
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
  });
});