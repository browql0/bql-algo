import React from 'react';
import { TerminalSquare } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <TerminalSquare className="logo-icon" size={24} />
              <h2>BQL<span>algo</span></h2>
            </div>
            <p className="footer-desc">
              La plateforme ultime pour apprendre, pratiquer et exceller en algorithmique avec le langage BQL.
            </p>
           
          </div>
          
          <div className="footer-links-group">
            <h3>Produit</h3>
            <ul>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#pricing">Tarifs</a></li>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#changelog">Nouveautés</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h3>Ressources</h3>
            <ul>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#community">Communauté</a></li>
              <li><a href="#tutorials">Tutoriels</a></li>
              <li><a href="#support">Support</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h3>Légal</h3>
            <ul>
              <li><a href="#privacy">Confidentialité</a></li>
              <li><a href="#terms">CGU</a></li>
              <li><a href="#cookies">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BQL Algo. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
