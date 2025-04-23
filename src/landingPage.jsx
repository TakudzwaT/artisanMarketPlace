export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#D2B48C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#4B3621' }}>Welcome to Artisan Market</h1>
      <p style={{ marginBottom: '2rem', color: '#5C4033' }}>Where creativity meets commerce.</p>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <a href="/login" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4B3621', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>Login</a>
        <a href="/signup" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#8B5E3C', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>Signup</a>
      </nav>
    </main>
  );
}