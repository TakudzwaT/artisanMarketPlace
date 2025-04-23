export default function LoginPage() {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#EFE6DD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#4B3621' }}>Login to Artisan Market</h2>
        <section>
          <button style={{ margin: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#DBA159', color: 'white', border: 'none', borderRadius: '6px' }}>Login with Google (Buyer)</button>
          <button style={{ margin: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#A9744F', color: 'white', border: 'none', borderRadius: '6px' }}>Login with Google (Seller)</button>
        </section>
      </main>
    );
  }