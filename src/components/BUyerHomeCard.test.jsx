import React from 'react';
import { render, screen } from '@testing-library/react';
import BuyerHomeCard from './BuyerHomeCard';
import { BsFillBagFill } from 'react-icons/bs';

describe('BuyerHomeCard', () => {
  const defaultProps = {
    img: '/test.jpg',
    title: 'Handmade Necklace',
    star: '4',
    reviews: 28,
    prevPrice: '50.00',
    newPrice: '40.00'
  };

  it('renders all elements correctly with given props', () => {
    render(<BuyerHomeCard {...defaultProps} />);
    
    expect(screen.getByAltText(/handmade necklace/i)).toBeInTheDocument();
    expect(screen.getByText(/handmade necklace/i)).toBeInTheDocument();
    expect(screen.getByText('(28)')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
  });

  it('displays the correct number of filled and empty stars', () => {
    render(<BuyerHomeCard {...defaultProps} />);

    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
    
    const filledStars = stars.filter(star =>
      star.className.includes('filled')
    );
    expect(filledStars).toHaveLength(4);
  });

  it('renders placeholder values when props are missing', () => {
    render(<BuyerHomeCard />);
    
    expect(screen.getByAltText(/product/i)).toBeInTheDocument();
    expect(screen.getByText(/product/i)).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
    expect(screen.queryByText(/prev-price/i)).toBeNull(); // should not render del
  });

  it('renders only new price when previous price is missing', () => {
    render(<BuyerHomeCard newPrice="$25.00" />);
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.queryByText(/del/i)).not.toBeInTheDocument();
  });

  it('renders the add to cart button with the bag icon', () => {
    render(<BuyerHomeCard {...defaultProps} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeTruthy(); // BsFillBagFill renders as SVG
  });
});
