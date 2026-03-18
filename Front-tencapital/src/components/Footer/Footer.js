import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main content */}
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="footer-title">TEN Capital Network</h2>
            <p className="footer-subtitle">
              Connecting investors with opportunities through our comprehensive lead management platform.
            </p>
          </div>

          <div className="footer-sections">
            {/* Contact Us */}
            <div className="footer-section">
              <h3 className="section-title">Contact Us</h3>
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <a href="mailto:info@tencapital.group" className="contact-link">
                  info@tencapital.group
                </a>
              </div>
            </div>

            {/* Follow Us */}
            <div className="footer-section">
              <h3 className="section-title">Follow Us</h3>
              <div className="social-links">
                <a href="https://twitter.com/tencapital" className="social-link" target="_blank" rel="noopener noreferrer">
                  <span className="social-icon">🐦</span>
                  <span className="social-text">Twitter</span>
                </a>
                <a href="https://linkedin.com/company/tencapital" className="social-link" target="_blank" rel="noopener noreferrer">
                  <span className="social-icon">💼</span>
                  <span className="social-text">LinkedIn</span>
                </a>
                <a href="https://youtube.com/@tencapital" className="social-link" target="_blank" rel="noopener noreferrer">
                  <span className="social-icon">📺</span>
                  <span className="social-text">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 TEN Capital Network. All rights reserved.
            </p>
            <div className="footer-links">
              <a href="#" className="footer-link">Privacy Policy</a>
              <span className="link-separator">|</span>
              <a href="#" className="footer-link">Terms of Service</a>
              <span className="link-separator">|</span>
              <a href="#" className="footer-link">Company Website</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
