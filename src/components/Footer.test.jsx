import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './footer';

describe('Footer component', () => {
  test('renders the footer element', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo'); // semantic <footer>
    expect(footerElement).toBeInTheDocument();
  });

  test('renders the current year in the copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const text = screen.getByText(`© ${currentYear} Your website name`);
    expect(text).toBeInTheDocument();
  });
});
