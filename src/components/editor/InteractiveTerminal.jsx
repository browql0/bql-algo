/**
 * InteractiveTerminal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Terminal React interactif pour le pseudo-langage marocain.
 *
 * Fonctionnement :
 *   1. ECRIRE() → chaque sortie est streamée en temps réel via onNewLine()
 *   2. LIRE()    → l'interpréteur appelle requestInput(varName, type) qui
 *                  retourne une Promise; le terminal affiche un champ input;
 *                  quand l'utilisateur tape Enter → resolve(value)
 *
 * Props :
 *   lines        : string[]   — lignes déjà produites (snapshot)
 *   inputPrompt  : object|null — { varName, type, resolve } ou null
 *   onSubmitInput: (value) => void — appelé quand user soumet une valeur
 *   isRunning    : boolean     — true pendant l'exécution
 *   settings     : object      — préférences (fontSize, fontFamily, theme)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState } from 'react';
import './InteractiveTerminal.css';

const TYPE_HINTS = {
  entier:    'nombre entier (ex: 42)',
  reel:      'nombre décimal (ex: 3.14)',
  booleen:   'VRAI ou FAUX',
  caractere: 'un caractère (ex: A)',
  chaine:    'texte libre',
};

const InteractiveTerminal = ({
  lines        = [],
  inputPrompt  = null,
  onSubmitInput,
  isRunning    = false,
  settings,
}) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef  = useRef(null);
  const inputRef   = useRef(null);

  // Font style dynamique
  const fontStyle = {
    fontSize: `${settings?.fontSize || 14}px`,
    fontFamily: settings?.fontFamily === 'fira'     ? "'Fira Code', monospace"
              : settings?.fontFamily === 'consolas' ? "'Consolas', monospace"
              : "'JetBrains Mono', monospace",
  };

  // Auto-scroll vers le bas à chaque nouvelle ligne ou prompt
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, inputPrompt]);

  // Focus automatique sur l'input quand un prompt apparaît
  useEffect(() => {
    if (inputPrompt && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputPrompt]);

  // Reset de l'input après soumission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputPrompt || !onSubmitInput) return;
    const value = inputValue.trim();
    setInputValue('');
    onSubmitInput(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const theme = settings?.theme || 'hacker';

  return (
    <div className={`iterm-container iterm-theme-${theme}`} style={fontStyle}>

      {/* ── Zone de sortie (scrollable) ── */}
      <div className="iterm-output" ref={scrollRef}>

        {/* État initial vide */}
        {lines.length === 0 && !inputPrompt && !isRunning && (
          <span className="iterm-empty">En attente d'exécution…</span>
        )}

        {/* Animation d'exécution sans sortie encore */}
        {isRunning && lines.length === 0 && !inputPrompt && (
          <span className="iterm-running">
            <span className="iterm-dot-anim">●●●</span> Exécution en cours…
          </span>
        )}

        {/* Lignes de sortie */}
        {lines.map((line, i) => (
          <div key={i} className={`iterm-line ${_lineClass(line)}`}>
            <span className="iterm-prompt">&gt;</span>
            <span className="iterm-text">{line}</span>
          </div>
        ))}

        {/* Prompt LIRE en attente */}
        {inputPrompt && (
          <div className="iterm-input-row">
            <span className="iterm-prompt iterm-prompt--input">?</span>
            <form onSubmit={handleSubmit} className="iterm-input-form">
              <input
                ref={inputRef}
                type="text"
                className="iterm-input-field"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  `${inputPrompt.varName} (${TYPE_HINTS[inputPrompt.type] ?? inputPrompt.type})`
                }
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button type="submit" className="iterm-submit-btn" title="Valider (Entrée)">
                ↵
              </button>
            </form>
          </div>
        )}

        {/* Curseur clignotant (en attente input) */}
        {inputPrompt && (
          <div className="iterm-hint">
            💡 Variable <code>{inputPrompt.varName}</code> de type <strong>{inputPrompt.type.toUpperCase()}</strong>
            &nbsp;— {TYPE_HINTS[inputPrompt.type] ?? 'valeur quelconque'}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Détermine la classe CSS d'une ligne selon son contenu.
 * Permet de colorier différemment les avertissements, erreurs, etc.
 */
function _lineClass(line) {
  if (line.startsWith('[LIRE]') || line.startsWith('[Erreur]')) return 'iterm-line--warn';
  if (line.startsWith('[runtime')) return 'iterm-line--error';
  return '';
}

export default InteractiveTerminal;
