import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Category from './Category';

describe('Category Component', () => {
  const mockHandleChange = jest.fn();
  const selectedValue = 'Ceramics';

  beforeEach(() => {
    render(
      <Category 
        handleChange={mockHandleChange} 
        selectedValue={selectedValue} 
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'category-heading');
    expect(screen.getByText('Category')).toHaveAttribute('id', 'category-heading');
    expect(screen.getByText('Select an item category')).toHaveClass('sr-only');
  });

  it('renders all category options', () => {
    expect(screen.getByLabelText('All')).toBeInTheDocument();
    expect(screen.getByLabelText('Ceramics')).toBeInTheDocument();
    expect(screen.getByLabelText('Jewelry')).toBeInTheDocument();
    expect(screen.getByLabelText('Textile')).toBeInTheDocument();
    expect(screen.getByLabelText('Woodwork')).toBeInTheDocument();
    expect(screen.getByLabelText('other')).toBeInTheDocument();
  });

  it('shows the correct option as checked based on selectedValue', () => {
    expect(screen.getByLabelText('Ceramics')).toBeChecked();
    expect(screen.getByLabelText('All')).not.toBeChecked();
    expect(screen.getByLabelText('Jewelry')).not.toBeChecked();
  });

  it('calls handleChange when an option is clicked', () => {
    fireEvent.click(screen.getByLabelText('Jewelry'));
    expect(mockHandleChange).toHaveBeenCalledTimes(1);
  });

  it('renders the Input components with correct props', () => {
    const ceramicsInput = screen.getByLabelText('Ceramics');
    expect(ceramicsInput).toHaveAttribute('value', 'Ceramics');
    expect(ceramicsInput).toHaveAttribute('name', 'category');
    expect(ceramicsInput).toBeChecked();
  });

  it('renders the custom radio button correctly', () => {
    const allRadio = screen.getByLabelText('All');
    expect(allRadio).toHaveAttribute('type', 'radio');
    expect(allRadio).toHaveAttribute('value', '');
    expect(allRadio.nextSibling).toHaveClass('checkmark');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <Category 
        handleChange={mockHandleChange} 
        selectedValue={selectedValue} 
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});