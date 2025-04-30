import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LoadingBar from './LoadingBar';

describe('LoadingBar component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('initial percent is 0', () => {
    render(<LoadingBar />);
    
    // Pick the section element with the aria attributes
    const [wrapper] = screen.getAllByRole('progressbar');
    expect(wrapper).toHaveAttribute('aria-valuenow', '0');
  });

  test('updates percent over time', () => {
    render(<LoadingBar duration={3000} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const [wrapper] = screen.getAllByRole('progressbar');
    const percentNow = parseInt(wrapper.getAttribute('aria-valuenow'), 10);
    expect(percentNow).toBeGreaterThan(0);
    expect(percentNow).toBeLessThan(100);
  });

  test('reaches 100% after full duration', () => {
    render(<LoadingBar duration={3000} />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const [wrapper] = screen.getAllByRole('progressbar');
    expect(wrapper).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
