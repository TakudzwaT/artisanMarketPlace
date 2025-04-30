import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './BuyerHomeButton';

describe('Button component', () => {
  const mockClickHandler = jest.fn();

  beforeEach(() => {
    render(<Button onClickHandler={mockClickHandler} value="test-value" title="Click Me" />);
  });

  it('renders with the correct title', () => {
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('calls the onClickHandler when clicked', () => {
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(mockClickHandler).toHaveBeenCalledTimes(1);
  });

  it('has the correct value attribute', () => {
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveAttribute('value', 'test-value');
  });
});
