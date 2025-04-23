import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();

  const handleBuyerSignup = () => {
    navigate('/buyer'); // or wherever you want the buyer to go after signup
  };

  const handleSellerSignup = () => {
    navigate('/sellerOrders'); // or the appropriate seller route
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#FAF3E3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ color: '#4B3621' }}>Sign up for Artisan Market</h2>
      <section>
        <button
          onClick={handleBuyerSignup}
          style={{
            margin: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#DBA159',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}>
          Sign up with Google (Buyer)
        </button>
        <button
          onClick={handleSellerSignup}
          style={{
            margin: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#A9744F',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}>
          Sign up with Google (Seller)
        </button>
      </section>
    </main>
  );
}

  