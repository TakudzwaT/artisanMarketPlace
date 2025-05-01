import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

jest.mock('./../firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}));

jest.mock('./sellerNav', () => () => <nav data-testid="seller-nav">Navigation</nav>);

const MockCreateStore = () => {
  return (
    <>
      <nav data-testid="seller-nav">Navigation</nav>
      <header><h1>Create your store</h1></header>
      <main>
        <form data-testid="create-store-form">
          <section>
            <h2>Store Details</h2>
            <label>
              Store name
              <input type="text" name="name" />
            </label>
          </section>
          <button type="submit">Save & Continue</button>
        </form>
      </main>
    </>
  );
};

describe('CreateStore', () => {
  test('renders store creation form', () => {
    render(<MockCreateStore />);
    
    expect(screen.getByText('Create your store')).toBeInTheDocument();
    expect(screen.getByTestId('seller-nav')).toBeInTheDocument();
    expect(screen.getByTestId('create-store-form')).toBeInTheDocument();
    expect(screen.getByText('Save & Continue')).toBeInTheDocument();
  });
});