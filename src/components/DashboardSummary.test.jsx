import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSummary from '../components/DashboardSummary';

describe('DashboardSummary', () => {
  const defaultProps = {
    totalSales: 10,
    totalRevenue: 1500.50,
    totalItems: 50,
    totalProducts: 5,
    loading: false,
  };

  test('renders summary cards with correct data', () => {
    render(<DashboardSummary {...defaultProps} />);

    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('1500.50')).toBeInTheDocument();

    expect(screen.getByText('Items Sold')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('renders loading spinner and text when loading prop is true', () => {
    render(<DashboardSummary {...defaultProps} loading={true} />);
    expect(screen.getByText('Updating data...')).toBeInTheDocument();
    // Assert on the presence of the spinner section based on its class or a test ID if added
    expect(screen.getByText('Updating data...').closest('section')).toHaveClass('loading-spinner');
    // You could also add a data-testid to the spinner section for a more direct check if needed.
  });

  

  test('formats revenue to two decimal places', () => {
    render(<DashboardSummary {...defaultProps} totalRevenue={1234} />);
    expect(screen.getByText('1234.00')).toBeInTheDocument();

    render(<DashboardSummary {...defaultProps} totalRevenue={99.9} />);
    expect(screen.getByText('99.90')).toBeInTheDocument();
  });
});