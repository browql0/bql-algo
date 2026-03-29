import React, { useMemo, useState } from 'react';
import './ErrorPanel.css';

/**
 * ErrorPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Affiche toutes les erreurs collectées par le pipeline (lex + syntax + semantic + runtime)
 * de manière pédagogique, avec résumé par catégorie et cartes dépliables.
 *
 * @param {{
 *   errors:     object[],  // Tableau d'objets retournés par formatErrorReact()
 *   sourceCode: string,    // Code source brut (optionnel, pour contexte)
 * }} props
 */
const ErrorPanel = ({ errors = [], sourceCode = '' }) => {

  // ── Résumé par catégorie ─────────────────────────────────────────────────
  const summary = useMemo(() => {
    const counts = { lexical: 0, syntax: 0, semantic: 0, runtime: 0, other: 0 };
    for (const err of errors) {
      const key = err.type ?? 'other';
      if (key in counts) counts[key]++;
      else               counts.other++;
    }
    return counts;
  }, [errors]);

  // ── État vide ─────────────────────────────────────────────────────────────
  if (errors.length === 0) {
    return (
      <div className="error-panel error-panel--empty">
        <div className="error-panel__empty-icon">✅</div>
        <p>Aucune erreur détectée. Votre programme est correct.</p>
      </div>
    );
  }

  // ── Tri par ligne puis colonne (déjà fait par executeCode, sécurité en plus) ──
  const sorted = [...errors].sort(
    (a, b) => ((a.line ?? 0) - (b.line ?? 0)) || ((a.column ?? 0) - (b.column ?? 0))
  );

  return (
    <div className="error-panel">

      {/* En-tête global */}
      <div className="error-panel__header">
        <span className="error-panel__count-badge">
          ❌ {errors.length} erreur{errors.length > 1 ? 's' : ''} détectée{errors.length > 1 ? 's' : ''}
        </span>
        <span className="error-panel__subtitle">
          Corrigez les erreurs ci-dessous avant d'exécuter le programme.
        </span>

        {/* Badges par catégorie */}
        <div className="error-panel__category-badges">
          {summary.lexical  > 0 && <CategoryBadge type="lexical"  count={summary.lexical}  />}
          {summary.syntax   > 0 && <CategoryBadge type="syntax"   count={summary.syntax}   />}
          {summary.semantic > 0 && <CategoryBadge type="semantic" count={summary.semantic} />}
          {summary.runtime  > 0 && <CategoryBadge type="runtime"  count={summary.runtime}  />}
        </div>
      </div>

      {/* Liste des erreurs */}
      {sorted.map((err, i) => (
        <ErrorCard key={`${err.type}-${err.line}-${err.column}-${i}`} error={err} index={i + 1} />
      ))}
    </div>
  );
};

// ── Badge de catégorie ────────────────────────────────────────────────────────

const CATEGORY_META = {
  lexical:  { icon: '🔤', label: 'Lexicale'   },
  syntax:   { icon: '📐', label: 'Syntaxique'  },
  semantic: { icon: '🧠', label: 'Sémantique'  },
  runtime:  { icon: '⚡', label: 'Exécution'   },
};

const CategoryBadge = ({ type, count }) => {
  const meta = CATEGORY_META[type] ?? { icon: '❌', label: type };
  return (
    <span className={`error-panel__cat-badge error-panel__cat-badge--${type}`}>
      {meta.icon} {count} {meta.label}
    </span>
  );
};

// ── Icônes et labels par type d'erreur ───────────────────────────────────────

const ERROR_META = {
  lexical:  { icon: '🔤', label: 'Erreur Lexicale'      },
  syntax:   { icon: '📐', label: 'Erreur Syntaxique'    },
  semantic: { icon: '🧠', label: 'Erreur Sémantique'    },
  runtime:  { icon: '⚡', label: "Erreur d'Exécution"   },
};

// ── Carte d'erreur individuelle ───────────────────────────────────────────────

const ErrorCard = ({ error, index }) => {
  const [expanded, setExpanded] = useState(true);
  const meta = ERROR_META[error.type] ?? { icon: '❌', label: 'Erreur' };

  return (
    <div className={`error-card error-card--${error.type ?? 'unknown'}`}>

      {/* En-tête cliquable */}
      <div
        className="error-card__header"
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
      >
        <span className="error-card__index">#{index}</span>
        <span className="error-card__icon">{meta.icon}</span>
        <span className="error-card__type-label">{meta.label}</span>
        {error.position && (
          <span className="error-card__position">
            📍 {error.position}
          </span>
        )}
        <span className="error-card__toggle">{expanded ? '▾' : '▸'}</span>
      </div>

      {/* Corps dépliable */}
      {expanded && (
        <div className="error-card__body">

          {/* Ligne de code source + flèche ^ */}
          {error.codeLine && (
            <div className="error-card__code-block">
              <pre className="error-card__code-line">{error.codeLine}</pre>
              {error.arrow && (
                <pre className="error-card__arrow">{error.arrow}</pre>
              )}
            </div>
          )}

          {/* Message principal */}
          <p className="error-card__message">{error.message}</p>

          {/* Suggestion pédagogique */}
          {error.hint && (
            <div className="error-card__hint">
              <span className="error-card__hint-icon">💡</span>
              <span className="error-card__hint-text">{error.hint}</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ErrorPanel;
