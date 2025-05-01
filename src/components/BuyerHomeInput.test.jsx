import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './BuyerHomeInput';

describe('Input component', () => {
  const mockHandleChange = jest.fn();
  const props = {
    handleChange: mockHandleChange,
    value: 'option1',
    title: 'Option 1',
    name: 'testRadio',
    color: 'red'
  };

  it('renders the input with correct title and attributes', () => {
    render(<Input {...props} />);
    
    const radio = screen.getByRole('radio');
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute('type', 'radio');
    expect(radio).toHaveAttribute('value', 'option1');
    expect(radio).toHaveAttribute('name', 'testRadio');

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('applies the correct background color to the checkmark element', () => {
    render(<Input {...props} />);
    const label = screen.getByText('Option 1').closest('label');
    const checkmark = label?.querySelector('em');
    expect(checkmark).toHaveStyle(`background-color: red`);
  });

  it('calls handleChange when input is changed', () => {
    render(<Input {...props} />);
    const radio = screen.getByRole('radio');
    fireEvent.click(radio);
    expect(mockHandleChange).toHaveBeenCalledTimes(1);
  });
});
