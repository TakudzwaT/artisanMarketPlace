import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateFilter from '../components/DateFilter';

describe('DateFilter', () => {
  const defaultProps = {
    startDate: '',
    endDate: '',
    handleStartDateChange: jest.fn(),
    handleEndDateChange: jest.fn(),
    applyDateFilter: jest.fn(),
    resetDateFilter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders date inputs and buttons', () => {
    render(<DateFilter {...defaultProps} />);

    expect(screen.getByLabelText(/From:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reset/i })).not.toBeInTheDocument(); // Reset button is conditional
  });

  test('displays provided start and end dates', () => {
    render(<DateFilter {...defaultProps} startDate="2023-01-01" endDate="2023-01-31" />);

    expect(screen.getByLabelText(/From:/i)).toHaveValue('2023-01-01');
    expect(screen.getByLabelText(/To:/i)).toHaveValue('2023-01-31');
  });

  test('calls handleStartDateChange on start date input change', async () => {
    render(<DateFilter {...defaultProps} />);
    const startDateInput = screen.getByLabelText(/From:/i);
    await userEvent.type(startDateInput, '2023-02-15');
    expect(defaultProps.handleStartDateChange).toHaveBeenCalled();
  });

  test('calls handleEndDateChange on end date input change', async () => {
    render(<DateFilter {...defaultProps} />);
    const endDateInput = screen.getByLabelText(/To:/i);
    await userEvent.type(endDateInput, '2023-02-28');
    expect(defaultProps.handleEndDateChange).toHaveBeenCalled();
  });

  test('calls applyDateFilter on Apply button click', async () => {
    render(<DateFilter {...defaultProps} startDate="2023-01-01" />); // Enable button
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    await userEvent.click(applyButton);
    expect(defaultProps.applyDateFilter).toHaveBeenCalledTimes(1);
  });

  test('calls resetDateFilter on Reset button click', async () => {
    render(<DateFilter {...defaultProps} startDate="2023-01-01" endDate="2023-01-31" />);
    const resetButton = screen.getByRole('button', { name: /Reset/i });
    await userEvent.click(resetButton);
    expect(defaultProps.resetDateFilter).toHaveBeenCalledTimes(1);
  });

  test('Apply button is disabled when both dates are empty', () => {
    render(<DateFilter {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Apply/i })).toBeDisabled();
  });

  test('Apply button is enabled when start date is present', () => {
    render(<DateFilter {...defaultProps} startDate="2023-01-01" />);
    expect(screen.getByRole('button', { name: /Apply/i })).not.toBeDisabled();
  });

  test('Apply button is enabled when end date is present', () => {
    render(<DateFilter {...defaultProps} endDate="2023-01-31" />);
    expect(screen.getByRole('button', { name: /Apply/i })).not.toBeDisabled();
  });

  test('Reset button appears only when a date is selected', () => {
    const { rerender } = render(<DateFilter {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /Reset/i })).not.toBeInTheDocument();

    rerender(<DateFilter {...defaultProps} startDate="2023-01-01" />);
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();

    rerender(<DateFilter {...defaultProps} endDate="2023-01-31" />);
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  test('start date input has max attribute set to end date', () => {
    render(<DateFilter {...defaultProps} endDate="2023-05-10" />);
    expect(screen.getByLabelText(/From:/i)).toHaveAttribute('max', '2023-05-10');
  });

  test('end date input has min attribute set to start date', () => {
    render(<DateFilter {...defaultProps} startDate="2023-04-01" />);
    expect(screen.getByLabelText(/To:/i)).toHaveAttribute('min', '2023-04-01');
  });
});