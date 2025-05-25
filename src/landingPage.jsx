// src/components/LandingPage.js
import React, { useEffect } from 'react';
import './LandingPage.css'; // Import the CSS file

export default function LandingPage() {
  useEffect(() => {
    // Scroll animation trigger
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add a class that applies the final styles
          entry.target.classList.add('is-intersecting');
        } else {
          // Optionally remove the class if you want elements to animate back out
          // entry.target.classList.remove('is-intersecting');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    // Cleanup
    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing-main">
      {/* Animated background elements */}
      <section className="bg-element-top-left"></section>
      <section className="bg-element-bottom-right"></section>

      <h1 className="landing-title fade-in">
        <span className="landing-subtitle">Discover Handcrafted Treasures</span>
        Welcome to Artisan Market
      </h1>

      <p className="landing-description fade-in">
        Where creativity meets commerce in a celebration of craftsmanship. Explore unique pieces from talented artisans worldwide.
      </p>

      <nav className="landing-nav">
        <a href="/login" className="landing-btn landing-btn-login fade-in">
          Login
        </a>

        <a href="/signup" className="landing-btn landing-btn-join fade-in">
          Join Community
        </a>
      </nav>

      {/* Floating decorative elements */}
      <section className="floating-element">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#4B3621">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </section>
    </main>
  );
}