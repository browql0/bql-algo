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
 *   settings : object
 *              Réglages utilisateur (advancedArrayView, compactRecordView)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Search, List, ArrowRight } from 'lucide-react';
import './ArrayVisualizer.css';

// ── Formateur de contenu de case (Label Intelligent) ─────────────────────────
const formatCellContent = (v) => {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX';
  if (Array.isArray(v)) return '[...]';
  
  if (typeof v === 'object') {
    const safeString = (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return Array.isArray(val) ? '[...]' : '{...}';
      return String(val);
    };

    // Filtrer les valeurs non vides
    const validKeys = Object.keys(v).filter(k => k !== '__type' && safeString(v[k]).trim() !== '');
    if (validKeys.length === 0) return '∅';

    const commonLabels = ['nom', 'id', 'libelle', 'prenom', 'label', 'titre', 'name'];
    let mainLabel = null;
    let mainKey = null;

    for (const key of commonLabels) {
      if (v[key] !== undefined && v[key] !== null && safeString(v[key]).trim() !== '') {
        mainLabel = safeString(v[key]);
        mainKey = key;
        break;
      }
    }

    if (mainLabel !== null) {
      const otherKeys = validKeys.filter(k => k !== mainKey);
      if (otherKeys.length > 0) {
        const secondVal = safeString(v[otherKeys[0]]);
        return `[ ${mainLabel} | ${secondVal} ]`;
      }
      return `[ ${mainLabel} ]`;
    }

    if (validKeys.length > 0) {
      const firstVal = safeString(v[validKeys[0]]);
      if (validKeys.length > 1) {
        const secondVal = safeString(v[validKeys[1]]);
        return `[ ${firstVal} | ${secondVal} ]`;
      }
      return `[ ${firstVal} ]`;
    }

    if (v.__type) return `[ ${v.__type} ]`;
    return '{...}';
  }
  return String(v);
};

// ── Détermination de la classe de type ───────────────────────────────────────
const getTypeClass = (v) => {
  if (v === null || v === undefined) return 'av-type-null';
  if (typeof v === 'string') return 'av-type-string';
  if (typeof v === 'number') return 'av-type-number';
  if (typeof v === 'boolean') return 'av-type-boolean';
  if (typeof v === 'object') return 'av-type-object';
  return '';
};

// ── Inspecteur d'objet (Vue Détaillée Table-like) ──────────────────────────────────
const ObjectInspector = ({ data, depth = 0, highlightedField = null, rootName = null }) => {
  if (data === null || data === undefined) return <span className="av-val-null">vide</span>;
  if (typeof data !== 'object' || Array.isArray(data)) {
    const isString = typeof data === 'string';
    return (
      <span className={isString ? 'av-val-string' : 'av-val-num'}>
        {isString ? `"${data}"` : String(data)}
      </span>
    );
  }

  return (
    <div className="av-obj-inspector">
      {rootName && depth === 0 && (
        <div className="av-obj-root-header">
           <span className="av-obj-root-name">{rootName}</span>
           <div className="av-obj-root-divider"></div>
        </div>
      )}
      <div style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      {Object.entries(data).map(([key, val]) => {
        // Ignorer les propriétés privées comme __type
        if (key === '__type') return null;

        const isHighlighted = key === highlightedField;
        const isComplex = typeof val === 'object' && val !== null;

        return (
          <div key={key} className={`av-obj-line ${isHighlighted ? 'av-line-highlight' : ''}`}>
            {isComplex ? (
              <div className="av-obj-complex-group">
                <span className="av-obj-key-title">{key}</span>
                <ObjectInspector data={val} depth={depth + 1} />
              </div>
            ) : (
              <div className="av-obj-row">
                <span className="av-obj-key">{key}</span>
                <span className="av-obj-arrow">→</span>
                <span className="av-obj-val"><ObjectInspector data={val} /></span>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

// ── Composant d'une case unique ───────────────────────────────────────────────
const ArrayCell = ({ value, index, highlight, type, isSelected, onSelect, compactMode }) => {
  const [animClass, setAnimClass] = useState('');

  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);

  useEffect(() => {
    if (highlight && highlight.type) {
      setAnimClass(highlight.type === 'write' ? 'cell-write' : 'cell-read');
      const t = setTimeout(() => setAnimClass(''), 700);
      return () => clearTimeout(t);
    }
  }, [highlight]);

  return (
    <div className="av-cell-wrapper">
      <div
        className={`av-cell ${animClass} 
          ${isObject ? 'av-cell-object' : ''} 
          ${isSelected ? 'av-selected' : ''} 
          ${compactMode && isObject ? 'av-compact' : ''}
          ${getTypeClass(value)}`}
        onClick={() => onSelect(index)}
      >
        <div className="av-cell-content">
          <span className="av-cell-value">
            {formatCellContent(value)}
          </span>
        </div>
        {isObject && (
          <div className="av-cell-indicator">
            <Search size={12} strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="av-cell-index">{index}</div>
    </div>
  );
};

// ── Composant d'une ligne de matrice ───────────────────────────────────────────
const MatrixRow = ({ rowIndex, cols, highlight, selectedIndex, onSelect, compactRecordMode }) => {
  return (
    <div className="av-matrix-row">
      {/* En-tête de ligne (Index) */}
      <div className="av-matrix-row-header">{rowIndex}</div>
      {/* Cellules */}
      {cols.map((val, colIndex) => {
        const isLit = highlight && highlight.index && highlight.index[0] === rowIndex && highlight.index[1] === colIndex;
        const isSel = selectedIndex && selectedIndex[0] === rowIndex && selectedIndex[1] === colIndex;
        return (
          <ArrayCell
            key={colIndex}
            value={val}
            index={`${rowIndex},${colIndex}`}
            highlight={isLit ? highlight : null}
            isSelected={isSel}
            onSelect={() => onSelect([rowIndex, colIndex])}
            compactMode={compactRecordMode}
          />
        );
      })}
    </div>
  );
};

// ── Composant d'un tableau complet (Grille ou Strip) ──────────────────────────
const ArrayRow = ({ name, values, highlight, selectedIndex, onSelect, compactRecordMode }) => {
  const isEmpty = values.length === 0;
  const is2D = !isEmpty && Array.isArray(values[0]);

  return (
    <div className="av-array-card">
      <div className="av-array-card-header">
        <div className="av-card-title-group">
          <span className="av-array-name">{name}</span>
        </div>
        <div className="av-array-meta">
          {is2D
            ? `${values.length} × ${values[0]?.length || 0}`
            : `${values.length}`
          }
          <span style={{ opacity: 0.5, marginLeft: '4px', fontSize: '0.55rem' }}>
            {is2D ? 'MATRICE' : 'CASES'}
          </span>
        </div>
      </div>

      <div className="av-array-content-wrapper">
        {isEmpty ? (
          <span className="av-empty-msg">tableau vide</span>
        ) : is2D ? (
          <div className="av-matrix-container">
            {/* Colonnes Indices (Header) */}
            <div className="av-matrix-header-cols">
              <div className="av-matrix-corner"></div>
              {values[0].map((_, c) => (
                <div key={c} className="av-matrix-col-idx">{c}</div>
              ))}
            </div>
            {/* Lignes */}
            {values.map((rowArr, r) => (
              <MatrixRow
                key={r}
                rowIndex={r}
                cols={rowArr}
                highlight={highlight}
                selectedIndex={selectedIndex}
                onSelect={onSelect}
                compactRecordMode={compactRecordMode}
              />
            ))}
          </div>
        ) : (
          <div className="av-array-strip">
            {values.map((val, i) => (
              <ArrayCell
                key={i}
                value={val}
                index={i}
                highlight={highlight && highlight.index && (Array.isArray(highlight.index) ? highlight.index[0] : highlight.index) === i ? highlight : null}
                isSelected={selectedIndex && selectedIndex[0] === i}
                onSelect={() => onSelect([i])}
                compactMode={compactRecordMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ArrayVisualizer = ({ arrays, records, lastAction, visible, settings, isMobile }) => {
  const [selectedCell, setSelectedCell] = useState(null); // { arrayName, index: [row, col] }
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const panelRef = useRef(null);

  const advancedView = settings?.advancedArrayView !== false;
  const compactRecordMode = settings?.compactRecordView !== false;

  // Sync automatique de la sélection lors d'une modification de TABLEAU
  useEffect(() => {
    if (!arrays) return;
    for (const [name, data] of arrays.entries()) {
      if (data.highlight && data.highlight.type === 'write') {
        setSelectedCell({ arrayName: name, index: data.highlight.index, isArray: true });
        if (isMobile) setShowMobileDetails(true);
      }
    }
  }, [arrays, isMobile]);

  // Si on sélectionne manuellement une case, on ouvre le volet sur mobile
  const handleCellSelect = (idx, name) => {
    setSelectedCell({ arrayName: name, index: idx, isArray: true });
    if (isMobile) setShowMobileDetails(true);
  };

  if (!visible) return null;

  const arrayEntries = arrays ? [...arrays.entries()] : [];
  const recordEntries = records ? [...records.entries()] : [];
  const hasArrays = arrayEntries.length > 0;
  const hasRecords = recordEntries.length > 0;

  // Données de l'inspection active (si une case de tableau est cliquée)
  let activeArraySelection = null;
  if (selectedCell && selectedCell.isArray && arrays.has(selectedCell.arrayName)) {
    const arr = arrays.get(selectedCell.arrayName).values;
    const idx = selectedCell.index;
    const value = idx.length === 2 ? arr[idx[0]][idx[1]] : arr[idx[0]];
    const highlight = arrays.get(selectedCell.arrayName).highlight;
    const isLit = highlight && JSON.stringify(highlight.index) === JSON.stringify(idx);

    activeArraySelection = {
      name: `${selectedCell.arrayName}[${idx.join(',')}]`,
      value,
      type: value?.__type || 'Élément',
      highlightedField: isLit ? highlight.field : null
    };
  }

  const isBottomSheetOpen = isMobile ? showMobileDetails : (activeArraySelection !== null || hasRecords);

  return (
    <div className={`av-panel ${advancedView ? 'av-panel-advanced' : ''}`} ref={panelRef}>
      <div className="av-panel-header">
        <div className="av-panel-title">
          <span className="av-panel-icon">⊞</span>
          Visualisation des Structures
        </div>
        {lastAction && (
          <div className="av-last-action">
            <span className="av-action-dot" />
            {lastAction.text}
          </div>
        )}
      </div>

      <div className="av-panel-body">
        {/* Colonne GAUCHE : Tableaux & Matrices */}
        <div className="av-body-left">
          <div className="av-section-header">
            <List size={14} /> Tableaux & Matrices
          </div>
          {!hasArrays ? (
            <div className="av-no-arrays">
              <div className="av-no-arrays-icon">
                <Search size={28} />
              </div>
              <p>Aucun tableau ou matrice détecté.</p>
              <div className="av-no-arrays-example">
                <code>Tableau M[2,3] : ENTIER;</code>
              </div>
            </div>
          ) : (
            arrayEntries.map(([name, { values, highlight }]) => (
              <ArrayRow
                key={name}
                name={name}
                values={values}
                highlight={highlight}
                selectedIndex={selectedCell?.isArray && selectedCell?.arrayName === name ? selectedCell.index : null}
                onSelect={(idx) => handleCellSelect(idx, name)}
                compactRecordMode={compactRecordMode}
              />
            ))
          )}

          {/* Bouton mobile pour voir les enregistrements simples s'ils existent */}
          {isMobile && hasRecords && !showMobileDetails && (
            <button 
              className="av-mobile-record-toggle"
              onClick={() => setShowMobileDetails(true)}
            >
              <ChevronRight size={14} /> Voir les enregistrements ({recordEntries.length})
            </button>
          )}
        </div>

        {/* Colonne DROITE : Enregistrements Simples + Inspection (Bottom Sheet sur Mobile) */}
        <div className={`av-body-right ${isBottomSheetOpen ? 'is-open' : ''}`}>
          <div className="av-section-header mobile-sheet-header">
            <span><ChevronRight size={14} /> Enregistrements & Détails</span>
            {isBottomSheetOpen && (
              <button className="mobile-sheet-close" onClick={() => { setShowMobileDetails(false); setSelectedCell(null); }}>
                ✖ Fermer
              </button>
            )}
          </div>

          <div className="av-right-content">
            {/* 1. Zone d'inspection dynamique (si sélection tableau) */}
            {activeArraySelection && (
              <div className="av-inspector-panel av-inspector-active">
                <div className="av-inspector-content">
                  <ObjectInspector
                    data={activeArraySelection.value}
                    highlightedField={activeArraySelection.highlightedField}
                    rootName={activeArraySelection.name}
                  />
                </div>
              </div>
            )}

            {/* 2. Liste des records simples */}
            {hasRecords && (
              <div className="av-simple-records-list">
                {recordEntries.map(([name, { values, highlight }]) => (
                  <div key={name} className="av-inspector-card">
                    <div className="av-inspector-content">
                      <ObjectInspector
                        data={values}
                        highlightedField={highlight?.field}
                        rootName={name}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!activeArraySelection && !hasRecords && (
              <div className="av-inspector-empty">
                <div className="av-inspector-empty-inner">
                  <Search size={32} className="av-empty-icon-animated" />
                  <h4>Données Statiques</h4>
                  <p>Sélectionnez une case à gauche pour examiner son contenu détaillé.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrayVisualizer;
