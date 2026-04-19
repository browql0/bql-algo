import React, { useState } from 'react';
import {
  Info, AlertTriangle, Lightbulb, BookOpen, Play, CheckCircle,
  ChevronRight, Code2, Cpu, Zap, Hash, Copy, Check,
  GitBranch, RefreshCw, Database, Layers, ArrowRight, RotateCcw, Target
} from 'lucide-react';

// ─── Syntax Highlighter ────────────────────────────────────────────────────────

const renderMockSyntax = (code) => {
  if (!code) return null;
  const KEYWORDS = ['ALGORITHME', 'VARIABLES', 'VARIABLE', 'DEBUT', 'FIN', 'SI', 'ALORS', 'SINON',
    'FINSI', 'POUR', 'DE', 'A', 'FAIRE', 'FINPOUR', 'TANTQUE', 'FINTANTQUE', 'REPETER', 'JUSQU',
    'SELON', 'CAS', 'AUTRE', 'FINSELON', 'TYPE', 'ENREGISTREMENT', 'CONSTANTE', 'CONSTANTES',
    'ET', 'OU', 'NON', 'MOD'];
  const FUNCTIONS = ['ECRIRE', 'LIRE'];
  const TYPES = ['ENTIER', 'REEL', 'CHAINE', 'CARACTERE', 'BOOLEEN', 'Tableau'];
  const CONSTANTS = ['VRAI', 'FAUX'];

  return code.split('\n').map((line, li) => {
    const tokens = [];
    let i = 0;
    while (i < line.length) {
      if (line.slice(i).startsWith('//')) { tokens.push({ type: 'comment', v: line.slice(i) }); break; }
      if (line[i] === '"') {
        const end = line.indexOf('"', i + 1);
        const val = end === -1 ? line.slice(i) : line.slice(i, end + 1);
        tokens.push({ type: 'string', v: val }); i += val.length; continue;
      }
      const num = line.slice(i).match(/^\d+(\.\d+)?/);
      if (num) { tokens.push({ type: 'number', v: num[0] }); i += num[0].length; continue; }
      const word = line.slice(i).match(/^[a-zA-ZÀ-ÿ_]\w*/);
      if (word) {
        const w = word[0]; const wu = w.toUpperCase();
        let type = 'identifier';
        if (KEYWORDS.includes(wu)) type = 'keyword';
        else if (FUNCTIONS.includes(wu)) type = 'function';
        else if (TYPES.includes(wu) || TYPES.includes(w)) type = 'type';
        else if (CONSTANTS.includes(wu)) type = 'constant';
        tokens.push({ type, v: w }); i += w.length; continue;
      }
      const op = line.slice(i).match(/^(<-|<>|<=|>=|[<>=+\-*/])/);
      if (op) { tokens.push({ type: 'operator', v: op[0] }); i += op[0].length; continue; }
      if ('[]();:,.'.includes(line[i])) { tokens.push({ type: 'punct', v: line[i] }); i++; continue; }
      tokens.push({ type: 'ws', v: line[i] }); i++;
    }
    const C = {
      keyword: '#c084fc', function: '#60a5fa', type: '#fb7185', constant: '#f97316',
      string: '#4ade80', number: '#facc15', comment: '#475569',
      identifier: '#e2e8f0', operator: '#94a3b8', punct: '#64748b', ws: 'inherit'
    };
    return (
      <div key={li} style={{ lineHeight: '1.75', minHeight: '1.4em' }}>
        {tokens.map((t, ti) => (
          <span key={ti} style={{
            color: C[t.type] || '#e4e7ec',
            fontWeight: t.type === 'keyword' ? 700 : 'inherit',
            fontStyle: t.type === 'comment' ? 'italic' : 'inherit'
          }}>{t.v}</span>
        ))}
      </div>
    );
  });
};

// ─── CodeBlock ─────────────────────────────────────────────────────────────────

export const CodeBlock = ({ code, title = 'exemple.bql', onTry, label = 'Essayer', isExercise = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };

  return (
    <div style={{
      background: '#0b1120',
      border: `1px solid ${isExercise ? 'rgba(79,143,240,0.35)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem',
      boxShadow: isExercise ? '0 0 24px rgba(79,143,240,0.08)' : '0 4px 24px rgba(0,0,0,0.25)',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Toolbar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ display: 'flex', gap: '5px' }}>
            {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </span>
          <Code2 size={12} color="#475569" />
          <span style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace' }}>{title}</span>
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)', color: copied ? '#34d399' : '#64748b', border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px', padding: '0.22rem 0.55rem', fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copié !' : 'Copier'}
          </button>
          {onTry && (
            <button onClick={onTry} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: isExercise ? 'rgba(79,143,240,0.9)' : 'rgba(79,143,240,0.12)', color: isExercise ? '#fff' : '#4f8ff0', border: `1px solid ${isExercise ? 'transparent' : 'rgba(79,143,240,0.25)'}`, borderRadius: '7px', padding: '0.22rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <Play size={10} fill="currentColor" /> {label}
            </button>
          )}
        </div>
      </div>
      {/* Code */}
      <div style={{ padding: '1.2rem 1.5rem', fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace", fontSize: '0.875rem', lineHeight: '1.75', overflowX: 'auto' }}>
        {renderMockSyntax(code)}
      </div>
    </div>
  );
};

// ─── InfoCard ──────────────────────────────────────────────────────────────────

const C2RGB = { '#4f8ff0': '79,143,240', '#34d399': '52,211,153', '#a78bfa': '167,139,250', '#c084fc': '192,132,252', '#facc15': '250,204,21', '#fb7185': '251,113,133', '#4ade80': '74,222,128', '#60a5fa': '96,165,250' };

export const InfoCard = ({ icon, title, children, color = '#4f8ff0' }) => {
  const rgb = C2RGB[color] || '79,143,240';
  return (
    <div style={{ background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.18)`, borderLeft: `3px solid ${color}`, borderRadius: '12px', padding: '1.1rem 1.4rem', marginBottom: '1.1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ color, flexShrink: 0, marginTop: '1px' }}>{icon || <Info size={17} />}</div>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: '0.76rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.45rem' }}>{title}</div>}
        <div style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.75' }}>{children}</div>
      </div>
    </div>
  );
};

export const WarningCard = ({ children, title = 'Erreur fréquente' }) => (
  <InfoCard icon={<AlertTriangle size={17} />} title={title} color="#fb7185">{children}</InfoCard>
);

export const TipCard = ({ children, title = 'Astuce' }) => (
  <InfoCard icon={<Lightbulb size={17} />} title={title} color="#facc15">{children}</InfoCard>
);

// ─── SummaryCard ───────────────────────────────────────────────────────────────

export const SummaryCard = ({ items }) => (
  <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '14px', padding: '1.4rem 1.6rem', marginBottom: '2rem', marginTop: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#34d399', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      <CheckCircle size={15} /> Résumé — À retenir
    </div>
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.93rem', color: '#cbd5e1', lineHeight: '1.65' }}>
          <span style={{ color: '#34d399', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ─── LessonSection ─────────────────────────────────────────────────────────────

export const LessonSection = ({ icon, title, children, accent = '#4f8ff0', step }) => (
  <section style={{ marginBottom: '2.8rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.1rem', paddingBottom: '0.7rem', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      {step !== undefined && (
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${accent}22`, border: `1.5px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: accent, flexShrink: 0 }}>{step}</div>
      )}
      <span style={{ color: accent, flexShrink: 0 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#e4e7ec', letterSpacing: '-0.2px' }}>{title}</h3>
    </div>
    <div style={{ color: '#cbd5e1', lineHeight: '1.85', fontSize: '0.97rem' }}>{children}</div>
  </section>
);

// ─── FlowDiagram ───────────────────────────────────────────────────────────────

export const FlowDiagram = ({ steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', margin: '1.5rem 0', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.4rem 1.6rem', overflowX: 'auto' }}>
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ background: `${step.accent || '#4f8ff0'}18`, border: `1.5px solid ${step.accent || '#4f8ff0'}55`, borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: step.accent || '#4f8ff0', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
            {step.label}
          </div>
          {step.sub && <div style={{ fontSize: '0.68rem', color: '#475569', textAlign: 'center', maxWidth: '100px' }}>{step.sub}</div>}
        </div>
        {i < steps.length - 1 && <ArrowRight size={14} color="#334155" style={{ flexShrink: 0 }} />}
      </React.Fragment>
    ))}
  </div>
);

// ─── LoopDiagram ──────────────────────────────────────────────────────────────

export const LoopDiagram = ({ type: _type = 'pour', initLabel = 'Init', condLabel = 'Condition', bodyLabel = 'Corps', updateLabel = 'Update' }) => (
  <div style={{ margin: '1.5rem 0', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
      <LoopNode label={initLabel} color="#c084fc" />
      <ArrowRight size={14} color="#334155" />
      <LoopNode label={condLabel} color="#facc15" diamond />
      <ArrowRight size={14} color="#334155" />
      <LoopNode label={bodyLabel} color="#4f8ff0" />
      <ArrowRight size={14} color="#334155" />
      <LoopNode label={updateLabel} color="#34d399" />
    </div>
    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '8px', display: 'flex', gap: '1.5rem' }}>
      <span style={{ color: '#34d399' }}>↑ Boucle si condition VRAIE</span>
      <span style={{ color: '#fb7185' }}>→ Sortie si condition FAUSSE</span>
    </div>
    <div style={{ width: '85%', height: '1px', background: 'repeating-linear-gradient(90deg, #34d399 0, #34d399 6px, transparent 6px, transparent 12px)', borderRadius: '1px', marginTop: '2px' }} />
  </div>
);

const LoopNode = ({ label, color, diamond }) => (
  <div style={{
    background: `${color}18`, border: `1.5px solid ${color}55`,
    borderRadius: diamond ? '6px' : '10px', padding: '0.45rem 0.9rem',
    fontSize: '0.78rem', fontWeight: 700, color, whiteSpace: 'nowrap',
    fontFamily: "'JetBrains Mono', monospace",
    transform: diamond ? 'rotate(5deg) skew(-8deg)' : 'none'
  }}>{label}</div>
);

// ─── VariableDiagram ──────────────────────────────────────────────────────────

export const VariableDiagram = ({ vars = [] }) => (
  <div style={{ margin: '1.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
    {vars.map(({ name, type, value, color = '#4f8ff0' }, i) => (
      <div key={i} style={{ background: 'rgba(11,17,32,0.8)', border: `1px solid ${color}33`, borderRadius: '12px', padding: '0.9rem 1.2rem', minWidth: '140px', flex: '1' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Variable</div>
        <div style={{ fontFamily: 'monospace', fontWeight: 700, color, fontSize: '1.05rem', marginBottom: '0.2rem' }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Type : <span style={{ color: '#fb7185' }}>{type}</span></div>
        <div style={{ background: `${color}14`, border: `1px solid ${color}33`, borderRadius: '6px', padding: '0.25rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', color, fontSize: '0.9rem', fontWeight: 700 }}>{value}</div>
      </div>
    ))}
  </div>
);

// ─── TableauDiagram ────────────────────────────────────────────────────────────

export const TableauDiagram = ({ values, name = 'T', color = '#4f8ff0' }) => (
  <div style={{ margin: '1.5rem 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.4rem 1.6rem', minWidth: 'fit-content' }}>
      <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', marginBottom: '0.8rem' }}>{name}[{values.length}] : ENTIER</div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
        {values.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '44px' }}>
            <div style={{ background: `${color}15`, border: `1.5px solid ${color}44`, borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color, fontSize: '0.95rem', width: '100%' }}>{v}</div>
            <div style={{ fontSize: '0.68rem', color: '#475569' }}>{name}[{i}]</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── MatriceDiagram ───────────────────────────────────────────────────────────

export const MatriceDiagram = ({ matrix, name = 'M', color = '#a78bfa' }) => (
  <div style={{ margin: '1.5rem 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.4rem 1.6rem', minWidth: 'fit-content' }}>
      <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', marginBottom: '0.8rem' }}>{name}[{matrix.length}, {matrix[0]?.length}] : ENTIER</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#475569', width: '20px', textAlign: 'right', fontFamily: 'monospace', flexShrink: 0 }}>L{i}</span>
            {row.map((v, j) => (
              <div key={j} style={{ minWidth: '52px', background: `${color}15`, border: `1.5px solid ${color}44`, borderRadius: '7px', padding: '0.45rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color, fontSize: '0.82rem' }}>
                {v}<br /><span style={{ fontSize: '0.55rem', color: '#475569' }}>[{i}, {j}]</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── BranchDiagram ────────────────────────────────────────────────────────────

export const BranchDiagram = ({ condition, trueLabel, falseLabel }) => (
  <div style={{ margin: '1.5rem 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', minWidth: '260px' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
        <span style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', padding: '0.4rem 1.2rem', color: '#facc15', fontWeight: 700 }}>{condition}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ color: '#34d399', fontSize: '1.2rem' }}>↙</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.1em' }}>✓ VRAI</div>
          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: '#34d399', textAlign: 'center', minWidth: '90px' }}>{trueLabel}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ color: '#fb7185', fontSize: '1.2rem' }}>↘</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fb7185', letterSpacing: '0.1em' }}>✗ FAUX</div>
          <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '8px', padding: '0.5rem 0.9rem', color: '#fb7185', textAlign: 'center', minWidth: '90px' }}>{falseLabel}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─── ExerciseBlock ────────────────────────────────────────────────────────────

export const ExerciseBlock = ({ text, onTry, code }) => (
  <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, rgba(79,143,240,0.06), rgba(167,139,250,0.04))', border: '1px solid rgba(79,143,240,0.22)', borderRadius: '18px', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(79,143,240,0.1), transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.2rem' }}>
      <div style={{ background: 'rgba(79,143,240,0.15)', borderRadius: '10px', padding: '0.5rem', color: '#4f8ff0' }}><Cpu size={18} /></div>
      <div>
        <div style={{ fontWeight: 800, color: '#e4e7ec', fontSize: '1.1rem' }}> 🧪 Exercice pratique</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>Appliquez ce que vous venez d'apprendre</div>
      </div>
    </div>
    <p style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '1.6rem', fontSize: '0.97rem' }}>{text}</p>
    {code && <CodeBlock code={code} title="canevas.bql" onTry={onTry} label="Ouvrir dans l'éditeur" isExercise />}
    {!code && onTry && (
      <button onClick={onTry} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: '#4f8ff0', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}>
        <Play size={14} fill="currentColor" /> Résoudre dans l'éditeur
      </button>
    )}
  </div>
);

// ─── XPBadge ──────────────────────────────────────────────────────────────────

export const XPBadge = ({ xp }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '100px', padding: '0.28rem 0.75rem', color: '#34d399', fontWeight: 700, fontSize: '0.82rem' }}>
    <Zap size={12} fill="currentColor" /> +{xp} XP
  </div>
);

// ─── AnalogieCard ─────────────────────────────────────────────────────────────

export const AnalogieCard = ({ children, title = 'Analogie — C\'est comme...' }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(250,204,21,0.05))',
    border: '1px solid rgba(167,139,250,0.25)',
    borderLeft: '3px solid #a78bfa',
    borderRadius: '12px',
    padding: '1.1rem 1.4rem',
    marginBottom: '1.4rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  }}>
    <div style={{ color: '#a78bfa', fontSize: '1.3rem', flexShrink: 0, marginTop: '-2px' }}>💡</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.45rem' }}>{title}</div>
      <div style={{ fontSize: '0.97rem', color: '#c4b5fd', lineHeight: '1.75' }}>{children}</div>
    </div>
  </div>
);

// ─── WhyCard ──────────────────────────────────────────────────────────────────

export const WhyCard = ({ children, title = 'Pourquoi c\'est important ?' }) => (
  <div style={{
    background: 'rgba(20,184,166,0.06)',
    border: '1px solid rgba(20,184,166,0.2)',
    borderLeft: '3px solid #14b8a6',
    borderRadius: '12px',
    padding: '1.1rem 1.4rem',
    marginBottom: '1.4rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  }}>
    <div style={{ color: '#14b8a6', flexShrink: 0, marginTop: '-1px' }}><Target size={18} /></div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.45rem' }}>{title}</div>
      <div style={{ fontSize: '0.97rem', color: '#5eead4', lineHeight: '1.75' }}>{children}</div>
    </div>
  </div>
);

// ─── StepByStep ───────────────────────────────────────────────────────────────

export const StepByStep = ({ steps, title = 'Comment ça fonctionne ?' }) => (
  <div style={{ marginBottom: '1.6rem' }}>
    {title && (
      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color: '#4f8ff0' }}>◆</span> {title}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(79,143,240,0.15)', border: '1.5px solid rgba(79,143,240,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#4f8ff0', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ fontSize: '0.93rem', color: '#cbd5e1', lineHeight: '1.7', flex: 1 }}>
            {step.label && <strong style={{ color: '#e4e7ec' }}>{step.label} </strong>}
            {step.desc || step}
          </div>
        </div>
      ))}
    </div>
  </div>
);


// ─── QuickRefPanel ────────────────────────────────────────────────────────────

const QUICK_REF = [
  { cat: 'Structure', color: '#c084fc', icon: '⬡', items: ['ALGORITHME_Nom', 'VARIABLE x : ENTIER;', 'VARIABLES x : ENTIER; y : REEL;', 'DEBUT ... FIN'] },
  { cat: 'Entrée / Sortie', color: '#4ade80', icon: '↕', items: ['ECRIRE("texte");', 'ECRIRE("val =", x);', 'LIRE(variable);'] },
  { cat: 'Conditions', color: '#facc15', icon: '⑇', items: ['SI cond ALORS ... FINSI', 'SI ... SINON ... FINSI', 'SELON var FAIRE ... FINSELON'] },
  { cat: 'Boucles', color: '#4f8ff0', icon: '↻', items: ['POUR i ALLANT DE 1 A n FAIRE ... FINPOUR', 'TANTQUE cond FAIRE ... FINTANTQUE', "REPETER ... JUSQUA cond;"] },
  { cat: 'Opérateurs', color: '#fb7185', icon: '±', items: ['+  −  *  /  MOD', '=  <>  <  >  <=  >=', 'ET   OU   NON'] },
  { cat: 'Tableaux', color: '#a78bfa', icon: '▦', items: ['Tableau T[n] : TYPE', 'T[i]  ←  valeur', 'Tableau M[l, c] : TYPE'] },
];

export const QuickRefPanel = () => {
  const [open, setOpen] = useState(false);
  const isMob = typeof window !== 'undefined' && window.innerWidth < 480;

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
      {open && (
        <div style={{
          position: 'fixed',
          bottom: isMob ? 0 : '5.2rem',
          right: isMob ? 0 : '1.5rem',
          left: isMob ? 0 : 'auto',
          top: 'auto',
          width: isMob ? '100vw' : 300,
          maxHeight: isMob ? '70vh' : '72vh',
          overflowY: 'auto',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMob ? '18px 18px 0 0' : '18px',
          padding: '1.1rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'qrIn 0.2s cubic-bezier(0.2,0.8,0.2,1)'
        }}>
          <style>{`@keyframes qrIn { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={12} /> BQL Quick Reference
          </div>
          {QUICK_REF.map(({ cat, color, icon, items }) => (
            <div key={cat} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                <span>{icon}</span> {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#94a3b8', padding: '0.18rem 0.55rem', borderLeft: `2px solid ${color}44`, background: `${color}07`, borderRadius: '0 5px 5px 0' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="BQL Quick Reference"
        style={{ width: 44, height: 44, borderRadius: '50%', background: open ? '#4f8ff0' : '#111827', border: `1px solid ${open ? '#4f8ff0' : 'rgba(255,255,255,0.1)'}`, color: open ? '#fff' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: open ? '0 4px 20px rgba(79,143,240,0.45)' : '0 4px 16px rgba(0,0,0,0.5)', transition: 'all 0.2s', fontSize: '1rem', fontWeight: 700 }}>
        {open ? '✕' : '⌘'}
      </button>
    </div>
  );
};
