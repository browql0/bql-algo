import React from 'react';
import { ChevronRight, Code2 } from 'lucide-react';
import './Hero.css';

const Hero = ({ onStart }) => {
  return (
    <section className="hero-section">
      <div className="landing-container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            Nouveau : BQL Algo Beta 1.0 est là </div>
          <h1 className="hero-title">
            Maîtrisez l'Algorithmique. 
            <span className="text-gradient"> Simplement.</span>
          </h1>
          <p className="hero-subtitle">
            La première plateforme interactive pour apprendre, coder et exécuter vos algorithmes BQL directement dans votre navigateur. Conçu pour les étudiants et les professionnels.
          </p>
          <div className="hero-actions">
            <button className="btn-primary hero-btn main-action" onClick={onStart}>
              Commencer à coder
              <ChevronRight size={20} className="icon-right" />
            </button>
            <button className="btn-secondary hero-btn secondary-action">
              <Code2 size={20} className="icon-left" />
              Explorer les défis
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">50+</span>
              <span className="stat-label">Exercices interactifs</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">0clair</span>
              <span className="stat-label">Compilation rapide</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Focus pratique</span>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-panel code-preview">
            <div className="window-controls">
              <span className="control close"></span>
              <span className="control minimize"></span>
              <span className="control expand"></span>
            </div>
            <pre>
              <code>
                <span className="keyword">DEBUT</span><br/>
                <span className="comment">  /* Un simple algorithme BQL */</span><br/>
                {'  '}<span className="variable">x</span> <span className="operator"> </span> <span className="number">42</span>;<br/>
                {'  '}<span className="variable">y</span> <span className="operator"> </span> <span className="number">10</span>;<br/>
                {'  '}<span className="keyword">SI</span> (<span className="variable">x</span> <span className="operator">&gt;</span> <span className="variable">y</span>) <span className="keyword">ALORS</span><br/>
                {'    '}<span className="function">ecrire</span>(<span className="string">"Le secret est "</span>, <span className="variable">x</span>);<br/>
                {'  '}<span className="keyword">FINSI</span><br/>
                <span className="keyword">FIN</span>
              </code>
            </pre>
            <div className="glow-effect"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;


