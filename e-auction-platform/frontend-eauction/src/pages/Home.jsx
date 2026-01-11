import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Bid Smarter. Win Faster.</h1>
          <p className="hero-subtitle">
            Real-time auctions with AI-driven insights, transparent bidding, and secure transactions.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="cta primary">Get Started</a>
            <a href="/login" className="cta">Sign In</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true" />
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Real-time Bidding</h3>
          <p>Live auctions with instant bid updates powered by WebSockets.</p>
        </div>
        <div className="feature-card">
          <h3>Auction Management</h3>
          <p>Create, schedule, and manage listings with role-based access.</p>
        </div>
        <div className="feature-card">
          <h3>Smart Analytics</h3>
          <p>Track bidding trends and performance with intuitive dashboards.</p>
        </div>
      </section>

      <section className="roles">
        <div className="role">
          <h4>Admin</h4>
          <p>Oversee users and auctions, enable or disable listings.</p>
        </div>
        <div className="role">
          <h4>Seller</h4>
          <p>Create auctions, set prices and schedules, monitor bids live.</p>
        </div>
        <div className="role">
          <h4>Bidder</h4>
          <p>Discover live auctions, place competitive bids with countdowns.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
