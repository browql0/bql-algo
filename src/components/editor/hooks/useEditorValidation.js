import { useState, useCallback } from 'react';
import { submitLessonSolution } from '../../../lib/services/SubmissionService.js';

export const useEditorValidation = ({
  activeCourseLesson,
  activeFile,
  setActiveRightTab,
  appendOutputLines,
}) => {
  const [validationState, setValidationState] = useState('idle');
  const [validationResults, setValidationResults] = useState(null);

  const handleValidateChallenge = useCallback(async () => {
    if (!activeCourseLesson?.isChallenge) return;

    setValidationState('validating');
    setValidationResults(null);
    setActiveRightTab('terminal');

    try {
      const result = await submitLessonSolution({
        lessonId: activeCourseLesson.lessonId,
        code: activeFile.content,
      });

      const diagnosticItems = [
        result.message,
        ...(result.diagnostics || []).map((diagnostic) => diagnostic.message),
        result.details ? `Details: ${result.details}` : null,
      ].filter(Boolean);
      const testsLine =
        result.total > 0
          ? `Tests valides : ${result.passed}/${result.total}`
          : 'Tests serveur : aucun cas charge';

      setValidationResults({
        success: result.success,
        passed: result.passed,
        total: result.total,
        message: result.message,
        errorCode: result.errorCode,
        details: result.details,
        httpStatus: result.httpStatus,
        validationMode: result.validationMode,
        exerciseId: result.exerciseId,
        cases: result.cases || [],
        constraints: result.constraints,
        diagnostics: result.diagnostics || [],
        feedbackReport: result.feedbackReport,
        xpAwarded: result.xpAwarded || 0,
        progress: result.progress || null,
        keywordErrors: result.success ? [] : diagnosticItems,
      });

      setValidationState(result.success ? 'success' : 'error');
      appendOutputLines([
        '',
        result.success
          ? 'Validation serveur réussie.'
          : `Validation serveur échouée (${result.errorCode || 'VALIDATION_FAILED'}).`,
        testsLine,
        result.message,
        result.details ? `Details: ${result.details}` : null,
      ]);
    } catch (error) {
      const message =
        error?.message || 'Impossible de joindre le serveur de validation.';
      setValidationResults({
        success: false,
        passed: 0,
        total: 0,
        message,
        errorCode: 'BACKEND_UNREACHABLE',
        details: null,
        httpStatus: 0,
        cases: [],
        keywordErrors: [message],
      });
      setValidationState('error');
      appendOutputLines(['', `Validation serveur indisponible: ${message}`]);
    }
  }, [activeCourseLesson, activeFile, setActiveRightTab, appendOutputLines]);

  return {
    validationState,
    validationResults,
    setValidationState,
    handleValidateChallenge,
  };
};
