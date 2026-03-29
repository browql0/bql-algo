import React, { useRef, useMemo, useEffect } from 'react';
import './CodeEditor.css';
import '../editor/highlight/tokenStyles.css';

import { useAutocomplete } from './autocomplete/useAutocomplete';
import AutocompleteMenu from './autocomplete/AutocompleteMenu';
import { tokenizeForHighlight } from './highlight/highlight';

/**
 * Éditeur BQL Custom
 * Utilise un `<textarea>` transparent superposé sur un `<div>` contenant
 * le texte fractionné en `<span className="token-XXX">` pour la coloration.
 */
const CodeEditor = ({ code, onChange, settings }) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const highlightRef = useRef(null);

  // Auto-complétion Hook
  const autocomplete = useAutocomplete(code, onChange, textareaRef);

  // Styles communs stricts entre calque et texte
  const editorStyle = {
    fontSize: `${settings?.fontSize || 14}px`,
    fontFamily: settings?.fontFamily === 'fira' ? "'Fira Code', monospace" :
                settings?.fontFamily === 'consolas' ? "'Consolas', monospace" :
                "'JetBrains Mono', monospace",
    lineHeight: '1.6',
    tabSize: settings?.tabSize === 'tab' ? 4 : parseInt(settings?.tabSize || 2),
    whiteSpace: settings?.wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: settings?.wordWrap ? 'break-all' : 'normal'
  };

  // Synchronisation stricte du défilement
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const scrollLeft = e.target.scrollLeft;

    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    const intercepted = autocomplete.onKeyDown(e);
    if (intercepted) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const indentString = settings?.tabSize === 'tab' ? '\t' : ' '.repeat(parseInt(settings?.tabSize || 2));
      const newCode = code.substring(0, start) + indentString + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentString.length;
        }
      }, 0);
    }
  };

  const handleKeyUp = (e) => {
    const NavKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab'];
    if (!NavKeys.includes(e.key)) {
      autocomplete.handleInput(e);
    }
  };

  const handleClick = (e) => autocomplete.handleInput(e);
  const handleBlur = () => setTimeout(() => autocomplete.closeMenu(), 150);

  // Génération des numéros de ligne (avec forçage d'une hauteur supplémentaire pour le scrolling de fin)
  const linesCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: linesCount }, (_, i) => i + 1);

  // Analyse syntaxique purement UI mémorisée
  const highlightedTokens = useMemo(() => {
    return tokenizeForHighlight(code);
  }, [code]);

  return (
    <div className="code-editor-wrapper">
      
      {/* ── Gouttière (Lignes) ── */}
      <div className="line-numbers" ref={lineNumbersRef} style={editorStyle}>
        {lineNumbers.map(num => (
          <div key={num} className="line-number">{num}</div>
        ))}
        <div style={{ paddingBottom: '2rem' }}></div>
      </div>

      {/* ── Calques d'édition superposés ── */}
      <div className="editor-layers" style={editorStyle}>
        
        {/* Calque Arrière-plan (Coloré) */}
        <div 
          className="highlight-layer shared-editor-styles" 
          ref={highlightRef}
          aria-hidden="true"
        >
          {highlightedTokens.map((token, i) => (
            <span key={i} className={`token-${token.type}`}>
              {token.value}
            </span>
          ))}
          {/* Hack pour assurer que le curseur trouve sa place en fin de ligne */}
          <br/>
        </div>

        {/* Calque Premier plan (Invisible) */}
        <textarea
          ref={textareaRef}
          className="code-textarea shared-editor-styles"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          onBlur={handleBlur}
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Menu Auto-complétion par-dessus le reste */}
        <AutocompleteMenu
          isOpen={autocomplete.isOpen}
          suggestions={autocomplete.suggestions}
          selectedIndex={autocomplete.selectedIndex}
          coords={autocomplete.coords}
          onSelect={autocomplete.applySuggestion}
          setSelectedIndex={autocomplete.setSelectedIndex}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
