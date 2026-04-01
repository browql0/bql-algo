/**
 * ArrayVisualizer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Panneau pédagogique de visualisation des tableaux 1D pour débutants.
 *
 * Props :
 *   arrays   : Map<string, { values: any[], highlight: { index, type } | null }>
 *              Données actuelles des tableaux (nom → {values, highlight})
 *   lastAction : { text: string } | null
 *              Dernier message pédagogique (ex: "Modification de T[2]")
 *   visible  : boolean
 *              Contrôlé par les Settings (option activable)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef, useState } from 'react';
import './ArrayVisualizer.css';

// ── Composant d'une case unique ───────────────────────────────────────────────
const ArrayCell = ({ value, index, highlight, type }) => {
  const [animClass, setAnimClass] = useState('');

  // Déclenche l'animation sur chaque changement de highlight
  useEffect(() => {
    if (highlight) {
      setAnimClass(type === 'write' ? 'cell-write' : 'cell-read');
      const t = setTimeout(() => setAnimClass(''), 700);
      return () => clearTimeout(t);
    }
  }, [highlight, type]);

  const displayVal = value === undefined || value === null
    ? '—'
    : typeof value === 'boolean'
      ? (value ? 'VRAI' : 'FAUX')
      : String(value);

  return (
    <div className={`av-cell-wrapper`}>
      <div className={`av-cell ${animClass}`} title={`Index ${index} = ${displayVal}`}>
        <span className="av-cell-value">{displayVal}</span>
      </div>
      <div className="av-cell-index">{index}</div>
    </div>
  );
};

// ── Composant d'un tableau complet ────────────────────────────────────────────
const ArrayRow = ({ name, values, highlight }) => {
  const isEmpty = values.length === 0;
  const is2D = !isEmpty && Array.isArray(values[0]);

  // highlight.index est maintenant un tableau : [idx] ou [row, col]
  const isHighlighted = (r, c) => {
    if (!highlight || !highlight.index) return false;
    if (is2D) return highlight.index[0] === r && highlight.index[1] === c;
    
    // Rétrocompatibilité au cas où l'index serait un simple entier
    const targetIdx = Array.isArray(highlight.index) ? highlight.index[0] : highlight.index;
    return targetIdx === r;
  };

  return (
    <div className="av-array-block">
      <div className="av-array-header">
        <span className="av-array-name">{name}</span>
        <span className="av-array-meta">
          {is2D 
            ? `[${values.length} x ${values[0]?.length || 0}]`
            : `[${values.length} case${values.length > 1 ? 's' : ''}]`
          }
        </span>
      </div>
      <div className="av-array-strip" style={is2D ? { flexDirection: 'column', gap: '8px' } : {}}>
        {isEmpty ? (
          <span className="av-empty-msg">tableau vide</span>
        ) : is2D ? (
          values.map((rowArr, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', gap: '8px' }}>
              {rowArr.map((val, colIndex) => (
                <ArrayCell
                  key={`${rowIndex}-${colIndex}`}
                  value={val}
                  index={`${rowIndex},${colIndex}`}
                  highlight={isHighlighted(rowIndex, colIndex)}
                  type={isHighlighted(rowIndex, colIndex) ? highlight.type : null}
                />
              ))}
            </div>
          ))
        ) : (
          values.map((val, i) => (
            <ArrayCell
              key={i}
              value={val}
              index={i}
              highlight={isHighlighted(i, null)}
              type={isHighlighted(i, null) ? highlight.type : null}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
const ArrayVisualizer = ({ arrays, lastAction, visible }) => {
  const panelRef = useRef(null);

  if (!visible) return null;

  const entries = arrays ? [...arrays.entries()] : [];
  const hasArrays = entries.length > 0;

  return (
    <div className="av-panel" ref={panelRef}>
      {/* En-tête */}
      <div className="av-panel-header">
        <div className="av-panel-title">
          <span className="av-panel-icon">⊞</span>
          Visualisation des Tableaux
        </div>
        {lastAction && (
          <div className="av-last-action">
            <span className="av-action-dot" />
            {lastAction.text}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="av-panel-body">
        {!hasArrays ? (
          <div className="av-no-arrays">
            <div className="av-no-arrays-icon">[ ]</div>
            <p>Aucun tableau détecté.</p>
            <p className="av-no-arrays-hint">
              Déclarez un tableau dans votre code :<br />
              <code>Tableau T[5] : ENTIER;</code>
            </p>
          </div>
        ) : (
          entries.map(([name, { values, highlight }]) => (
            <ArrayRow
              key={name}
              name={name}
              values={values}
              highlight={highlight}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ArrayVisualizer;
