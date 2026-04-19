import React, { useMemo, useState, useEffect, useRef } from 'react';
import './ErrorPanel.css';
import { ChevronDown, ChevronRight, AlertCircle, XCircle, BrainCircuit, Zap, Copy, Check } from 'lucide-react';

/**
 * ErrorPanel
 * Affiche toutes les erreurs collectées par le pipeline (lex + syntax + semantic + runtime)
 *
 * @param {{
 *   errors:     object[],
 *   onErrorClick: function,
 *   settings:     object
 * }} props
 */
const ErrorPanel = ({ errors = [], onErrorClick, settings = {} }) => {
  const [visibleLimit, setVisibleLimit] = useState(10);
  const bottomRef = useRef(null);

  // Scroll to bottom when errors list is updated or expanded
  useEffect(() => {
    if (bottomRef.current && errors.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [errors.length, visibleLimit]);

  const summary = useMemo(() => {
    const counts = { lexical: 0, syntax: 0, semantic: 0, runtime: 0, other: 0 };
    for (const err of errors) {
      const key = err.type ?? 'other';
      if (key in counts) counts[key]++;
      else               counts.other++;
    }
    return counts;
  }, [errors]);

  // Tri par ligne (croissant)
  const sorted = [...errors].sort(
    (a, b) => ((a.line ?? 0) - (b.line ?? 0)) || ((a.column ?? 0) - (b.column ?? 0))
  );

  // Grouping (Lot 3 - groupSimilarErrors)
  const grouped = useMemo(() => {
    if (settings.groupSimilarErrors) {
      // Grouper par message exact pour réduire le bruit
      const map = new Map();
      sorted.forEach(err => {
        if (!map.has(err.message)) map.set(err.message, []);
        map.get(err.message).push(err);
      });
      return { groupedByMessage: Array.from(map.entries()) };
    }

    return {
      syntax: sorted.filter(e => e.type === 'syntax' || e.type === 'lexical'),
      semantic: sorted.filter(e => e.type === 'semantic'),
      runtime: sorted.filter(e => e.type === 'runtime'),
      other: sorted.filter(e => !['syntax', 'lexical', 'semantic', 'runtime'].includes(e.type))
    };
  }, [sorted, settings.groupSimilarErrors]);

  const visibleErrors = sorted.slice(0, visibleLimit);
  const hasMore = sorted.length > visibleLimit;
  if (errors.length === 0) {
    return (
      <div className="error-panel error-panel--empty">
        <div className="error-panel__empty-icon">OK</div>
        <p>Aucune erreur détectée. Votre programme est correct.</p>
      </div>
    );
  }  
  const renderGroup = (title, groupErrors, typeIcon, typeColor) => {
    if (groupErrors.length === 0) return null;
    
    // We only take what belongs to this group out of the globally sliced 'visibleErrors'
    // To keep it simple: we just render those from groupErrors that are in 'visibleErrors'
    const toShow = groupErrors.filter(err => visibleErrors.includes(err));
    if (toShow.length === 0) return null;

    return (
      <div key={title} className="error-group">
        <div className={`error-group__header`} style={{ borderLeftColor: typeColor }}>
          <span className="error-group__icon" style={{ color: typeColor }}>{typeIcon}</span>
          <span className="error-group__title">{title}</span>
          <span className="error-group__count">{groupErrors.length}</span>
        </div>
        <div className="error-group__list">
          {toShow.map((err) => {
            const globalIndex = sorted.indexOf(err);
            return (
              <ErrorCard 
                key={`${err.type}-${err.line}-${err.column}-${globalIndex}`} 
                error={err} 
                index={globalIndex + 1}
                onClick={() => onErrorClick && onErrorClick(err.line, err.column)}
                settings={settings}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="error-panel">
      <div className="error-panel__header">
        <div className="error-panel__header-top">
          <span className="error-panel__count-badge">
            <XCircle size={14} className="inline-icon" /> {errors.length} erreur{errors.length > 1 ?'s' : ''} détectée{errors.length > 1 ?'s' : ''}
          </span>
          <span className="error-panel__subtitle">
            Corrigez les erreurs ci-dessous avant d'exécuter.
          </span>
        </div>
        
        <div className="error-panel__category-badges">
          {summary.lexical  > 0 && <CategoryBadge type="lexical"  count={summary.lexical}  />}
          {summary.syntax   > 0 && <CategoryBadge type="syntax"   count={summary.syntax}   />}
          {summary.semantic > 0 && <CategoryBadge type="semantic" count={summary.semantic} />}
          {summary.runtime  > 0 && <CategoryBadge type="runtime"  count={summary.runtime}  />}
        </div>
      </div>

      <div className="error-panel__list-container">
        {settings.groupSimilarErrors ?(
          grouped.groupedByMessage.map(([msg, groupErrors]) => 
            renderGroup(msg, groupErrors, <AlertCircle size={14}/>, '#94a3b8')
          )
        ) : (
          <>
            {renderGroup("Erreurs Syntaxiques & Lexicales", grouped.syntax, <XCircle size={14}/>, '#ef4444')}
            {renderGroup("Erreurs Sémantiques", grouped.semantic, <BrainCircuit size={14}/>, '#a78bfa')}
            {renderGroup("Erreurs d'Exécution", grouped.runtime, <Zap size={14}/>, '#fb923c')}
            {renderGroup("Autres Erreurs", grouped.other, <AlertCircle size={14}/>, '#94a3b8')}
          </>
        )}

        {hasMore && (
          <button 
            className="error-panel__show-more"
            onClick={() => setVisibleLimit(prev => prev + 10)}
          >
            Afficher {Math.min(10, sorted.length - visibleLimit)} erreurs suivantes...
          </button>
        )}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

const CATEGORY_META = {
  lexical:  { icon: '🔤', label: 'Lexicale'   },
  syntax:   { icon: '📐', label: 'Syntaxique'  },
  semantic: { icon: '🧠', label: 'Sémantique'  },
  runtime:  { icon: 'Rapide', label: 'Exécution'   },
};

const CategoryBadge = ({ type, count }) => {
  const meta = CATEGORY_META[type] ?? { icon: '❌', label: type };
  return (
    <span className={`error-panel__cat-badge error-panel__cat-badge--${type}`}>
      {meta.icon} {count} {meta.label}
    </span>
  );
};

const ERROR_META = {
  lexical:  { icon: <AlertCircle size={14} />, label: 'Lexicale' },
  syntax:   { icon: <XCircle size={14} />,     label: 'Syntax' },
  semantic: { icon: <BrainCircuit size={14} /> ,label: 'Sémantique' },
  runtime:  { icon: <Zap size={14} /> ,          label: "Exécution" },
};

const ErrorCard = ({ error, index, onClick, settings = {} }) => {
  const [expanded, setExpanded] = useState(index <= 3 || settings.errorDetailLevel === 'high'); 
  const [copied, setCopied] = useState(false);
  const meta = ERROR_META[error.type] ?? { icon: <AlertCircle size={14}/>, label: 'Erreur' };

  const handleCopy = (e) => {
    e.stopPropagation();
    const textToCopy = `Erreur ${error.type ?? 'inconnue'} (Ligne ${error.line ?? '?'}): ${error.message}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`error-card error-card--${error.type ?? 'unknown'}`}>
      <div
        className="error-card__header"
        onClick={() => {
          // If clicked natively it expands/collapses. 
          // If the user wants to jump, they click the row.
          // Let's make the whole header jump to line, AND toggle expand if desired.
          // Usually in VS Code clicking focuses the line.
          onClick();
          setExpanded(e => !e);
        }}
        role="button"
        aria-expanded={expanded}
        title="Cliquer pour voir la ligne"
      >
        <span className="error-card__toggle-chevron">
          {expanded ?<ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </span>
        <span className="error-card__icon">{meta.icon}</span>
        <span className="error-card__message-preview">{error.message.split('\n')[0]}</span>
        
        {error.position && (
          <span className="error-card__position">
            Ln {error.line ?? '?'}
          </span>
        )}

        <button 
          className="error-card__copy-btn" 
          onClick={handleCopy} 
          title="Copier l'erreur"
        >
          {copied ?<Check size={14} color="#34d399" /> : <Copy size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="error-card__body">
          {error.codeLine && (
            <div className="error-card__code-block">
              <pre className="error-card__code-line">{error.codeLine}</pre>
              {error.arrow && (
                <pre className="error-card__arrow">{error.arrow}</pre>
              )}
            </div>
          )}

          <p className="error-card__message-full">{error.message}</p>

          {error.hint && (
            <div className="error-card__hint">
              <span className="error-card__hint-icon">Astuce</span>
              <span className="error-card__hint-text">{error.hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorPanel;


