/**
 * InteractiveTerminal.jsx
 * -----------------------------------------------------------------------------
 * Terminal React interactif pour BQL Algo.
 *
 * Fonctionnement :
 *   1. ECRIRE() → chaque sortie streamée en temps réel via outputCallback()
 *   2. LIRE()   ? retourne une Promise; le terminal affiche un champ input
 *
 * Props :
 *   lines        : string[]   ? lignes déjà produites (snapshot)
 *   inputPrompt  : object|null ? { varName, type } ou null
 *   onSubmitInput: (value) => void
 *   isRunning    : boolean
 *   settings     : object      ? préférences (fontSize, fontFamily, terminalTheme?)
 * -----------------------------------------------------------------------------
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
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Dynamic font style from settings
  const fontStyle = {
    fontSize: `${settings?.terminalFontSize || 14}px`,
    fontFamily: settings?.fontFamily === 'fira'     ?"'Fira Code', monospace"
              : settings?.fontFamily === 'consolas' ?"'Consolas', monospace"
              : settings?.fontFamily === 'ubuntu'   ?"'Ubuntu Mono', monospace"
              : "'JetBrains Mono', monospace",
  };

  // Auto-scroll to bottom on new output or prompt
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, inputPrompt]);

  // Focus input when a LIRE() prompt appears
  useEffect(() => {
    if (inputPrompt && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputPrompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputPrompt || !onSubmitInput) return;
    const value = inputValue.trim();
    setInputValue('');
    onSubmitInput(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  const theme = settings?.terminalTheme || 'hacker';

  // Status badge
  const badge = isRunning
    ?{ label: 'Exécution', cls: 'iterm-badge--running' }
    : lines.length > 0
    ?{ label: 'Terminé',   cls: 'iterm-badge--done' }
    : { label: 'Prêt',      cls: 'iterm-badge--ready' };

  const isEmpty = lines.length === 0 && !inputPrompt && !isRunning;

  return (
    <div className={`iterm-container iterm-theme-${theme}`} style={fontStyle}>

      {/* -- Header bar -- */}
      <div className="iterm-header">
        <div className="iterm-header-left">
          <span className={`iterm-status-dot${isRunning ?' running' : ''}`} />
          <span className="iterm-header-title">bql_output</span>
        </div>
        <div className="iterm-header-right">
          <span className={`iterm-badge ${badge.cls}`}>{badge.label}</span>
        </div>
      </div>

      {/* -- Output zone (scrollable) -- */}
      <div className="iterm-output" ref={scrollRef}>

        {/* Premium empty state */}
        {isEmpty && (
          <div className="iterm-empty-state">
            <div className="iterm-empty-icon">⬡</div>
            <div className="iterm-empty-title">Aucune sortie</div>
            <div className="iterm-empty-sub">
              Exécutez votre algorithme pour voir la sortie ici.
            </div>
            <div className="iterm-shortcut">
              <kbd>Ctrl</kbd>
              <span>+</span>
              <kbd>Enter</kbd>
            </div>
          </div>
        )}

        {/* Running animation (no output yet) */}
        {isRunning && lines.length === 0 && !inputPrompt && (
          <div className="iterm-running">
            <div className="iterm-dot-anim">
              <span /><span /><span />
            </div>
            Exécution en cours?
          </div>
        )}

        {/* Output lines */}
        {lines.map((line, i) => (
          <div key={i} className={`iterm-line ${_lineClass(line)}`}>
            <span className="iterm-prompt">&gt;</span>
            <span className="iterm-text">{line}</span>
          </div>
        ))}

        {/* Separator before input */}
        {inputPrompt && lines.length > 0 && (
          <div className="iterm-separator" />
        )}

        {/* Interactive LIRE() input */}
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
                placeholder={`${inputPrompt.varName} (${TYPE_HINTS[inputPrompt.type] ?? inputPrompt.type})`}
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

        {/* Type hint */}
        {inputPrompt && (
          <div className="iterm-hint">
            Astuce Variable <code>{inputPrompt.varName}</code> de type <strong>{inputPrompt.type.toUpperCase()}</strong>
            &nbsp;- {TYPE_HINTS[inputPrompt.type] ?? 'valeur quelconque'}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Determines CSS class for a line based on its content.
 */
function _lineClass(line) {
  if (line.startsWith('[LIRE]') || line.startsWith('[Erreur]')) return 'iterm-line--warn';
  if (line.startsWith('[runtime') || line.startsWith('[Erreur interne]'))  return 'iterm-line--error';
  return '';
}

export default InteractiveTerminal;

