import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuyerHome from './BuyerHome';

// Mock Firebase and Firestore functions to immediately resolve with predetermined values
jest.mock('./firebase', () => ({
  db: {}, // Minimal mock for db object
}));

jest.mock('firebase/firestore', () => ({
  collectionGroup: jest.fn(() => ({ type: 'collectionGroup' })), // Simple mock for collectionGroup
  getDocs: jest.fn(() => Promise.resolve({
    docs: [
      { id: 'prod1', data: () => ({ name: 'Test Product A', description: 'Desc A', category: 'Electronics', price: 75, color: 'Red', imageUrl: 'urlA' }) },
      { id: 'prod2', data: () => ({ name: 'Test Product B', description: 'Desc B', category: 'Clothing', newPrice: 120, color: 'Blue', imageUrl: 'urlB' }) },
      { id: 'prod3', data: () => ({ name: 'Test Product C', description: 'Desc C', category: 'Electronics', price: 25, color: 'Green', imageUrl: 'urlC' }) },
      { id: 'prod4', data: () => ({ name: 'Expensive Item', description: 'Luxury', category: 'Jewelry', price: 1500, color: 'Gold', imageUrl: 'urlD' }) },
    ],
  })),
}));

// Mock child components to render minimal, predictable output for testing presence
jest.mock('./components/BuyerHomeCard', () => {
  // eslint-disable-next-line react/prop-types
  return function MockBuyerHomeCard({ product }) {
    return <section data-testid={`buyer-card-${product.id}`}>{product.name || 'Mock Product'}</section>;
  };
});



jest.mock('./Sidebar/Sidebar', () => {
  // eslint-disable-next-line react/prop-types
  return function MockSidebar({ handleCategoryChange, handlePriceChange, handleColorChange }) {
    return (
      <section data-testid="mock-sidebar">
        <select data-testid="category-select" onChange={handleCategoryChange}>
          <option value="">All</option>
          <option value="electronics">Electronics</option>
        </select>
        <select data-testid="price-select" onChange={handlePriceChange}>
          <option value="">All</option>
          <option value="50">Under $50</option>
          <option value="100">Under $100</option>
          <option value="200">Under $200</option>
          <option value="1000">Under $1000</option>
          <option value="5000000">Above $1000</option> {/* To hit this specific range */}
        </select>
        <select data-testid="color-select" onChange={handleColorChange}>
          <option value="">All</option>
          <option value="red">Red</option>
        </select>
      </section>
    );
  };
});

jest.mock('./components/nav', () => {
  return function MockNav() {
    return <nav data-testid="mock-nav">Nav Bar</nav>;
  };
});

jest.mock('./components/LoadCredits', () => {
  return function MockLoadCredits() {
    return <section data-testid="mock-load-credits">Load Credits Widget</section>;
  };
});

// Mocking 'lucide-react' Search icon to avoid actual component import issues
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
}));

// Mock the Recommended component since it's removed from BuyerHome.jsx



describe('BuyerHome ', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  // Test 1: Initial render and product fetching success
  test('renders loading, then products fetched from Firestore', async () => {
    render(<BuyerHome />);

    // Initial loading state should be present
    expect(screen.getByText(/Loading products\.\.\./i)).toBeInTheDocument();

    // Wait for products to load and be displayed
    await waitFor(() => {
      expect(screen.queryByText(/Loading products\.\.\./i)).not.toBeInTheDocument();
      expect(screen.getByTestId('buyer-card-prod1')).toHaveTextContent('Test Product A');
      expect(screen.getByTestId('buyer-card-prod2')).toHaveTextContent('Test Product B');
      expect(screen.getByTestId('mock-nav')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-load-credits')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      // Ensure Recommended component is NOT rendered
      expect(screen.queryByTestId('mock-recommended')).not.toBeInTheDocument();
    });
  });
  
  // Test 2: Search functionality - matching by name
  test('filters products by search query (name)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument()); // Ensure loaded

    const searchInput = screen.getByPlaceholderText(/Search products\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Test Product A' } });

    expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument();
    expect(screen.queryByTestId('buyer-card-prod2')).not.toBeInTheDocument();
  });

  // Test 3: Search functionality - matching by description
  test('filters products by search query (description)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument()); // Ensure loaded

    const searchInput = screen.getByPlaceholderText(/Search products\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Desc B' } });

    expect(screen.queryByTestId('buyer-card-prod1')).not.toBeInTheDocument();
    expect(screen.getByTestId('buyer-card-prod2')).toBeInTheDocument();
  });


  // Test 4: Category filter
  test('filters products by category', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument());

    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: 'electronics' } });

    expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument(); // Electronics
    expect(screen.getByTestId('buyer-card-prod3')).toBeInTheDocument(); // Electronics
    expect(screen.queryByTestId('buyer-card-prod2')).not.toBeInTheDocument(); // Clothing
  });

  // Test 5: Price filter - <= 50
  test('filters products by price range (<= 50)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument());

    const priceSelect = screen.getByTestId('price-select');
    fireEvent.change(priceSelect, { target: { value: '50' } });

    expect(screen.queryByTestId('buyer-card-prod1')).not.toBeInTheDocument(); // 75 > 50
    expect(screen.queryByTestId('buyer-card-prod2')).not.toBeInTheDocument(); // 120 > 50
    expect(screen.getByTestId('buyer-card-prod3')).toBeInTheDocument(); // 25 <= 50
  });

  // Test 6: Price filter - >50 and <=100
  test('filters products by price range (>50 and <=100)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument());

    const priceSelect = screen.getByTestId('price-select');
    fireEvent.change(priceSelect, { target: { value: '100' } });

    expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument(); // 75
    expect(screen.queryByTestId('buyer-card-prod2')).not.toBeInTheDocument(); // 120
    expect(screen.queryByTestId('buyer-card-prod3')).not.toBeInTheDocument(); // 25
  });
    
  // Test 7: Price filter - >150 and <=200
  test('filters products by price range (>150 and <=200)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument());

    const priceSelect = screen.getByTestId('price-select');
    fireEvent.change(priceSelect, { target: { value: '200' } });

    // No products in our current mock fall into this range, so it will show "No products found"
    await waitFor(() => {
        expect(screen.getByText(/No products found matching your criteria/i)).toBeInTheDocument();
    });
  });
  
  // Test 8: Price filter - >1000 and <=5000000
  test('filters products by price range (>1000 and <=5000000)', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod4')).toBeInTheDocument()); // Ensure expensive product is loaded

    const priceSelect = screen.getByTestId('price-select');
    fireEvent.change(priceSelect, { target: { value: '5000000' } });

    expect(screen.getByTestId('buyer-card-prod4')).toBeInTheDocument(); // 1500 is >1000 and <=5000000
    expect(screen.queryByTestId('buyer-card-prod1')).not.toBeInTheDocument();
  });

  // Test 9: Color filter
  test('filters products by color', async () => {
    render(<BuyerHome />);
    await waitFor(() => expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument());

    const colorSelect = screen.getByTestId('color-select');
    fireEvent.change(colorSelect, { target: { value: 'red' } });

    expect(screen.getByTestId('buyer-card-prod1')).toBeInTheDocument(); // Red
    expect(screen.queryByTestId('buyer-card-prod2')).not.toBeInTheDocument(); // Blue
  });
});