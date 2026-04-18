import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { buildEncouragingFeedback } from '../../lib/encouragingFeedback';
import './ValidationOverlay.css';

function ScoreSummary({ results }) {
  const passed = results?.passed ?? 0;
  const total = results?.total ?? 0;
  const hasTests = total > 0;
  const constraintsPassed = results?.constraints?.passed;

  return (
    <div className="validation-score-grid">
      <div className="validation-score-card">
        <span className="score-label">Tests officiels</span>
        <strong>{hasTests ? `${passed}/${total}` : 'Aucun'}</strong>
      </div>
      <div className="validation-score-card">
        <span className="score-label">Contraintes</span>
        <strong>
          {constraintsPassed === undefined || constraintsPassed === null
            ? 'Non requises'
            : constraintsPassed
              ? 'OK'
              : 'A corriger'}
        </strong>
      </div>
    </div>
  );
}

function ProgressSection({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="progress-feedback-section">
      <div className="feedback-section-header">
        <CheckCircle size={16} />
        <span>Ce qui est deja correct</span>
      </div>
      <ul className="progress-feedback-list">
        {items.slice(0, 5).map((item, index) => (
          <li key={index}>
            <CheckCircle size={14} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudentMessageCard({ feedback }) {
  if (!feedback) return null;

  return (
    <div className={`student-message-card ${feedback.tone || 'validation'}`}>
      <div className="student-message-row">
        <span className="student-message-label">Ce qui reste a corriger</span>
        <p>{feedback.remainingIssue}</p>
      </div>
      <div className="student-message-row">
        <span className="student-message-label">Prochaine action</span>
        <p>{feedback.nextAction}</p>
      </div>
      {feedback.testNext && (
        <div className="student-message-row">
          <span className="student-message-label">A tester maintenant</span>
          <p>{feedback.testNext}</p>
        </div>
      )}
      {feedback.example && (
        <div className="student-message-row">
          <span className="student-message-label">Exemple</span>
          <pre className="student-message-example">{feedback.example}</pre>
        </div>
      )}
    </div>
  );
}

function SecondaryMessages({ messages }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="feedback-section feedback-hint">
      <div className="feedback-section-header">
        <Lightbulb size={16} />
        <span>Autres points a verifier</span>
      </div>
      <div className="secondary-message-list">
        {messages.map((message, index) => (
          <div key={`${message.title}-${index}`} className="secondary-message-item">
            <strong>{message.title}</strong>
            <span>{message.problem}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechnicalDetails({ debug }) {
  const hasDebug = debug && Object.values(debug).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  });

  if (!hasDebug) return null;

  return (
    <details className="technical-details">
      <summary>Details techniques</summary>
      <pre>{JSON.stringify(debug, null, 2)}</pre>
    </details>
  );
}

function SuccessContent({ results, onClose, onContinue }) {
  const diagnostics = results?.diagnostics || [];
  const alternativeMessage = diagnostics.find(
    (diagnostic) => diagnostic.code === 'VALID_SOLUTION',
  )?.message;

  return (
    <div className="validation-content success">
      <div className="icon-container success-icon">
        <CheckCircle size={48} />
      </div>
      <h2 className="success-title">Solution valide</h2>
      <p className="success-subtitle">
        {alternativeMessage || results?.message || 'Les tests officiels sont valides.'}
      </p>

      <ScoreSummary results={results} />

      <div className="results-panel">
        <div className="result-item">
          <CheckCircle size={16} />
          <span>Resultat officiel accepte par le validateur serveur.</span>
        </div>
        <div className="result-item">
          <CheckCircle size={16} />
          <span>Les solutions alternatives correctes sont acceptees.</span>
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
  );
}

function ErrorContent({ results, onClose }) {
  const feedback = buildEncouragingFeedback(results);

  return (
    <div className="validation-content error">
      <div className="error-header">
        <div className={`icon-container error-icon ${feedback.tone}`}>
          {feedback.tone === 'server' ? <AlertTriangle size={40} /> : <Target size={40} />}
        </div>
        <div className="error-header-text">
          <h2 className="error-title">{feedback.title}</h2>
          <p className="error-subtitle">{feedback.subtitle}</p>
        </div>
      </div>

      <ScoreSummary results={results} />

      <div className="feedback-body">
        <ProgressSection items={feedback.progress} />
        <StudentMessageCard feedback={feedback} />
        <SecondaryMessages messages={feedback.secondary} />
        <TechnicalDetails debug={feedback.debug} />

        {!feedback.remainingIssue && results?.message && (
          <div className="feedback-section feedback-error-section">
            <div className="feedback-section-header">
              <XCircle size={16} />
              <span>Message serveur</span>
            </div>
            <ul className="feedback-list">
              <li>{results.message}</li>
              {results.errorCode && <li>Code: {results.errorCode}</li>}
              {results.details && <li>{results.details}</li>}
            </ul>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={onClose}>
          Corriger mon code
        </button>
      </div>
    </div>
  );
}

export const ValidationOverlay = ({ isOpen, status, results, onClose, onContinue }) => {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (status !== 'validating') return undefined;
    const timers = [
      setTimeout(() => setLoadingStep(1), 800),
      setTimeout(() => setLoadingStep(2), 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [status]);

  useEffect(() => {
    if (status === 'success') {
      confetti({
        particleCount: 120,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#34d399', '#facc15', '#60a5fa'],
      });
    }
  }, [status]);

  const loadingTexts = useMemo(
    () => [
      "Analyse officielle de l'algorithme...",
      'Execution des tests serveur...',
      'Preparation du diagnostic pedagogique...',
    ],
    [],
  );

  if (!isOpen) return null;

  return (
    <div className="validation-overlay-backdrop">
      <div className={`validation-modal ${status}`}>
        {status === 'validating' && (
          <div className="validation-content validating">
            <div className="spinner-container">
              <div className="glow-ring" />
              <Loader2 size={40} className="spin main-spinner" />
            </div>
            <h3>Validation officielle en cours</h3>
            <p className="loading-text">{loadingTexts[loadingStep]}</p>
          </div>
        )}

        {status === 'success' && (
          <SuccessContent
            results={results}
            onClose={onClose}
            onContinue={onContinue}
          />
        )}

        {status === 'error' && (
          <ErrorContent results={results} onClose={onClose} />
        )}
      </div>
    </div>
  );
};
