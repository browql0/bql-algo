import React, { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import './CodeEditor.css';
import '../editor/highlight/tokenStyles.css';

import { useAutocomplete } from './autocomplete/useAutocomplete';
import AutocompleteMenu from './autocomplete/AutocompleteMenu';
import { tokenizeAndMapStructure } from './highlight/highlight';

/**
 * 0diteur BQL Custom
 * Utilise un `<textarea>` transparent superposé sur un `<div>` contenant
 * le texte fractionné en `<span className="token-XXX">` pour la coloration.
 */
const CodeEditor = forwardRef(({ code, onChange, settings, onFormat, runningLine = null }, ref) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const highlightRef = useRef(null);

  const [cursorLine, setCursorLine] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const insertSnippet = (snippet) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(newCode);
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start + snippet.length, start + snippet.length);
      updateCursorLine(textareaRef.current);
    }, 0);
  };

  useImperativeHandle(ref, () => ({
    jumpToLine: (lineNum, colNum = 1) => {
      if (!textareaRef.current) return;
      const lines = code.split('\n');
      if (lineNum > lines.length) lineNum = lines.length;
      if (lineNum < 1) lineNum = 1;

      let offset = 0;
      for (let i = 0; i < lineNum - 1; i++) {
        offset += lines[i].length + 1;
      }

      const targetCol = Math.min(colNum - 1, lines[lineNum - 1].length);
      offset += Math.max(0, targetCol);

      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(offset, offset);

      // Calculate scroll position to center the line
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight) || 22;
      const scrollTopConfig = (lineNum - 1) * lineHeight - (textareaRef.current.clientHeight / 2);
      textareaRef.current.scrollTop = Math.max(0, scrollTopConfig);
    }
  }));

  // Auto-complétion Hook
  const autocomplete = useAutocomplete(code, onChange, textareaRef);

  // Styles communs stricts entre calque et texte
  const zoomFactor = (settings?.editorZoom || 100) / 100;
  const baseFontSize = parseInt(settings?.fontSize || 14);

  const editorStyle = {
    fontSize: `${baseFontSize * zoomFactor}px`,
    fontFamily: settings?.fontFamily === 'fira' ? "'Fira Code', monospace" :
      settings?.fontFamily === 'consolas' ? "'Consolas', monospace" :
        settings?.fontFamily === 'ubuntu' ? "'Ubuntu Mono', monospace" :
          "'JetBrains Mono', monospace",
    lineHeight: settings?.lineHeight || '1.6',
    fontVariantLigatures: settings?.fontLigatures !== false ? 'normal' : 'none',
    tabSize: settings?.tabSize === 'tab' ? 4 : parseInt(settings?.tabSize || 4),
    whiteSpace: settings?.wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: settings?.wordWrap ? 'break-all' : 'normal',
    paddingBottom: isMobile ? '60px' : '0' // Espace pour la barre de snippets
  };

  const updateCursorLine = (target) => {
    if (settings?.highlightActiveLine !== false) {
      const textBefore = target.value.substring(0, target.selectionStart);
      setCursorLine(textBefore.split('\\n').length);
    }
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
    // Raccourci de formatage du code
    if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (onFormat) onFormat();
      return;
    }

    // Ctrl+S / Cmd+S pour le format On Save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault(); // éviter la sauvegarde page navigateur
      if (settings?.formatOnSave !== false && onFormat) {
        onFormat();
      }
      return;
    }

    const intercepted = autocomplete.onKeyDown(e);
    if (intercepted) return;

    // Fermeture automatique () [] ""
    const Pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    const keyStr = e.key;
    if (Pairs[keyStr]) {
      const isQuote = keyStr === '"' || keyStr === "'";
      if ((isQuote && settings?.autoClosingQuotes !== false) || (!isQuote && settings?.autoClosingBrackets !== false)) {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const insertText = keyStr + Pairs[keyStr];
        const newCode = code.substring(0, start) + insertText + code.substring(end);
        onChange(newCode);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
            updateCursorLine(textareaRef.current);
          }
        }, 0);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      // Capturer le texte précédent le curseur pour analyser la ligne courante
      const textBeforeCursor = code.substring(0, start);
      const lastNewLineIdx = textBeforeCursor.lastIndexOf('\n');
      const currentLine = textBeforeCursor.substring(lastNewLineIdx + 1);

      // Mesurer l'indentation de départ
      // Mesurer l'indentation de départ
      const match = currentLine.match(/^\s*/);
      let indent = match ? match[0] : '';
      const indentString = (!settings || settings?.insertSpaces !== false) && settings?.tabSize !== 'tab'
        ? ' '.repeat(parseInt(settings?.tabSize || 4))
        : '\t';

      // Analyser le mot-clé pour deviner l'intention
      const trimmedLine = currentLine.trim();
      const upperLine = trimmedLine.toUpperCase();
      const firstWordMatch = trimmedLine.match(/^([a-zA-Z_]\w*)/);
      const firstWord = firstWordMatch ? firstWordMatch[1].toUpperCase() : null;

      if (settings?.autoIndentOnEnter !== false) {
        // 1. Si la ligne ouvre un bloc, on ajoute 1 niveau d'indentation
        const isOpener = upperLine.endsWith('ALORS') ||
          upperLine.endsWith('FAIRE') ||
          upperLine.endsWith(':') ||
          upperLine === 'DEBUT' ||
          upperLine === 'REPETER' ||
          ['SINON', 'CAS', 'AUTRE'].includes(firstWord);

        if (isOpener) {
          indent += indentString;
        } else {
          // 2. Si la ligne ferme un bloc, le contenu de la SUIVANTE doit reculer pour rester cohérent
          const isCloser = ['FINSI', 'FINSELON', 'FINPOUR', 'FINTANTQUE', 'JUSQUA', 'FIN'].includes(firstWord) || upperLine.startsWith('SINONSI') || upperLine.startsWith('SINONSI');
          if (isCloser) {
            if (indent.endsWith(indentString)) {
              indent = indent.slice(0, -indentString.length);
            }
          }
        }
      }

      // 3. Injecter la nouvelle ligne et son incrément de formatage
      const newCode = textBeforeCursor + '\n' + indent + code.substring(end);
      onChange(newCode);

      // 4. Repositionner strictement le curseur à la fin de l'espacement généré
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
        }
      }, 0);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const indentString = (!settings || settings?.insertSpaces !== false) && settings?.tabSize !== 'tab'
        ? ' '.repeat(parseInt(settings?.tabSize || 4))
        : '\t';
      const newCode = code.substring(0, start) + indentString + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentString.length;
          updateCursorLine(textareaRef.current);
        }
      }, 0);
    }

    // Fallback cursor update on navigation keys
    const NavKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (NavKeys.includes(e.key)) {
      setTimeout(() => updateCursorLine(e.target), 0);
    }
  };

  const handleKeyUp = (e) => {
    const NavKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab'];
    if (!NavKeys.includes(e.key)) {
      autocomplete.handleInput(e);
      updateCursorLine(e.target);
    }
  };

  const handleClick = (e) => {
    autocomplete.handleInput(e);
    updateCursorLine(e.target);
  };
  const handleBlur = () => setTimeout(() => autocomplete.closeMenu(), 150);

  // Génération des numéros de ligne (avec forçage d'une hauteur supplémentaire pour le scrolling de fin)
  const linesCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: linesCount }, (_, i) => i + 1);

  // Analyse syntaxique purement UI mémorisée avec guides de structure
  const mappedLines = useMemo(() => {
    return tokenizeAndMapStructure(code);
  }, [code]);

  //  Snippets Constants 
  const FAST_SNIPPETS = [
    { label: "SI", insert: "SI " },
    { label: "POUR", insert: "POUR " },
    { label: "TANTQUE", insert: "TANTQUE " },
    { label: "LIRE", insert: "LIRE(" },
    { label: "ECRIRE", insert: "ECRIRE(" },
  ];

  const SNIPPET_CATEGORIES = [
    {
      name: "Structure",
      snippets: [
        { label: "ALGORITHME", insert: "ALGORITHME_MonProgramme;\nDEBUT\n  \nFIN" },
        { label: "DEBUT .. FIN", insert: "DEBUT\n  \nFIN" },
        { label: "CONSTANTES", insert: "CONSTANTES\n  " },
        { label: "VARIABLES", insert: "VARIABLES\n  " }
      ]
    },
    {
      name: "Conditions",
      snippets: [
        { label: "SI .. ALORS", insert: "SI (...) ALORS\n  \nFINSI" },
        { label: "SINON", insert: "SINON\n  " },
        { label: "SINONSI", insert: "SINONSI (...) ALORS\n  " },
        { label: "SELON", insert: "SELON (...) FAIRE\n  CAS ... :\n    \n  AUTRE :\n    \nFINSELON" }
      ]
    },
    {
      name: "Boucles",
      snippets: [
        { label: "POUR", insert: "POUR i ALLANT DE 0 A n - 1 FAIRE\n  \nFINPOUR" },
        { label: "TANTQUE", insert: "TANTQUE (...) FAIRE\n  \nFINTANTQUE" },
        { label: "REPETER", insert: "REPETER\n  \nJUSQUA (...)" }
      ]
    },
    {
      name: "Tableaux",
      snippets: [
        { label: "Tab simple", insert: "Tableau T[5] : ENTIER;" },
        { label: "Tab. dynamique", insert: "Tableau T[n];" },
        { label: "Matrice", insert: "Tableau M[3, 4] : ENTIER;" }
      ]
    },
    {
      name: "Enregistrements",
      snippets: [
        { label: "Struct. Type", insert: "Type MonType = Enregistrement\n  champ1 : CHAINE;\n  champ2 : ENTIER;\nFin MonType" },
        { label: "Var Record", insert: "Variable obj : MonType;" }
      ]
    }
  ];

  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);

  return (
    <div className="code-editor-wrapper">

      {/*  Gouttière (Lignes)  */}
      {settings?.lineNumbers !== false && (
        <div className="line-numbers" ref={lineNumbersRef} style={editorStyle}>
          {lineNumbers.map(num => (
            <div key={num} className={`line-number ${num === runningLine ? 'running-gutter' : ''}`}>
              {num === runningLine && <div className="running-arrow"></div>}
              {num}
            </div>
          ))}
          <div style={{ paddingBottom: '2rem' }}></div>
        </div>
      )}

      {/*  Calques d'édition superposés  */}
      <div className="editor-layers" style={editorStyle}>

        {/* Calque Arrière-plan (Coloré) */}
        <div
          className="highlight-layer shared-editor-styles"
          ref={highlightRef}
          aria-hidden="true"
        >
          {mappedLines.map((line, mappedIdx) => (
            <div
              key={line.lineId}
              className={`code-line-wrapper ${settings?.highlightActiveLine !== false && (mappedIdx + 1) === cursorLine ? 'active-line' : ''} ${(mappedIdx + 1) === runningLine ? 'running-line' : ''}`}
            >
              {settings?.renderIndentGuides !== false && line.guides.map((guide, idx) => (
                <span
                  key={idx}
                  className={`indent-guide ${guide.isError ? 'indent-guide-error' : ''}`}
                  style={{ left: `${guide.col}ch` }}
                />
              ))}
              {line.tokens.length === 0 && <span>&#8203;</span>}
              {line.tokens.map((token, i) => (
                <span key={i} className={`token ${token.type}`}>
                  {token.value}
                </span>
              ))}
            </div>
          ))}
          {/* Hack pour assurer que le curseur trouve sa place en fin de ligne */}
          <br />
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

      {/*  Mobile Snippets Bar & Drawer  */}
      {isMobile && (
        <div className="mobile-snippets-wrapper" onMouseDown={(e) => e.preventDefault()}>
          <div className="mobile-snippets-bar">
            {/* Bouton pour ouvrir le tiroir complet */}
            <button 
              className={`snippet-btn-more ${isSnippetDrawerOpen ? 'active' : ''}`}
              onClick={() => setIsSnippetDrawerOpen(!isSnippetDrawerOpen)}
            >
              {isSnippetDrawerOpen ? 'S Fermer' : 'ܰ +'}
            </button>
            {/* Raccourcis rapides */}
            {FAST_SNIPPETS.map(s => (
              <button key={s.label} onClick={() => insertSnippet(s.insert)}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Tiroir complet des snippets */}
          {isSnippetDrawerOpen && (
            <div className="mobile-snippets-drawer">
              <div className="drawer-content">
                {SNIPPET_CATEGORIES.map(cat => (
                  <div className="snippet-category" key={cat.name}>
                    <div className="category-title">{cat.name}</div>
                    <div className="category-buttons">
                      {cat.snippets.map(s => (
                        <button key={s.label} onClick={() => { insertSnippet(s.insert); setIsSnippetDrawerOpen(false); }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default CodeEditor;

