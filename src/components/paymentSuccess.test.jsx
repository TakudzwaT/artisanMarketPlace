import React from 'react';
import { render, screen } from '@testing-library/react';
import PaymentSuccess from './PaymentSuccess';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PaymentSuccess Component', () => {
  test('renders success message and continue shopping link', () => {
    renderWithRouter(<PaymentSuccess />);

    // Check heading
    expect(screen.getByRole('heading', { name: /payment successful!/i })).toBeInTheDocument();

    // Check message
    expect(screen.getByText(/thank you for your purchase./i)).toBeInTheDocument();

    // Check link
    const continueLink = screen.getByRole('link', { name: /continue shopping/i });
    expect(continueLink).toBeInTheDocument();
    expect(continueLink).toHaveAttribute('href', '/buyer');
  });
});
