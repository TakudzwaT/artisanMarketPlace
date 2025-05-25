import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Cart } from './Cart';
import { CartContext } from './CartContext';
import { BrowserRouter } from 'react-router-dom';

const mockCartItem = {
  ProductID: 'product1',
  ProductName: 'Mock Product',
  ProductPrice: 100,
  qty: 2,
  ProductImg: 'test.jpg',
  TotalProductPrice: 200,
};

const mockContextValue = {
  shoppingCart: [mockCartItem],
  totalPrice: 200,
  totalQty: 2,
  dispatch: jest.fn(),
};

const renderWithContext = (contextOverrides = {}) => {
  return render(
    <CartContext.Provider value={{ ...mockContextValue, ...contextOverrides }}>
      <BrowserRouter>
        <Cart user={{ email: 'test@example.com' }} />
      </BrowserRouter>
    </CartContext.Provider>
  );
};

describe('Cart Component', () => {
  

  test('renders empty cart message when cart is empty', () => {
    renderWithContext({ shoppingCart: [], totalPrice: 0, totalQty: 0 });
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('increments quantity', () => {
    renderWithContext();
    const incrementButton = screen.getByLabelText(/increase quantity of mock product/i);
    fireEvent.click(incrementButton);
    expect(mockContextValue.dispatch).toHaveBeenCalledWith({
      type: 'INC',
      id: mockCartItem.ProductID,
      cart: mockCartItem,
    });
  });

  test('decrements quantity if more than 1', () => {
    renderWithContext();
    const decrementButton = screen.getByLabelText(/decrease quantity of mock product/i);
    fireEvent.click(decrementButton);
    expect(mockContextValue.dispatch).toHaveBeenCalledWith({
      type: 'DEC',
      id: mockCartItem.ProductID,
      cart: mockCartItem,
    });
  });

  test('deletes item when delete button is clicked', () => {
    renderWithContext();
    const deleteButton = screen.getByLabelText(/remove mock product from cart/i);
    fireEvent.click(deleteButton);
    expect(mockContextValue.dispatch).toHaveBeenCalledWith({
      type: 'DELETE',
      id: mockCartItem.ProductID,
      cart: mockCartItem,
    });
  });

  test('renders order summary', () => {
    renderWithContext();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/total items: 2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/r\s*200\.00/i).length).toBeGreaterThan(0);
  });

  test('renders checkout and continue shopping buttons', () => {
    renderWithContext();
    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });
});
