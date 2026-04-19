import React from 'react';
import { Play, Loader2, Award, RotateCcw, StepForward } from 'lucide-react';

const EditorActions = ({
  isExecuting,
  settings,
  activeCourseLesson,
  validationState,
  onRun,
  onValidate,
  onNextStep,
  onReset,
  isMobile,
}) => {
  return (
    <div className="action-pill">
      {isExecuting && settings.stepByStepExecution && (
        <button
          className="step-btn"
          onClick={onNextStep}
          title="Instruction suivante (Pas-a-pas)"
        >
          <StepForward size={14} /> Pas
        </button>
      )}

      <button
        className={`run-button ${isExecuting ? 'executing' : ''}`}
        onClick={onRun}
        disabled={
          validationState === 'validating' ||
          (isExecuting && !settings.stepByStepExecution)
        }
        title="Executer le code (Ctrl+Enter)"
      >
        {isExecuting ? (
          <Loader2 size={16} className="spin" />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
        {isExecuting ? 'Stop' : 'Exécuter'}
      </button>

      {activeCourseLesson?.isChallenge && (
        <button
          className="run-button"
          style={{
            background: 'linear-gradient(to right, #eab308, #d97706)',
            marginLeft: '10px',
            boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)',
          }}
          onClick={onValidate}
          disabled={isExecuting || validationState === 'validating'}
          title="Validation officielle cote serveur"
        >
          {validationState === 'validating' ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <Award size={16} fill="currentColor" />
          )}
          {validationState === 'validating' ? 'Validation...' : 'Valider'}
        </button>
      )}

      {!isExecuting && !isMobile && (
        <button
          className="reset-button"
          onClick={onReset}
          title="reinitialiser la console"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
};

export default EditorActions;
