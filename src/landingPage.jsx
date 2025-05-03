import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // Scroll animation trigger
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    // Cleanup
    return () => observer.disconnect();
  }, []);

  return (
    <main style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F1ED',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'Georgia, serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, #8B5E3C 0%, transparent 70%)',
        opacity: '0.1',
        transform: 'rotate(45deg)'
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, #4B3621 0%, transparent 70%)',
        opacity: '0.1',
        borderRadius: '50%'
      }}></div>

      <h1 style={{ 
        fontSize: '3rem', 
        color: '#4B3621', 
        marginBottom: '1rem',
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'all 0.8s ease-out',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }} className="fade-in">
        <span style={{
          display: 'block',
          fontSize: '1.2rem',
          color: '#8B5E3C',
          letterSpacing: '4px',
          marginBottom: '1rem'
        }}>Discover Handcrafted Treasures</span>
        Welcome to Artisan Market
      </h1>

      <p style={{ 
        marginBottom: '2rem', 
        color: '#5C4033',
        fontSize: '1.1rem',
        maxWidth: '600px',
        textAlign: 'center',
        lineHeight: '1.6',
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'all 0.8s ease-out 0.2s',
        position: 'relative',
        zIndex: 1
      }} className="fade-in">
        Where creativity meets commerce in a celebration of craftsmanship. Explore unique pieces from talented artisans worldwide.
      </p>

      <nav style={{ 
        display: 'flex', 
        gap: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <a href="/login" style={{
          padding: '1rem 2rem',
          backgroundColor: '#4B3621',
          color: 'white',
          borderRadius: '30px',
          textDecoration: 'none',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          opacity: 0,
          transform: 'translateY(20px)',
          transition: 'all 0.8s ease-out 0.4s',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }} className="fade-in" 
           onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          Login
        </a>

        <a href="/signup" style={{
          padding: '1rem 2rem',
          backgroundColor: '#8B5E3C',
          color: 'white',
          borderRadius: '30px',
          textDecoration: 'none',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          opacity: 0,
          transform: 'translateY(20px)',
          transition: 'all 0.8s ease-out 0.6s',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }} className="fade-in"
           onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          Join Community
        </a>
      </nav>

      {/* Floating decorative elements */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        animation: 'float 6s ease-in-out infinite',
        opacity: '0.2'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#4B3621">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
    </main>
  );
}

// Add this to your global CSS or CSS-in-JS
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);