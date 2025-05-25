import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesTable from '../components/SalesTable';
import { format } from 'date-fns';

// Mock the DateFilter component as it's a child
jest.mock('./DateFilter', () => ({ startDate, endDate, handleStartDateChange, handleEndDateChange, applyDateFilter, resetDateFilter }) => (
  <section data-testid="mock-date-filter">
    <input type="date" value={startDate} onChange={handleStartDateChange} data-testid="mock-start-date" />
    <input type="date" value={endDate} onChange={handleEndDateChange} data-testid="mock-end-date" />
    <button onClick={applyDateFilter} data-testid="mock-apply-filter">Apply</button>
    <button onClick={resetDateFilter} data-testid="mock-reset-filter">Reset</button>
  </section>
));

describe('SalesTable', () => {
  const mockSales = [
    {
      id: 'order123',
      items: {
        itemA: { productId: 'p1', storeId: 'seller1', name: 'Handmade Necklace', qty: 1, price: 50.00, total: 50.00 },
        itemB: { productId: 'p2', storeId: 'seller1', name: 'Ceramic Mug', qty: 2, price: 15.00, total: 30.00 },
      },
      purchasedAt: { toDate: () => new Date('2023-04-01T12:00:00Z') },
      createdAt: { toDate: () => new Date('2023-04-01T11:50:00Z') }, // Example for createdAt
    },
    {
      id: 'order456',
      items: {
        itemC: { productId: 'p3', storeId: 'seller1', name: 'Leather Wallet', qty: 1, price: 75.00, total: 75.00 },
        itemD: { productId: 'p4', storeId: 'otherSeller', name: 'Other Item', qty: 1, price: 10.00, total: 10.00 },
      },
      purchasedAt: { toDate: () => new Date('2023-03-10T09:00:00Z') },
    },
    {
      id: 'order789',
      items: {
        itemE: { productId: 'p5', storeId: 'seller1', name: 'Wool Scarf', qty: 3, price: 25.00, total: 75.00, },
      },
      createdAt: new Date('2023-02-20T14:30:00Z'), // Example for createdAt as Date object
    },
  ];

  const defaultProps = {
    sales: mockSales,
    startDate: '',
    endDate: '',
    handleStartDateChange: jest.fn(),
    handleEndDateChange: jest.fn(),
    applyDateFilter: jest.fn(),
    resetDateFilter: jest.fn(),
    storeId: 'seller1',
    loading: false,
  };

 

  test('renders empty state message when sales are empty', () => {
    render(<SalesTable {...defaultProps} sales={[]} />);
    expect(screen.getByText('No sales records found')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('renders specific empty state message for date filters', () => {
    render(<SalesTable {...defaultProps} sales={[]} startDate="2024-01-01" endDate="2024-01-31" />);
    expect(screen.getByText('No sales found between 2024-01-01 and 2024-01-31')).toBeInTheDocument();

    render(<SalesTable {...defaultProps} sales={[]} startDate="2024-01-01" endDate="" />);
    expect(screen.getByText('No sales found from 2024-01-01 onwards')).toBeInTheDocument();

    render(<SalesTable {...defaultProps} sales={[]} startDate="" endDate="2024-01-31" />);
    expect(screen.getByText('No sales found until 2024-01-31')).toBeInTheDocument();
  });

  test('passes correct props to DateFilter component', () => {
    render(<SalesTable {...defaultProps} startDate="2023-01-01" endDate="2023-01-31" />);

    const dateFilterComponent = screen.getByTestId('mock-date-filter');
    expect(screen.getByTestId('mock-start-date')).toHaveValue('2023-01-01');
    expect(screen.getByTestId('mock-end-date')).toHaveValue('2023-01-31');
  });

  test('calls handleStartDateChange when start date input changes', async () => {
    render(<SalesTable {...defaultProps} />);
    const startDateInput = screen.getByTestId('mock-start-date');
    await userEvent.type(startDateInput, '2023-05-01');
    expect(defaultProps.handleStartDateChange).toHaveBeenCalled();
  });

  test('calls handleEndDateChange when end date input changes', async () => {
    render(<SalesTable {...defaultProps} />);
    const endDateInput = screen.getByTestId('mock-end-date');
    await userEvent.type(endDateInput, '2023-05-31');
    expect(defaultProps.handleEndDateChange).toHaveBeenCalled();
  });

  test('calls applyDateFilter when apply button is clicked', async () => {
    render(<SalesTable {...defaultProps} />);
    const applyButton = screen.getByTestId('mock-apply-filter');
    await userEvent.click(applyButton);
    expect(defaultProps.applyDateFilter).toHaveBeenCalledTimes(1);
  });

  test('calls resetDateFilter when reset button is clicked', async () => {
    render(<SalesTable {...defaultProps} />);
    const resetButton = screen.getByTestId('mock-reset-filter');
    await userEvent.click(resetButton);
    expect(defaultProps.resetDateFilter).toHaveBeenCalledTimes(1);
  });
});