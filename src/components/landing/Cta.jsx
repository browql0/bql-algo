import React from 'react';
import { ArrowRight, TerminalSquare } from 'lucide-react';
import './Cta.css';

const Cta = ({ onStart }) => {
  return (
    <section className="cta-section">
      <div className="landing-container">
        <div className="cta-wrapper">
          {/* Subtle background glow effect */}
          <div className="cta-glow"></div>
          
          <div className="cta-content">
            <div className="cta-icon-wrapper">
              <TerminalSquare size={32} className="cta-icon" />
            </div>
            <h2 className="cta-title">Prêt à maîtriser les algorithmes ?</h2>
            <p className="cta-subtitle">
              Rejoignez les étudiants qui utilisent BQL Algo pour structurer leur logique et réussir leurs examens. Sans installation, directement dans votre navigateur.
            </p>
            
            <div className="cta-actions">
              <button className="btn-primary cta-btn" onClick={onStart}>
                Commencer à coder
                <ArrowRight size={18} className="btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
