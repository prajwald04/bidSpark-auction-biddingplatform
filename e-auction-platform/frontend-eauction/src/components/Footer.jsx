import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>Bidspark © {new Date().getFullYear()}</div>
        <div className="footer-links">
          <a href="/home">Home</a>
          <a href="/explore">Explore</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
