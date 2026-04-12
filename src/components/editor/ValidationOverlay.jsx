import React, { useState, useEffect } from 'react';
import {
  Loader2, CheckCircle, XCircle, RefreshCcw, ArrowRight,
  AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Target, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './ValidationOverlay.css';

// ─── Barre de proximité ──────────────────────────────────────────────────────
const ClosenessBar = ({ closeness }) => (
  <div className="closeness-container">
    <div className="closeness-label">
      <span>Proximité avec la solution</span>
      <span className="closeness-percent">{closeness}%</span>
    </div>
    <div className="closeness-track">
      <div
        className={`closeness-fill ${closeness >= 70 ? 'high' : closeness >= 40 ? 'mid' : 'low'}`}
        style={{ width: `${closeness}%` }}
      />
    </div>
  </div>
);

// ─── Section de feedback ─────────────────────────────────────────────────────
const FeedbackSection = ({ icon: Icon, color, title, items, className }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className={`feedback-section ${className}`}>
      <div className="feedback-section-header">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      <ul className="feedback-list">
        {items.map((item, i) => {
          // Détection des indices de longueur (10 ch.) pour les styliser
          const parts = String(item).split(/(\(\d+ ch\.\))/g);
          return (
            <li key={i}>
              {parts.map((p, j) => 
                p.match(/\(\d+ ch\.\)/) 
                  ? <span key={j} className="tc-len-hint">{p}</span>
                  : p
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ─── Section indice ──────────────────────────────────────────────────────────
const HintSection = ({ hint }) => {
  if (!hint) return null;
  return (
    <div className="feedback-section feedback-hint">
      <div className="feedback-section-header">
        <Lightbulb size={16} />
        <span>Indice</span>
      </div>
      <p className="hint-text">{hint}</p>
    </div>
  );
};

// ─── Section erreurs fréquentes ──────────────────────────────────────────────
const CommonMistakesSection = ({ mistakes }) => {
  if (!mistakes || mistakes.length === 0) return null;
  return (
    <div className="feedback-section feedback-common">
      <div className="feedback-section-header">
        <Info size={16} />
        <span>Erreurs fréquentes détectées</span>
      </div>
      <ul className="feedback-list">
        {mistakes.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
};

// ─── Section tests échoués (collapsible) ────────────────────────────────────
const FailedTestsSection = ({ cases }) => {
  const [expanded, setExpanded] = useState(false);
  const failed = (cases || []).filter(c => !c.passed);
  if (failed.length === 0) return null;

  return (
    <div className="feedback-section feedback-tests">
      <button
        className="failed-tests-toggle"
        onClick={() => setExpanded(p => !p)}
      >
        <XCircle size={15} />
        <span>{failed.length} test(s) échoué(s)</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="failed-tests-body">
          {failed.map((tc, i) => (
            <div key={i} className="tc-card">
              <div className="tc-row">
                <span className="tc-label">Saisie :</span>
                <code className="tc-val mono">{tc.input}</code>
              </div>
              <div className="tc-row">
                <span className="tc-label">Attendu :</span>
                <code className="tc-val mono string">"{tc.expected}"</code>
                {tc.isAmbiguous && <span className="tc-len-hint">({tc.expected.length} ch.)</span>}
              </div>
              <div className="tc-row">
                <span className="tc-label">Obtenu :</span>
                <code className="tc-val mono err">"{tc.got}"</code>
                {tc.isAmbiguous && <span className="tc-len-hint">({tc.got.length} ch.)</span>}
              </div>
              {tc.isAmbiguous && (
                <div className="tc-ambiguous-alert">
                  <AlertTriangle size={12} />
                  <span>Différence invisible détectée (espaces, retours à la ligne ou caractères spéciaux)</span>
                </div>
              )}
              {tc.reason && (
                <div className="tc-reason">{tc.reason}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Composant principal ─────────────────────────────────────────────────────
export const ValidationOverlay = ({ isOpen, status, results, onClose, onContinue }) => {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (status === 'validating') {
      setLoadingStep(0);
      const timers = [
        setTimeout(() => setLoadingStep(1), 800),
        setTimeout(() => setLoadingStep(2), 1600),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'success' || status === 'warning') {
      confetti({
        particleCount: status === 'success' ? 150 : 60,
        spread:        status === 'success' ? 70  : 45,
        origin: { y: 0.6 },
        colors: status === 'success'
          ? ['#34d399', '#facc15', '#60a5fa']
          : ['#facc15', '#fbbf24', '#f59e0b'],
      });
    }
  }, [status]);

  if (!isOpen) return null;

  const loadingTexts = [
    "Analyse de l'algorithme...",
    "Exécution des cas de tests complexes...",
    "Vérification de la sémantique et logique...",
  ];

  const fb = results?.feedbackReport;

  return (
    <div className="validation-overlay-backdrop">
      <div className={`validation-modal ${status}`}>

        {/* ── VALIDATING ── */}
        {status === 'validating' && (
          <div className="validation-content validating">
            <div className="spinner-container">
              <div className="glow-ring" />
              <Loader2 size={40} className="spin main-spinner" />
            </div>
            <h3>Validation en cours</h3>
            <p className="loading-text">{loadingTexts[loadingStep]}</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <div className="validation-content success">
            <div className="icon-container success-icon">
              <CheckCircle size={48} />
            </div>
            <h2 className="success-title">🟢 Validé</h2>
            <p className="success-subtitle">Solution correcte. Bonne logique !</p>

            <div className="xp-badge-large">
              <Zap size={20} fill="currentColor" />
              <span>+100 XP</span>
            </div>

            <div className="results-panel">
              <div className="result-item">
                <CheckCircle size={16} />
                <span>
                  Vérification multi-scénarios réussie ({(results?.cases || []).length} / {(results?.cases || []).length})
                </span>
              </div>
              <div className="result-item">
                <CheckCircle size={16} />
                <span>Logique et sémantique correctes</span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                <RefreshCcw size={16} /> Refaire
              </button>
              <button className="btn-primary" onClick={onContinue}>
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── WARNING : calcul correct, format différent ── */}
        {status === 'warning' && (
          <div className="validation-content warning">
            <div className="icon-container warning-icon">
              <CheckCircle size={44} />
            </div>
            <h2 className="warning-title">🟡 Validé avec remarque de style</h2>
            <p className="warning-subtitle">Méthode différente mais valide.<br/><br/>
            Le résultat est bon, même si la forme diffère.
            </p>

            <div className="xp-badge-large warning-xp">
              <Zap size={18} fill="currentColor" />
              <span>+75 XP</span>
            </div>

            {/* Détail des cas avec warning format */}
            <div className="warning-cases">
              {(results?.cases || []).map((tc, i) => (
                <div key={i} className={`warning-case-card ${tc.formatWarning ? 'fmt-warn' : 'perfect'}`}>
                  <div className="wc-header">
                    {tc.formatWarning
                      ? <AlertTriangle size={14} className="wc-icon-warn" />
                      : <CheckCircle   size={14} className="wc-icon-ok"   />
                    }
                    <span>Test {i + 1}</span>
                    <span className="wc-badge">
                      {tc.formatWarning ? 'Calcul ✓ · Format ⚠️' : 'Parfait ✓'}
                    </span>
                  </div>
                  {tc.formatWarning && (
                    <div className="wc-fmt-detail">
                      <div className="wc-row"><span>Attendu :</span><code className="wc-exp">&quot;{tc.expected}&quot;</code></div>
                      <div className="wc-row"><span>Obtenu  :</span><code className="wc-got">&quot;{tc.got}&quot;</code></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="warning-tip">
              <Lightbulb size={14} />
              <span>Pour la prochaine fois, essaie d'afficher exactement le format demandé dans l'énoncé.</span>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                <RefreshCcw size={16} /> Réessayer
              </button>
              <button className="btn-primary" onClick={onContinue}>
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
        {/* ── INTERNAL ERROR — SYSTEM FAULT ── */}
        {status === 'internal_error' && (
          <div className="validation-content error internal-error-container">
            <div className="error-header">
              <div className="icon-container error-icon" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.2)' }}>
                <AlertTriangle size={40} />
              </div>
              <div className="error-header-text">
                <h2 className="error-title" style={{ color: '#c084fc' }}>Validation Impossible</h2>
                <p className="error-subtitle" style={{ fontSize: '0.98rem' }}>
                  Le système de validation a rencontré une erreur interne grave. **Votre code n'est pas nécessairement faux.**
                </p>
              </div>
            </div>

            <div className="feedback-body">
              <FeedbackSection
                icon={Info}
                color="purple"
                title="Détails techniques (pour diagnostic)"
                items={[
                  `Type d'erreur : ${fb?.errorType === 'INTERPRETER_INTERNAL_ERROR' ? 'Crash de l\'interpréteur BQL' : 'Crash du moteur de feedback'}`,
                  ...(fb?.errorPoints || ['Le moteur d\'exécution n\'a pas pu parser/exécuter ces tests jusqu\'au bout.'])
                ]}
                className="feedback-error-section"
              />
              <HintSection hint={fb?.hint || "Ce n'est pas votre faute. Vous pouvez essayer de tester votre exécution ou de modifier légèrement la logique, parfois cela contourne le bug interne."} />
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                <RefreshCcw size={16} /> Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR — feedback pédagogique ── */}
        {status === 'error' && (
          <div className="validation-content error">

            {/* En-tête */}
            <div className="error-header">
              <div className="icon-container error-icon">
                {fb?.errorType === 'OUTPUT_FORMAT' ? <AlertTriangle size={40} /> : 
                 (fb?.errorType === 'SYNTAX_ERROR' || fb?.errorType === 'SEMANTIC_ERROR') ? <AlertTriangle size={40} color="#ef4444" /> :
                 <Target size={40} />}
              </div>
              <div className="error-header-text">
                <h2 className="error-title">
                  {fb?.errorType === 'OUTPUT_FORMAT' ? '🟡 Presque ! Problème d’affichage' : 
                   fb?.errorType === 'SYNTAX_ERROR' ? '🔴 Erreur de Syntaxe' :
                   fb?.errorType === 'SEMANTIC_ERROR' ? '🔴 Erreur Sémantique' :
                   '🔴 Échec logique réel'}
                </h2>
                <p className="error-subtitle">
                  {fb?.errorType === 'OUTPUT_FORMAT' 
                    ? 'Ton calcul est correct 👍. Le problème vient uniquement du texte affiché. Vérifie le format de ton ECRIRE.' 
                    : (fb?.subtitle || 'La logique ou les résultats attendus sont incorrects.')}
                </p>
                {fb?.errorType === 'OUTPUT_FORMAT' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span className="wc-badge" style={{ backgroundColor: 'rgba(52, 211, 153, 0.12)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.2)' }}>🟢 Logique correcte</span>
                    <span className="wc-badge" style={{ backgroundColor: 'rgba(250, 204, 21, 0.12)', color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.2)' }}>🟡 Format incorrect</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barre de proximité */}
            {fb?.closeness !== undefined && (
              <ClosenessBar closeness={fb.closeness} />
            )}

            {/* Contraintes sémantiques manquantes (legacy) */}
            {!fb && results?.keywordErrors?.length > 0 && (
              <div className="feedback-section feedback-error-section">
                <div className="feedback-section-header">
                  <XCircle size={16} />
                  <span>Contraintes sémantiques</span>
                </div>
                <ul className="feedback-list">
                  {results.keywordErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Corps du feedback pédagogique */}
            <div className="feedback-body">

              {/* ✅ Ce qui est correct */}
              <FeedbackSection
                icon={CheckCircle}
                color="green"
                title="Ce qui est correct"
                items={fb?.correctPoints}
                className="feedback-correct-section"
              />

              {/* ❌ Ce qui pose problème */}
              <FeedbackSection
                icon={XCircle}
                color="red"
                title="Ce qui pose problème"
                items={fb?.errorPoints}
                className="feedback-error-section"
              />

              {/* ⚠️ Erreurs fréquentes détectées */}
              <CommonMistakesSection mistakes={fb?.commonMistakes} />

              {/* 💡 Indice */}
              <HintSection hint={fb?.hint} />

              {/* 🧪 Tests échoués (collapsible) */}
              <FailedTestsSection cases={results?.cases} />

              {/* Fallback si pas de feedbackReport */}
              {!fb && results?.cases && (
                <div className="legacy-cases">
                  {results.cases.map((tc, index) => (
                    <div key={index} className={`test-case-card ${tc.passed ? 'passed' : 'failed'}`}>
                      <div className="tc-header">
                        {tc.passed
                          ? <CheckCircle size={16} color="#34d399" />
                          : <XCircle size={16} color="#ef4444" />
                        }
                        <strong>Test {index + 1}</strong>
                      </div>
                      {!tc.passed && (
                        <div className="tc-details">
                          {tc.reason
                            ? <div className="tc-reason">{tc.reason}</div>
                            : (
                              <>
                                <div className="tc-row"><span className="tc-label">Saisie:</span> <span className="tc-val mono">{tc.input}</span></div>
                                <div className="tc-row"><span className="tc-label">Attendu:</span> <span className="tc-val mono string">"{tc.expected}"</span></div>
                                <div className="tc-row"><span className="tc-label">Obtenu:</span> <span className="tc-val mono err">"{tc.got}"</span></div>
                              </>
                            )
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="btn-primary" onClick={onClose}>
                Corriger mon code
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Icône Zap inline (évite l'import lucide manquant)
function Zap(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size}
      viewBox="0 0 24 24" fill={props.fill || 'none'} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
