import React from 'react';
import { render } from '@testing-library/react';
import Products from './Products';

describe('Products Component', () => {
  it('renders without crashing', () => {
    render(<Products result={[]} />);
  });

  it('renders the products section with correct class', () => {
    const { container } = render(<Products result={[]} />);
    expect(container.querySelector('.products-section')).toBeInTheDocument();
  });

  it('renders the card container with correct class', () => {
    const { container } = render(<Products result={[]} />);
    expect(container.querySelector('.products-card-container')).toBeInTheDocument();
  });

  it('renders the result prop content inside card container', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    const { getByTestId } = render(<Products result={testContent} />);
    expect(getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders empty result prop without errors', () => {
    const { container } = render(<Products result={null} />);
    expect(container.querySelector('.products-card-container')).toBeEmptyDOMElement();
  });

  it('renders multiple children when result is an array', () => {
    const testContent = [
      <div key="1" data-testid="item-1">Item 1</div>,
      <div key="2" data-testid="item-2">Item 2</div>
    ];
    const { getByTestId } = render(<Products result={testContent} />);
    expect(getByTestId('item-1')).toBeInTheDocument();
    expect(getByTestId('item-2')).toBeInTheDocument();
  });
});