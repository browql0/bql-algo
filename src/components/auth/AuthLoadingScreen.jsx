import React from 'react';
import { TerminalSquare } from 'lucide-react';
import './AuthLoadingScreen.css';

// ─────────────────────────────────────────────────────────────────────────────
// AuthLoadingScreen — écran de chargement affiché PENDANT la vérification de
// session. Empêche tout flash de contenu protégé au refresh de la page.
// ─────────────────────────────────────────────────────────────────────────────
const AuthLoadingScreen = () => {
  return (
    <div className="auth-loading-screen" aria-label="Vérification de la session…">
      <div className="auth-loading-card">
        <div className="auth-loading-logo">
          <TerminalSquare size={32} />
        </div>
        <h2 className="auth-loading-brand">
          BQL<span>algo</span>
        </h2>
        <div className="auth-loading-spinner">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="auth-loading-text">Vérification de la session…</p>
      </div>

      {/* Blobs d'arrière-plan décoratifs */}
      <div className="auth-loading-blob blob-1"></div>
      <div className="auth-loading-blob blob-2"></div>
    </div>
  );
};

export default AuthLoadingScreen;
