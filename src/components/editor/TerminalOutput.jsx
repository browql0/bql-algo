import React, { useRef, useEffect } from 'react';
import './TerminalOutput.css';

/**
 * TerminalOutput
 * Affiche les sorties ECRIRE() sous forme de terminal.
 *
 * @param {{ lines: string[], settings: object }} props
 *   lines    ? tableau de chaînes produites par l'interprêteur
 *   settings ? préférences de l'éditeur (fontSize, fontFamily, theme)
 */
const TerminalOutput = ({ lines = [], settings }) => {
  const terminalRef = useRef(null);

  const terminalStyle = {
    fontSize: `${settings?.fontSize || 14}px`,
    fontFamily: settings?.fontFamily === 'fira'     ?"'Fira Code', monospace" :
                settings?.fontFamily === 'consolas' ?"'Consolas', monospace"  :
                "'JetBrains Mono', monospace",
  };

  // Auto-scroll vers le bas à chaque nouvelle sortie
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className={`terminal-container theme-${settings?.theme || 'hacker'}`}>
      <div className="terminal-output" ref={terminalRef} style={terminalStyle}>
        {lines.length === 0 ?(
          <span className="terminal-empty">En attente d'exécution?</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="terminal-line">
              <span className="terminal-prompt">{'>'}</span>
              <span className="terminal-text">{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;


