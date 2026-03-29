import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TerminalSquare, CheckCircle2 } from 'lucide-react';
import './AuthLayout.css';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      {/* Animated background blobs */}
      <div className="auth-bg-blob blob-top"></div>
      <div className="auth-bg-blob blob-bottom"></div>
      
      <div className="auth-split-panel">
        
        {/* Left Side — Branding & Showcase (Desktop Only) */}
        <div className="auth-showcase">
          <div className="auth-showcase-inner">
            <Link to="/" className="auth-logo">
              <div className="logo-icon-wrap">
                <TerminalSquare size={24} />
              </div>
              <h2>BQL<span>algo</span></h2>
            </Link>

            <div className="showcase-content">
              <h3>La plateforme ultime pour maîtriser l'algorithmique.</h3>
              <p>Rejoignez des milliers d'étudiants et de développeurs qui s'entraînent chaque jour avec notre éditeur interactif et notre langage BQL conçu pour la pédagogie.</p>
              
              <ul className="showcase-features">
                <li><CheckCircle2 size={18} className="feature-icon" /> Exécution instantanée du code</li>
                <li><CheckCircle2 size={18} className="feature-icon" /> Correction automatisée</li>
                <li><CheckCircle2 size={18} className="feature-icon" /> Statistiques de progression</li>
              </ul>
            </div>
            
            <div className="showcase-footer">
              <p>&copy; {new Date().getFullYear()} BQL Algo.</p>
            </div>
          </div>
          
          {/* Decorative code snippet floating */}
          <div className="floating-code">
            <div className="code-window-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <pre><code>
              <span className="keyword">ALGORITHME</span><span className="function">_Moyenne</span>;<br/>
              <span className="keyword">VARIABLES</span>:<br/>
              &nbsp;&nbsp;somme, i : <span className="variable">ENTIER</span>;<br/>
              &nbsp;&nbsp;note : <span className="variable">REEL</span>;<br/>
              <span className="keyword">DEBUT</span><br/>
              &nbsp;&nbsp;somme ← <span className="number">0</span>;<br/>
              &nbsp;&nbsp;<span className="keyword">POUR</span> i <span className="keyword">ALLANT DE</span> <span className="number">0</span> <span className="keyword">A</span> <span className="number">10</span><span className="keyword"> FAIRE</span><br/>
               &nbsp;&nbsp;<span className="function">LIRE</span>(<span className="string">note</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;somme ← somme + note;<br/> 

              &nbsp;&nbsp;<span className="keyword">FIN POUR</span><br/>
              &nbsp;&nbsp;<span className="function">ECRIRE</span>(<span className="string">"Moyenne : "</span>, somme / <span className="number">10</span>)<br/>
              <span className="keyword">FIN</span>
            </code></pre>
          </div>
        </div>

        {/* Right Side — Dynamic Form (Login/SignUp) */}
        <div className="auth-form-container">
          {/* Logo on mobile only since desktop has it on the left */}
          <Link to="/" className="auth-logo mobile-logo">
            <div className="logo-icon-wrap">
              <TerminalSquare size={20} />
            </div>
            <h2>BQL<span>algo</span></h2>
          </Link>
          
          <div className="auth-form-scroll-area">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
