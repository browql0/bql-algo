import { useState, useRef, useEffect, useCallback } from 'react';
import { executeCode, getStructuredErrors } from '../../../lib/executeCode.js';
import { updateLastActiveAt } from '../services/editorActivity';
import { loadEditorHistory, saveEditorHistory } from '../services/editorStorage';

export const useEditorExecution = ({
  activeFile,
  settings,
  user,
  setActiveRightTab,
  setActiveMobilePane,
  onErrorNavigate,
}) => {
  const [outputLines, setOutputLines] = useState([]);
  const [structuredErrors, setStructuredErrors] = useState([]);
  const [errorSourceCode, setErrorSourceCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [arrayData, setArrayData] = useState(new Map());
  const [recordData, setRecordData] = useState(new Map());
  const [lastArrayAction, setLastArrayAction] = useState(null);
  const [runningLine, setRunningLine] = useState(null);
  const [variablesSnapshot, setVariablesSnapshot] = useState({});
  const stepResolverRef = useRef(null);

  const [inputPrompt, setInputPrompt] = useState(null);
  const inputResolverRef = useRef(null);

  useEffect(() => {
    const savedHistory = loadEditorHistory();
    if (savedHistory && settings.keepHistory !== false) {
      setOutputLines(savedHistory);
    }
  }, [settings.keepHistory]);

  useEffect(() => {
    if (settings.keepHistory !== false && outputLines.length > 0) {
      saveEditorHistory(outputLines);
    }
  }, [outputLines, settings.keepHistory]);

  const appendOutputLines = useCallback((lines) => {
    if (!lines || lines.length === 0) return;
    setOutputLines((prev) => [...prev, ...lines.filter(Boolean)]);
  }, []);

  const resetExecutionState = useCallback(() => {
    setOutputLines([]);
    setStructuredErrors([]);
    setErrorSourceCode('');
    setRunningLine(null);
    setVariablesSnapshot({});
  }, []);

  const handleRun = useCallback(async () => {
    const source = activeFile.content;

    // Reset de l'état
    setIsExecuting(true);
    setActiveRightTab('terminal');

    // Nettoyage terminal conditionnel (Lot 2)
    if (settings.clearTerminalOnRun !== false) {
      setOutputLines([]);
    }

    setStructuredErrors([]);
    setErrorSourceCode('');
    setRunningLine(null);
    setVariablesSnapshot({});

    updateLastActiveAt(user);

    // Arrays reset
    setArrayData(new Map());
    setRecordData(new Map());
    setLastArrayAction(null);

    // Basculer vers le terminal avant l'exécution
    setActiveMobilePane('output');

    // -- Callback output : ECRIRE() stream chaque ligne en direct ------------
    const outputCallback = (line) => {
      setOutputLines((prev) => [...prev, line]);
    };

    // -- Callback Pédagogique (Lot 3) --
    const onStep = (line) => {
      if (
        settings.highlightRunningLine !== false &&
        settings.stepByStepExecution === true
      ) {
        setRunningLine(line);
      }
    };

    const onSnapshot = (vars) => {
      if (settings.liveVariableVisualizer !== false) {
        setVariablesSnapshot(vars);
      }
    };

    const waitStep = () => {
      if (settings.stepByStepExecution !== true) return Promise.resolve();
      return new Promise((resolve) => {
        stepResolverRef.current = resolve;
      });
    };

    // -- Callback input   : LIRE() affiche le prompt et attend l'utilisateur -
    const inputCallback = (varName, type) => {
      return new Promise((resolve) => {
        inputResolverRef.current = resolve;
        setInputPrompt({ varName, type });
      });
    };

    // -- Callback array visualizer -------------------------------------------
    const onArrayUpdate = async (name, action, index, values, field = null) => {
      if (settings.showArrayVisualizer === false) return;

      const isRecord = index === null && !Array.isArray(values);

      if (isRecord) {
        setRecordData((prev) => {
          const next = new Map(prev);
          const highlight = { type: action, field };
          next.set(name, { values, highlight });
          return next;
        });
      } else {
        setArrayData((prev) => {
          const next = new Map(prev);
          const highlight =
            action !== 'create' ? { index, type: action, field } : null;
          next.set(name, { values, highlight });
          return next;
        });
      }

      if (action !== 'create') {
        const fieldText = field ? ` (champ ${field})` : '';
        const targetText = isRecord ? name : `${name}[${index}]`;
        const actionText = action === 'read' ? 'Lecture de' : 'Modification de';
        setLastArrayAction({ text: `${actionText} ${targetText}${fieldText}` });
      } else if (action === 'create') {
        setLastArrayAction({ text: `Création du tableau ${name}` });
      }

      await new Promise((r) => setTimeout(r, 80));
    };

    try {
      const result = await executeCode(source, {
        output: outputCallback,
        input: inputCallback,
        onArrayUpdate: onArrayUpdate,
        terminalSpeed: settings.terminalSpeed || 'instant',
        onStep,
        onSnapshot,
        waitStep,
      });

      setRunningLine(null);
      setVariablesSnapshot({});
      setInputPrompt(null);

      const structured = getStructuredErrors(result.errors, source, settings);
      setStructuredErrors(structured);
      setErrorSourceCode(source);

      if (result.success && result.errors.length === 0) {
        if (result.output.length > 0 && outputLines.length === 0) {
          setOutputLines(result.output);
        }
        setActiveRightTab('terminal');
      } else {
        const summaryParts = [];
        if (result.lexicalErrors?.length)
          summaryParts.push(`${result.lexicalErrors.length} lexicale(s)`);
        if (result.syntaxErrors?.length)
          summaryParts.push(`${result.syntaxErrors.length} syntaxique(s)`);
        if (result.semanticErrors?.length)
          summaryParts.push(`${result.semanticErrors.length} sémantique(s)`);
        if (result.runtimeErrors?.length)
          summaryParts.push(`${result.runtimeErrors.length} d'exécution`);

        const total = result.errors.length;
        const summary =
          summaryParts.length > 0
            ? `[Erreurs : ${summaryParts.join(', ')}]`
            : `[${total} erreur(s) détectée(s)]`;

        setOutputLines((prev) =>
          prev.length > 0 ? [...prev, summary] : [summary],
        );
        setActiveRightTab('errors');

        if (
          settings.autoGotoFirstError !== false &&
          structured.length > 0 &&
          onErrorNavigate
        ) {
          const firstErr = structured[0];
          if (firstErr.line > 0) {
            onErrorNavigate(firstErr.line, firstErr.column);
          }
        }
      }
    } catch (unexpected) {
      setOutputLines((prev) => [
        ...prev,
        `[Erreur interne] ${unexpected?.message ?? 'Erreur inconnue'}`,
      ]);
      setInputPrompt(null);
    } finally {
      setIsExecuting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  const handleSubmitInput = useCallback(
    (value) => {
      const isPedagogic = settings?.showFieldNames === true;
      const lineToPrint = isPedagogic
        ? `${inputPrompt?.varName ?? '?'}: ${value}`
        : String(value);
      setOutputLines((prev) => [...prev, lineToPrint]);
      setInputPrompt(null);
      if (inputResolverRef.current) {
        inputResolverRef.current(value);
        inputResolverRef.current = null;
      }
    },
    [inputPrompt, settings],
  );

  const handleNextStep = () => {
    if (stepResolverRef.current) {
      stepResolverRef.current();
      stepResolverRef.current = null;
    }
  };

  return {
    outputLines,
    setOutputLines,
    structuredErrors,
    errorSourceCode,
    isExecuting,
    arrayData,
    recordData,
    lastArrayAction,
    runningLine,
    variablesSnapshot,
    inputPrompt,
    appendOutputLines,
    handleRun,
    handleSubmitInput,
    handleNextStep,
    resetExecutionState,
  };
};
