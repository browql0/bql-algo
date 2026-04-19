import React from 'react';
import { TerminalSquare } from 'lucide-react';

const EditorStatusBar = ({ activeFile, formatMessage }) => {
  const totalLines = activeFile.content.split('\n').length;
  const lastLineCol =
    activeFile.content.length - activeFile.content.lastIndexOf('\n');

  return (
    <footer className="editor-statusbar">
      <div className="status-left">
        <span className="status-item">
          <TerminalSquare size={14} /> BQL-Strict
        </span>
        <span className="status-item">UTF-8</span>
        <span className="status-item success"> Serveur Connecté</span>
        {formatMessage && (
          <span
            className="status-item"
            style={{ color: '#34d399', fontWeight: 'bold' }}
          >
            ? {formatMessage}
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">
          Ln {totalLines}, Col {lastLineCol}
        </span>
        <span className="status-item">Espaces: 2</span>
      </div>
    </footer>
  );
};

export default EditorStatusBar;
