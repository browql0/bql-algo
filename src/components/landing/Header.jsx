import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, TerminalSquare } from 'lucide-react';
import './Header.css';

const Header = ({ onStart }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquer le scroll de la page quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-container header-container">
          <a href="#" className="header-logo" onClick={closeMenu}>
            <TerminalSquare className="logo-icon" size={28} />
            <h2>BQL<span>algo</span></h2>
            <span className="header-badge">BETA</span>
          </a>

          {/* Nav Bureau */}
          <nav className="desktop-nav">
            <a href="#features">Fonctionnalités</a>
            <a href="#about">À propos</a>
            <a href="#contact">Contact</a>
            
            <div className="header-actions">
              <Link to="/login" className="btn-secondary">Connexion</Link>
              <button className="btn-primary" onClick={onStart}>Accéder à l'éditeur</button>
            </div>
          </nav>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE MENU (Hors du header pour éviter les conflits z-index / blur) ─── */}
      <div 
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />
      
      <nav className={`mobile-nav-panel ${isMobileMenuOpen ? 'open' : ''} ${isScrolled ? 'scrolled-offset' : ''}`}>
        <a href="#features" onClick={closeMenu}>Fonctionnalités</a>
        <a href="#about" onClick={closeMenu}>À propos</a>
        <a href="#contact" onClick={closeMenu}>Contact</a>
        
        <div className="mobile-actions">
          <Link to="/login" className="btn-secondary" onClick={closeMenu}>Connexion</Link>
          <button className="btn-primary" onClick={() => { closeMenu(); onStart(); }}>
            Accéder à l'éditeur
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
