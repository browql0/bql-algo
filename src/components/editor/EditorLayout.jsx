import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  TerminalSquare,
  Play,
  Loader2,
  BookOpen,
  Trophy,
  Settings,
  Plus,
  X,
  Share2,
  DownloadCloud,
  Check,
  User,
  CreditCard,
  LogOut,
  RotateCcw,
  AlertTriangle,
  Code,
  Terminal,
  Wand2,
  StepForward,
  List,
  Menu,
  Award,
  ShieldCheck,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import InteractiveTerminal from "./InteractiveTerminal";
import ErrorPanel from "./ErrorPanel";
import SettingsModal from "./SettingsModal";
import ProfileModal from "./ProfileModal";
import BillingModal from "./BillingModal";
import ArrayVisualizer from "./ArrayVisualizer";
import { ValidationOverlay } from "./ValidationOverlay";
import { executeCode, getStructuredErrors } from "../../lib/executeCode.js";
import { analyzeFeedback } from "../../lib/feedbackAnalyzer.js";
import { compareOutputs, getStringDiffInfo, numericMatch } from "../../lib/outputUtils.js";
import { formatCode } from "../../lib/formatter/Formatter.js";
import "./EditorLayout.css";

const DEFAULT_SETTINGS = {
  fontSize: "14",
  fontFamily: "jetbrains",
  lineHeight: "1.5",
  fontLigatures: true,
  editorZoom: 100,
  tabSize: "4",
  wordWrap: false,
  lineNumbers: true,
  highlightActiveLine: true,
  renderIndentGuides: true,
  autoClosingBrackets: true,
  autoClosingQuotes: true,
  autoIndentOnEnter: true,
  insertSpaces: true,
  formatOnSave: false,
  formatOnRun: false,
  autoSpaceNormalization: true,
  manageIndentation: true,
  show1DVisualizer: false,
  show2DVisualizer: false,
  liveVariableVisualizer: false,
  stepByStepExecution: false,
  highlightRunningLine: false,
  simplifiedErrors: true,
  beginnerMode: true,
  errorDetailLevel: "normal",
  autoGotoFirstError: true,
  groupSimilarErrors: true,
  showCorrectionSuggestions: true,
  terminalTheme: "hacker",
  terminalFontSize: "14",
  clearTerminalOnRun: true,
  keepHistory: false,
  terminalSpeed: "normal",
  globalTheme: "dark",
  accentColor: "blue",
  interfaceDensity: "comfortable",
  enableAnimations: true,
  enableVisualEffects: false,
  autoSave: false,
  restoreLastSession: true,
  confirmBeforeReset: true,
  showFieldNames: false,
  advancedArrayView: true,
  compactRecordView: true,
};

const EditorLayout = () => {
  const editorRef = useRef(null);

  // Editor Settings State (defined first to be used in files init)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("bql_editor_settings");
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  // Multi-file state
  const [files, setFiles] = useState(() => {
    let shouldRestore = DEFAULT_SETTINGS.restoreLastSession;
    try {
      const savedSettings = localStorage.getItem("bql_editor_settings");
      if (savedSettings) {
        shouldRestore = JSON.parse(savedSettings).restoreLastSession;
      }

      if (shouldRestore !== false) {
        const savedFiles = localStorage.getItem("bql_files_cache");
        if (savedFiles) {
          const parsed = JSON.parse(savedFiles);
          if (parsed && Array.isArray(parsed) && parsed.length > 0)
            return parsed;
        }
      }
    } catch (e) {}

    return [{ id: 1, name: "main.bql", content: "" }];
  });

  const [activeFileId, setActiveFileId] = useState(() => files[0]?.id || 1);
  const [fileCounter, setFileCounter] = useState(() => {
    if (files.length === 0) return 2;
    const ids = files.map((f) => f.id);
    return Math.max(...ids) + 1;
  });

  // --- STATES & REFS Initialization ---
  const [activeRightTab, setActiveRightTab] = useState("terminal");
  const [activeMobilePane, setActiveMobilePane] = useState("editor");
  const [outputLines, setOutputLines] = useState([]);
  const [structuredErrors, setStructuredErrors] = useState([]);
  const [errorSourceCode, setErrorSourceCode] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatMessage, setFormatMessage] = useState("");

  // Array Visualizer state
  const [arrayData, setArrayData] = useState(new Map());
  const [recordData, setRecordData] = useState(new Map());
  const [lastArrayAction, setLastArrayAction] = useState(null);

  // Pedagogy state (Lot 3)
  const [runningLine, setRunningLine] = useState(null);
  const [variablesSnapshot, setVariablesSnapshot] = useState({});
  const stepResolverRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Auth depuis le contexte centralisé (plus besoin de gérer localement)
  const { user, signOut } = useAuth();

  // ── Drag Resize ───────────────────────────────────────────────────────────
  const [splitRatio, setSplitRatio] = useState(52); // % pour le pane gauche
  const isDraggingRef = useRef(false);
  const resizerRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    const onMove = (clientX) => {
      if (!isDraggingRef.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const ratio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(ratio, 25), 75)); // clamp 25%–75%
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resizerRef.current?.classList.remove("is-dragging");
    };
    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => onMove(e.touches[0].clientX);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    resizerRef.current?.classList.add("is-dragging");
  };

  // ─ Auto Save Effect
  useEffect(() => {
    if (settings.autoSave !== false) {
      localStorage.setItem("bql_files_cache", JSON.stringify(files));
    }
  }, [files, settings.autoSave]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("bql_terminal_history");
    if (savedHistory && settings.keepHistory !== false) {
      setOutputLines(JSON.parse(savedHistory));
    }
  }, [settings.keepHistory]);

  // --- Mobile Detection ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-switch mobile pane if window is resized to mobile
      if (
        mobile &&
        activeMobilePane === "editor" &&
        activeRightTab !== "terminal"
      ) {
        // Optionally sync here or let user decide
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMobilePane, activeRightTab]);

  // Sync mobile pane with right tabs for desktop users who resize or vice-versa
  useEffect(() => {
    if (isMobile) {
      if (
        activeRightTab === "terminal" ||
        activeRightTab === "errors" ||
        activeRightTab === "variables" ||
        activeRightTab === "visualisation"
      ) {
        if (activeMobilePane === "editor") {
          // If we click a right tab toggle in desktop then resize, or if something triggers it
        }
      }
    }
  }, [activeRightTab, isMobile]);

  useEffect(() => {
    if (settings.keepHistory !== false && outputLines.length > 0) {
      localStorage.setItem("bql_terminal_history", JSON.stringify(outputLines));
    }
  }, [outputLines, settings.keepHistory]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("bql_editor_settings", JSON.stringify(newSettings));
  };

  const navigate = useNavigate();
  const location = useLocation();

  const [activeCourseLesson, setActiveCourseLesson] = useState(null);

  // Nouveaux états de validation du défi
  const [validationState, setValidationState] = useState("idle"); // idle, validating, success, error
  const [validationResults, setValidationResults] = useState(null);

  useEffect(() => {
    if (location.state && location.state.codeToRun) {
      const code = location.state.codeToRun;

      if (location.state.lessonId) {
        setActiveCourseLesson({
          lessonId: location.state.lessonId,
          expectedOutput: location.state.expectedOutput,
          lessonTitle: location.state.lessonTitle,
          testCases: location.state.testCases,
          isChallenge: location.state.isChallenge,
          lessonExercise: location.state.lessonExercise,
          lessonContent: location.state.lessonContent,
        });
      }

      navigate(location.pathname, { replace: true, state: {} });

      const EXERCICE_ID = 9999;
      setFiles((currFiles) => {
        const hasExercice = currFiles.some((f) => f.id === EXERCICE_ID);
        if (hasExercice) {
          return currFiles.map((f) =>
            f.id === EXERCICE_ID ? { ...f, content: code } : f,
          );
        } else {
          return [
            ...currFiles,
            { id: EXERCICE_ID, name: "exercice.bql", content: code },
          ];
        }
      });
      setActiveFileId(EXERCICE_ID);
    }
  }, [location.state, location.pathname, navigate]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Visiteur BQL";
  const displayEmail = user?.email || "Non connecté";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const handleCodeChange = (newCode) => {
    setFiles(
      files.map((f) =>
        f.id === activeFileId ? { ...f, content: newCode } : f,
      ),
    );
  };

  const createNewFile = () => {
    const newFile = {
      id: fileCounter,
      name: `fichier${fileCounter}.bql`,
      content: "",
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setFileCounter(fileCounter + 1);
  };

  const closeFile = (e, idToClose) => {
    e.stopPropagation();
    if (files.length === 1) return; // Prevent closing the last file

    if (settings.confirmBeforeReset !== false) {
      const fileToClose = files.find((f) => f.id === idToClose);
      if (fileToClose && fileToClose.content.trim() !== "") {
        if (
          !window.confirm(
            `Êtes-vous sûr de vouloir fermer "${fileToClose.name}" ? Vous risquez de perdre son contenu.`,
          )
        ) {
          return;
        }
      }
    }

    const newFiles = files.filter((f) => f.id !== idToClose);
    setFiles(newFiles);
    if (activeFileId === idToClose) {
      setActiveFileId(newFiles[newFiles.length - 1].id);
    }
  };

  // ── State pour l'input interactif LIRE() ──────────────────────────────────
  //
  // inputPrompt : { varName: string, type: string } | null
  //   → non-null quand l'interpréteur attend une saisie
  //
  // inputResolverRef : { current: Function | null }
  //   → contient le resolve() de la Promise en attente
  //   → appelé quand l'utilisateur soumet une valeur dans le terminal
  //
  const [inputPrompt, setInputPrompt] = useState(null);
  const inputResolverRef = useRef(null);

  // ── handleRun : async, avec callbacks output/input ─────────────────────────
  const handleRun = useCallback(async () => {
    const source = activeFile.content;

    // ── Pre-run Format (Lot 2) ──
    let currentSource = source;
    if (settings.formatOnRun !== false) {
      currentSource = formatCode(source);
      // Synchroniser les fichiers avec la version formatée si changement
      if (currentSource !== source) {
        handleCodeChange(currentSource);
      }
    }

    // Reset de l'état
    setIsExecuting(true);
    setActiveRightTab("terminal");

    // Nettoyage terminal conditionnel (Lot 2)
    if (settings.clearTerminalOnRun !== false) {
      setOutputLines([]);
    }

    setStructuredErrors([]);
    setErrorSourceCode("");
    const startTime = Date.now();
    setRunningLine(null);
    setVariablesSnapshot({});

    // Mettre à jour la date de dernière activité
    if (user) {
      supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id).then();
    }

    // Arrays reset
    setArrayData(new Map());
    setRecordData(new Map());
    setLastArrayAction(null);

    // Basculer vers le terminal avant l'exécution
    setActiveMobilePane("output");

    // ── Callback output : ECRIRE() stream chaque ligne en direct ────────────
    const outputCallback = (line) => {
      setOutputLines((prev) => [...prev, line]);
    };

    // ── Callback Pédagogique (Lot 3) ──
    const onStep = (line) => {
      // On ne surligne QUE si on est en mode pas-à-pas (évite les sauts rapides)
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

    // ── Callback input   : LIRE() affiche le prompt et attend l'utilisateur ─
    const inputCallback = (varName, type) => {
      return new Promise((resolve) => {
        // Stocker le resolver pour l'appeler depuis handleSubmitInput
        inputResolverRef.current = resolve;
        // Afficher le prompt dans le terminal
        setInputPrompt({ varName, type });
      });
    };

    // ── Callback array visualizer ───────────────────────────────────────────
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
            action !== "create" ? { index, type: action, field } : null;
          next.set(name, { values, highlight });
          return next;
        });
      }

      if (action !== "create") {
        const fieldText = field ? ` (champ ${field})` : "";
        const targetText = isRecord ? name : `${name}[${index}]`;
        const actionText = action === "read" ? "Lecture de" : "Modification de";
        setLastArrayAction({ text: `${actionText} ${targetText}${fieldText}` });
      } else if (action === "create") {
        setLastArrayAction({ text: `Création du tableau ${name}` });
      }

      // Pause pour l'animation
      await new Promise((r) => setTimeout(r, 80));
    };

    try {
      // executeCode est désormais async → on peut await
      const result = await executeCode(currentSource, {
        output: outputCallback,
        input: inputCallback,
        onArrayUpdate: onArrayUpdate,
        terminalSpeed: settings.terminalSpeed || "instant", // Lot 2
        onStep,
        onSnapshot,
        waitStep,
      });

      // Fin de l'exécution : masquer le surlignage pédagogique
      setRunningLine(null);
      setVariablesSnapshot({});
      setInputPrompt(null);

      // ── Construire les erreurs structurées pour ErrorPanel ─────────────────
      const structured = getStructuredErrors(
        result.errors,
        currentSource,
        settings,
      );
      setStructuredErrors(structured);
      setErrorSourceCode(currentSource);

      if (result.success && result.errors.length === 0) {
        // Succès : si pas de sortie streaming, afficher le résumé
        if (result.output.length > 0 && outputLines.length === 0) {
          setOutputLines(result.output);
        }
        setActiveRightTab("terminal");

        // Validation Automatique (Uniquement si ce n'est pas un challenge)
        if (
          activeCourseLesson &&
          activeCourseLesson.expectedOutput &&
          !activeCourseLesson.isChallenge
        ) {
          const finalOutStr = result.output.join("\n").trim();
          const expectedStr = activeCourseLesson.expectedOutput.trim();

          if (
            finalOutStr === expectedStr ||
            result.output.some((line) => line.includes(expectedStr))
          ) {
            const handleLessonSuccess = async () => {
              if (user && activeCourseLesson.lessonId) {
                // 1. Progress
                await supabase
                  .from("user_progress")
                  .upsert(
                    {
                      user_id: user.id,
                      lesson_id: activeCourseLesson.lessonId,
                      completed: true,
                    },
                    { onConflict: "user_id,lesson_id" },
                  );

                // 2. XP & Re-calculation (Real Leveling)
                const xpToAdd = activeCourseLesson.xp_value || 25;
                const { data: prof } = await supabase.from('profiles').select('xp, total_lessons_completed').eq('id', user.id).single();
                if (prof) {
                  const newXp = (prof.xp || 0) + xpToAdd;
                  const newLevel = Math.floor(newXp / 100) + 1; // 100 XP par niveau
                  await supabase.from('profiles').update({ 
                    xp: newXp, 
                    level: newLevel,
                    total_lessons_completed: (prof.total_lessons_completed || 0) + 1
                  }).eq('id', user.id);
                }
              }
              // Pour les exercices classiques non-challenge, on utilise directement l'overlay success
              setValidationResults({ cases: [], keywordErrors: [] });
              setValidationState("success");
            };
            handleLessonSuccess();
          } else {
            setOutputLines((prev) => [
              ...prev,
              ``,
              `❌ ÉCHEC DE LA VALIDATION`,
              `-------------------------`,
              `Résultat attendu  : "${expectedStr}"`,
              `Résultat obtenu   : "${finalOutStr}"`,
              `-------------------------`,
            ]);
          }
        }
      } else {
        // Erreurs : résumé dans le terminal + basculer vers le panneau erreurs
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
            ? `[Erreurs : ${summaryParts.join(", ")}]`
            : `[${total} erreur(s) détectée(s)]`;

        setOutputLines((prev) =>
          prev.length > 0 ? [...prev, summary] : [summary],
        );
        setActiveRightTab("errors");

        // Lot 3 : autoGotoFirstError
        if (settings.autoGotoFirstError !== false && structured.length > 0) {
          const firstErr = structured[0];
          if (firstErr.line > 0) {
            handleErrorClick(firstErr.line, firstErr.column);
          }
        }
      }
    } catch (unexpected) {
      // Crash inattendu hors du pipeline
      setOutputLines((prev) => [
        ...prev,
        `[Erreur interne] ${unexpected?.message ?? "Erreur inconnue"}`,
      ]);
      setInputPrompt(null);
    } finally {
      setIsExecuting(false);
      // Logger l'essai (Run simple)
      if (user && activeCourseLesson?.lessonId) {
        supabase.from('exercise_attempts').insert({
          user_id: user.id,
          lesson_id: activeCourseLesson.lessonId,
          success: structuredErrors.length === 0,
          code_submitted: activeFile.content,
          duration_ms: Date.now() - startTime,
          error_message: structuredErrors.length > 0 ? structuredErrors[0].message : null
        }).then();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  // ── handleValidateChallenge : Valider les test_cases et sémantique ──
  const handleValidateChallenge = useCallback(async () => {
    if (
      !activeCourseLesson ||
      !activeCourseLesson.isChallenge ||
      !activeCourseLesson.testCases
    )
      return;

    const startTime = Date.now();
    setValidationState("validating");
    setValidationResults(null);
    setIsExecuting(true);

    const source = activeFile.content.trim();
    const upperSource = source.toUpperCase();

    // 1. Déterminer les règles de validation (support pour Array legacy ou Object enrichi)
    let validationRules = {
      mode: "logic_first",
      required_keywords: [],
      forbidden_keywords: [],
      cases: [],
      strict_output: true,
    };

    let parsedCases = activeCourseLesson.testCases;
    if (typeof parsedCases === "string") {
      try {
        parsedCases = JSON.parse(parsedCases);
      } catch (e) {
        console.error("Erreur de parsing des tests cases:", e);
      }
    }

    if (Array.isArray(parsedCases)) {
      validationRules.cases = parsedCases;
    } else if (
      typeof parsedCases === "object" &&
      parsedCases !== null &&
      parsedCases.cases
    ) {
      validationRules = { ...validationRules, ...parsedCases };
    }

    // 2. Vérification sémantique (Mots-clés)
    let keywordErrors = [];
    if (validationRules.required_keywords?.length > 0) {
      for (const kw of validationRules.required_keywords) {
        if (!upperSource.includes(kw.toUpperCase())) {
          keywordErrors.push(`Le mot-clé '${kw}' est requis mais absent.`);
        }
      }
    }
    if (validationRules.forbidden_keywords?.length > 0) {
      for (const kw of validationRules.forbidden_keywords) {
        if (upperSource.includes(kw.toUpperCase())) {
          keywordErrors.push(
            `Le mot-clé '${kw}' est interdit dans cet exercice.`,
          );
        }
      }
    }

    if (keywordErrors.length > 0) {
      setIsExecuting(false);
      setValidationResults({ cases: [], keywordErrors });
      setValidationState("error");
      return;
    }

    // 2.5 Validation préliminaire de Syntaxe et Sémantique (AST Dry-Run)
    let astErrors = { lexicalErrors: [], syntaxErrors: [], semanticErrors: [], runtimeErrors: [] };
    try {
      const dryRun = await executeCode(source, { inputs: [], terminalSpeed: 'instant' });
      astErrors.lexicalErrors = dryRun.lexicalErrors || [];
      astErrors.syntaxErrors = dryRun.syntaxErrors || [];
      astErrors.semanticErrors = dryRun.semanticErrors || [];
      // On ignore dryRun.runtimeErrors car on n'a pas fourni d'inputs, un crash sur LIRE est normal ici.
    } catch (e) {
      console.warn("Dry run failed", e);
    }

    // 3. Exécution des cas de tests
    let allPassed = true;
    let evaluatedCases = [];

    // Pause artificielle pour l'UX de validation (animation loader)
    await new Promise((r) => setTimeout(r, 2200));

    for (let i = 0; i < validationRules.cases.length; i++) {
      const tc = validationRules.cases[i];
      const inputsArray = String(tc.input)
        .split("\n")
        .map((s) => s.trim());
      const expectedStr = String(tc.output).trim();
      let testResult = {
        input: inputsArray.join(" | "),
        expected: expectedStr,
        got: "",
        passed: false,
        reason: null,
      };

      try {
        const result = await executeCode(source, {
          inputs: inputsArray,
          output: () => {},
          terminalSpeed: "instant",
        });

        if (!result.success || result.errors.length > 0) {
          allPassed = false;
          testResult.reason = "Le code a déclenché une erreur lors de ce test.";
          testResult.got = "[Échec d'exécution]";
          // Conserver les erreurs de l'interpréteur pour le feedback
          testResult._runtimeErrors = result.runtimeErrors || [];
          evaluatedCases.push(testResult);
          continue;
        }

        const terminalLines = result.output;
        const finalOutStr = terminalLines.join("\n").trim();
        testResult.got = finalOutStr;
        try {
          let passedResult = { passed: false, isAmbiguous: false };
          // Compare outputs using validation mode
          if (validationRules.mode === "exact_output") {
            passedResult = compareOutputs(finalOutStr, expectedStr);
          } else if (
            validationRules.mode === "final_output" ||
            validationRules.mode === "semantic_check"
          ) {
            const lastLine =
              terminalLines.length > 0
                ? String(terminalLines[terminalLines.length - 1])
                : "";
            passedResult = compareOutputs(lastLine, expectedStr);
            // Si le mode est final_output/semantic, on accepte aussi si la sortie complète contient exactement l'attendu 
            if (!passedResult.passed && (finalOutStr.trim().includes(expectedStr.trim()) || finalOutStr === expectedStr.trim())) {
              passedResult.passed = true;
            }
          } else {
            // contains_output / logic_first (default)
            const normExp = expectedStr.trim();
            passedResult.passed = terminalLines.some((line) => {
               const l = String(line || '').trim();
               return l === normExp || l.includes(normExp);
            });
            // Fix: S'il existe sur plusieurs lignes (ex: 15\n2), vérifier la sortie globale
            if (!passedResult.passed && finalOutStr.trim().includes(normExp)) {
               passedResult.passed = true;
            }
          }

          testResult.passed = passedResult.passed;
          testResult.isAmbiguous = passedResult.isAmbiguous;
          
          if (!testResult.passed && testResult.isAmbiguous) {
             testResult.diffInfo = getStringDiffInfo(testResult.got, expectedStr);
          }
        } catch (compErr) {
          console.error("=========================================");
          console.error("[INTERNAL ERROR] Output comparison crashed:", compErr);
          console.error("=========================================");
          testResult.passed = false;
          testResult.reason = "Crash interne de la vérification de la sortie.";
          testResult._interpreter_crash = true;
        }

        if (!testResult.passed) allPassed = false;
      } catch (e) {
        console.error("=========================================");
        console.error("[INTERNAL ERROR] executeCode violently crashed on test case:", i);
        console.error(e);
        console.error("=========================================");
        allPassed = false;
        testResult.reason = "Crash interne du système d'exécution (Interpréteur BQL).";
        testResult.passed = false;
        testResult._interpreter_crash = true;
      }

      evaluatedCases.push(testResult);
    }

    setIsExecuting(false);

    // 4. Bilan
    // Nouveau système de validation plus pédagogique et flexible
    const isLogicFirstMode = validationRules.mode === 'logic_first' || validationRules.mode === 'contains_output';
    const strictOutput = validationRules.strict_output !== false; // true par défaut

    const finalCases = evaluatedCases.map(tc => {
      const numMatch = numericMatch(tc.got, tc.expected);
      const isFormatIssue = !tc.passed && !tc.reason && numMatch;

      // Si erreur de format uniquement mais qu'on n'est pas strict, on valide complètement (perfect)
      if (isFormatIssue && !strictOutput) {
        return {
          ...tc,
          passed: true, 
          isAmbiguous: false, 
          _numericOk: true,
          formatWarning: false
        };
      }

      // En mode logic_first, c'est un warning. Sinon, ça reste un fail.
      return {
        ...tc,
        _numericOk: numMatch,
        formatWarning: isLogicFirstMode && isFormatIssue
      };
    });

    const allPerfect = finalCases.every(tc => tc.passed);
    // Si la logique est correcte pour tout (soit passé direct, soit format_warning), c'est gagné.
    const allLogicPassed = isLogicFirstMode && finalCases.every(tc => tc.passed || tc.formatWarning);
    const hasFormatOnly = !allPerfect && allLogicPassed;

    if ((allPassed || allLogicPassed) && evaluatedCases.length > 0) {
      if (user && activeCourseLesson.lessonId) {
        // 1. Progress
        await supabase
          .from("user_progress")
          .upsert(
            {
              user_id: user.id,
              lesson_id: activeCourseLesson.lessonId,
              completed: true,
            },
            { onConflict: "user_id,lesson_id" },
          );

        // 2. XP & Leveling
        const xpToAdd = activeCourseLesson.xp_value || 50; // Plus d'XP pour les challenges
        const { data: prof } = await supabase.from('profiles').select('xp, total_lessons_completed').eq('id', user.id).single();
        if (prof) {
          const newXp = (prof.xp || 0) + xpToAdd;
          const newLevel = Math.floor(newXp / 100) + 1;
          await supabase.from('profiles').update({ 
            xp: newXp, 
            level: newLevel,
            total_lessons_completed: (prof.total_lessons_completed || 0) + 1,
            last_active_at: new Date().toISOString()
          }).eq('id', user.id);
        }
      }
      
      const results = { cases: finalCases, keywordErrors: [], hasFormatOnly };
      
      if (hasFormatOnly) {
        results.cases = finalCases.map(tc => ({
          ...tc,
          // on force à passed pour l'UX général mais on garde formatWarning=true pour l'UI
          passed: tc.passed || tc.formatWarning
        }));
      }

      setValidationResults(results);
      setValidationState(hasFormatOnly ? 'warning' : 'success');
    } else {
      // Construire le rapport de feedback pédagogique
      const lessonContext = {
        required_keywords: validationRules.required_keywords || [],
        description: activeCourseLesson.lessonExercise || activeCourseLesson.lessonTitle || '',
        title: activeCourseLesson.lessonTitle || '',
      };
      
      // On regroupe les RuntimeErrors collectées durant l'exécution des tests
      const collectedRuntimeErrors = [];
      for (const resultsOfTest of evaluatedCases) {
         if (resultsOfTest._runtimeErrors && resultsOfTest._runtimeErrors.length > 0) {
            collectedRuntimeErrors.push(...resultsOfTest._runtimeErrors);
         }
      }
      astErrors.runtimeErrors = collectedRuntimeErrors;

      const feedbackReport = analyzeFeedback(source, evaluatedCases, lessonContext, astErrors);
      
      const isInternalError = 
        feedbackReport.errorType === 'VALIDATOR_INTERNAL_ERROR' || 
        feedbackReport.errorType === 'INTERPRETER_INTERNAL_ERROR';

      // Si l'analyse approfondie confirme que c'est UNIQUEMENT un problème de format, on valide !
      if (feedbackReport.errorType === 'OUTPUT_FORMAT') {
        if (user && activeCourseLesson.lessonId) {
          supabase
            .from("user_progress")
            .upsert(
              {
                user_id: user.id,
                lesson_id: activeCourseLesson.lessonId,
                completed: true,
              },
              { onConflict: "user_id,lesson_id" }
            ).then();
        }
        
        const formatCases = evaluatedCases.map(tc => ({
            ...tc,
            passed: tc.passed || true,
            formatWarning: !tc.passed
        }));

        setValidationResults({ cases: formatCases, keywordErrors: [], feedbackReport, hasFormatOnly: true });
        setValidationState("warning");
      } else if (isInternalError) {
        setValidationResults({ cases: evaluatedCases, keywordErrors: [], feedbackReport });
        setValidationState("internal_error");
      } else {
        setValidationResults({ cases: evaluatedCases, keywordErrors: [], feedbackReport });
        setValidationState('error');
      }
    }

    // Logger l'essai (Challenge)
    if (user && activeCourseLesson?.lessonId) {
      supabase.from('exercise_attempts').insert({
        user_id: user.id,
        lesson_id: activeCourseLesson.lessonId,
        success: allPassed || allLogicPassed,
        code_submitted: source,
        duration_ms: Date.now() - startTime,
        error_message: allPerfect ? null : "Échec de certains cas de test"
      }).then();
    }
  }, [activeFile, activeCourseLesson, user, setIsExecuting]);

  // ── handleSubmitInput : appelé quand l'user tape et soumet dans le terminal ─
  const handleSubmitInput = useCallback(
    (value) => {
      // Afficher la valeur saisie dans le terminal (comme un vrai terminal)
      const isPedagogic = settings?.showFieldNames === true;
      const lineToPrint = isPedagogic
        ? `${inputPrompt?.varName ?? "?"}: ${value}`
        : String(value);
      setOutputLines((prev) => [...prev, lineToPrint]);
      // Masquer le prompt
      setInputPrompt(null);
      // Résoudre la Promise que l'interpréteur attend
      if (inputResolverRef.current) {
        inputResolverRef.current(value);
        inputResolverRef.current = null;
      }
    },
    [inputPrompt, settings],
  );

  const handleFormatDoc = () => {
    try {
      const formatted = formatCode(activeFile.content, settings.tabSize);
      handleCodeChange(formatted);
      setFormatMessage("Code formaté avec succès");
      setTimeout(() => setFormatMessage(""), 3000);
    } catch (e) {
      console.error(e);
      setFormatMessage("Erreur lors du formatage");
      setTimeout(() => setFormatMessage(""), 3000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(activeFile.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNextStep = () => {
    if (stepResolverRef.current) {
      stepResolverRef.current();
      stepResolverRef.current = null;
    }
  };

  const handleReset = () => {
    if (settings.confirmBeforeReset !== false) {
      setIsResetConfirmOpen(true);
    } else {
      confirmReset();
    }
  };

  const confirmReset = () => {
    setIsResetConfirmOpen(false);
    setOutputLines([]);
    setStructuredErrors([]);
    setErrorSourceCode("");
    setActiveRightTab("terminal");
    setRunningLine(null);
    setVariablesSnapshot({});

    // Clear terminal history if needed
    if (settings.keepHistory === false) {
      localStorage.removeItem("bql_terminal_history");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleWorkspaceClick = () => {
    if (isProfileOpen) setIsProfileOpen(false);
  };

  const handleErrorClick = useCallback((line, col) => {
    setActiveMobilePane("editor");
    setTimeout(() => {
      editorRef.current?.jumpToLine(line, col);
    }, 50);
  }, []);

  return (
    <div
      className={`editor-layout global-theme-${settings?.globalTheme || "dark"} density-${settings?.interfaceDensity || "normal"} accent-${settings?.accentColor || "blue"} ${settings?.enableAnimations !== false ? "animations-enabled" : ""} ${settings?.enableVisualEffects !== false ? "visual-effects-enabled" : ""}`}
      onClick={handleWorkspaceClick}
    >
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        defaultSettings={DEFAULT_SETTINGS}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        displayName={displayName}
        displayEmail={displayEmail}
        userInitials={userInitials}
      />
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />

      {/* ── Confirm Reset Modal ── */}
      {isResetConfirmOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px", margin: "auto" }}
          >
            <div className="modal-header">
              <h3>Réinitialiser la console</h3>
              <button
                className="close-btn"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ padding: "1.5rem", lineHeight: 1.5, maxHeight: "none" }}
            >
              Voulez-vous vraiment réinitialiser la console et effacer
              l'historique d'exécution ?
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                style={{ background: "#ef4444" }}
                onClick={confirmReset}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar Top ── */}
      <header className="editor-header">
        <div className="header-left">
          <Link to="/" className="editor-brand">
            <div className="logo-icon-wrap-sm">
              <TerminalSquare size={18} />
            </div>
            <h2>
              BQL<span>algo</span>
            </h2>
          </Link>
          <nav className="editor-nav">
            {/* Using editor-nav-link to avoid App.css .nav-link bleed (the pink line) <a href="#defis" className="editor-nav-link">
              <Trophy size={16} /> Défis
            </a> */}
            <Link to="/cours" className="editor-nav-link">
              <BookOpen size={16} /> Espace Cours
            </Link>
           
          </nav>
        </div>

        <div className="header-center">
          <div className="action-pill">
           

            {isExecuting && settings.stepByStepExecution && (
              <button
                className="step-btn"
                onClick={handleNextStep}
                title="Instruction suivante (Pas-à-pas)"
              >
                <StepForward size={14} /> Pas
              </button>
            )}

            <button
              className={`run-button ${isExecuting ? "executing" : ""}`}
              onClick={handleRun}
              disabled={isExecuting && !settings.stepByStepExecution}
              title="Exécuter le code (Ctrl+Enter)"
            >
              {isExecuting ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              {isExecuting ? "Stop" : "Exécuter"}
            </button>

            {activeCourseLesson?.isChallenge && (
              <button
                className="run-button"
                style={{
                  background: "linear-gradient(to right, #eab308, #d97706)",
                  marginLeft: "10px",
                  boxShadow: "0 4px 15px rgba(217, 119, 6, 0.4)",
                }}
                onClick={handleValidateChallenge}
                disabled={isExecuting}
                title="Confronter le code aux cas de test"
              >
                <Award size={16} fill="currentColor" /> Valider
              </button>
            )}

            {!isExecuting && !isMobile && (
              <button
                className="reset-button"
                onClick={handleReset}
                title="Réinitialiser la console"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="header-right">
          {!isMobile ? (
            <>
              <button
                className="icon-btn"
                onClick={handleFormatDoc}
                title="Formater le code (Shift+Alt+F)"
              >
                <Wand2 size={18} />
              </button>
              <div className="header-divider"></div>

              <button
                className="icon-btn"
                onClick={handleDownload}
                title="Télécharger le fichier"
              >
                <DownloadCloud size={18} />
              </button>

              <button
                className="icon-btn"
                onClick={handleShare}
                title={copied ? "Code copié !" : "Copier le code"}
              >
                {copied ? (
                  <Check size={18} color="#34d399" />
                ) : (
                  <Share2 size={18} />
                )}
              </button>

              <div className="header-divider"></div>

              <button
                className="icon-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="Paramètres de l'éditeur"
              >
                <Settings size={18} />
              </button>

              <div className="header-divider"></div>
            </>
          ) : (
            <div className="profile-menu-container">
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
              >
                <Menu size={20} />
              </button>
              {isMobileMenuOpen && (
                <div
                  className="profile-menu mobile-action-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="profile-links">
                    <Link
                      to="/cours"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BookOpen size={16} /> Espace Cours
                    </Link>
                    <a
                      href="#defis"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Trophy size={16} /> Défis
                    </a>
                    <div className="header-divider-horizontal" />
                    <button
                      onClick={() => {
                        handleFormatDoc();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Wand2 size={16} /> Formater
                    </button>
                    <button
                      onClick={() => {
                        handleDownload();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <DownloadCloud size={16} /> Télécharger
                    </button>
                    <button
                      onClick={() => {
                        handleShare();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Share2 size={16} /> Partager
                    </button>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Settings size={16} /> Paramètres
                    </button>
                    <button
                      onClick={() => {
                        handleReset();
                        setIsMobileMenuOpen(false);
                      }}
                      className="danger-text"
                    >
                      <RotateCcw size={16} /> Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            {user?.isAdmin && (
              <button
                className="admin-dashboard-pill animate-fade-in"
                onClick={() => navigate("/admin/dashboard")}
                title="Accéder au Dashboard Admin"
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </button>
            )}

            <div className="header-divider"></div>

            <div className="profile-menu-container">

            <div
              className="user-avatar"
              title="Mon Profil"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileOpen(!isProfileOpen);
              }}
            >
              {user ? (
                <span className="avatar-initials">{userInitials}</span>
              ) : (
                <User size={18} />
              )}
            </div>

            {isProfileOpen && (
              <div
                className="profile-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="profile-header">
                  <div className="profile-header-avatar">{userInitials}</div>
                  <div className="profile-header-info">
                    <p className="profile-name" title={displayName}>
                      {displayName}
                    </p>
                    <p className="profile-email" title={displayEmail}>
                      {displayEmail}
                    </p>
                  </div>
                </div>
                <div className="profile-links">
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    <User size={14} /> Profil
                  </button>
                  <button
                    onClick={() => {
                      setIsBillingModalOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    <CreditCard size={14} /> Facturation
                  </button>
                </div>
                <div className="profile-footer">
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Workspace (Split Screen / Mobile Stack) ── */}
      <main
        ref={workspaceRef}
        className={`editor-workspace ${isMobile ? "mobile-view" : "desktop-view"}`}
      >
        {/* Left Pane: Code Editor */}
        <div
          className={`workspace-pane editor-pane-wrapper ${activeMobilePane === "editor" ? "mobile-active" : "mobile-hidden"}`}
          style={!isMobile ? { flex: `0 0 ${splitRatio}%` } : undefined}
        >
          {activeCourseLesson?.isChallenge && (
            <div
              style={{
                padding: "15px 20px",
                background: "rgba(250, 204, 21, 0.08)",
                borderBottom: "1px solid rgba(250, 204, 21, 0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Award size={20} color="#facc15" />
                <h3
                  style={{
                    margin: 0,
                    color: "#facc15",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                  }}
                >
                  {activeCourseLesson.lessonTitle}
                </h3>
              </div>
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.92rem",
                  marginBottom: "8px",
                  lineHeight: "1.5",
                }}
              >
                {activeCourseLesson.lessonContent}
              </p>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  fontStyle: "italic",
                  padding: "8px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "6px",
                  borderLeft: "3px solid #64748b",
                }}
              >
                {activeCourseLesson.lessonExercise}
              </div>
            </div>
          )}
          <div className="pane-header">
            <div className="tabs-container">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`tab ${activeFileId === file.id ? "active" : ""}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {file.name}
                  {files.length > 1 && (
                    <button
                      className="close-tab-btn"
                      onClick={(e) => closeFile(e, file.id)}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="add-file-btn"
              onClick={createNewFile}
              title="Créer un fichier .bql"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="pane-content">
            <CodeEditor
              ref={editorRef}
              code={activeFile.content}
              onChange={handleCodeChange}
              settings={settings}
              onFormat={handleFormatDoc}
              runningLine={runningLine}
            />
          </div>
        </div>
        {/* Drag Resizer — hidden on mobile via CSS */}
        <div
          ref={resizerRef}
          className="workspace-resizer"
          onMouseDown={handleResizerMouseDown}
          onTouchStart={(e) => handleResizerMouseDown(e.touches[0])}
          title="Glisser pour redimensionner"
        />

        {/* Right Pane: Terminal & Output */}
        <div
          className={`workspace-pane terminal-pane-wrapper ${activeMobilePane === "output" ? "mobile-active" : "mobile-hidden"}`}
          style={!isMobile ? { flex: `0 0 ${100 - splitRatio}%` } : undefined}
        >
          <div className="pane-header">
            <div className="tabs-container">
              <div
                className={`tab ${activeRightTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveRightTab("terminal")}
              >
                Terminal
              </div>
              <div
                className={`tab ${activeRightTab === "errors" ? "active" : ""}`}
                onClick={() => setActiveRightTab("errors")}
              >
                {structuredErrors.length > 0 && (
                  <AlertTriangle
                    size={12}
                    style={{ color: "#ef4444", marginRight: 4 }}
                  />
                )}
                Erreurs{" "}
                {structuredErrors.length > 0
                  ? `(${structuredErrors.length})`
                  : ""}
              </div>
              <div
                className={`tab ${activeRightTab === "visualisation" ? "active" : ""}`}
                onClick={() => setActiveRightTab("visualisation")}
              >
                Visualisation
              </div>
              <div
                className={`tab ${activeRightTab === "variables" ? "active" : ""}`}
                onClick={() => setActiveRightTab("variables")}
              >
                <List size={12} style={{ marginRight: 4 }} />
                Variables
              </div>
            </div>
          </div>
          <div className="pane-content">
            {activeRightTab === "terminal" && (
              <InteractiveTerminal
                lines={outputLines}
                inputPrompt={inputPrompt}
                onSubmitInput={handleSubmitInput}
                isRunning={isExecuting}
                settings={settings}
              />
            )}
            {activeRightTab === "variables" && (
              <div className="variables-visualizer">
                {Object.keys(variablesSnapshot).length === 0 ? (
                  <div className="empty-variables">
                    Aucune variable détectée pour le moment.
                  </div>
                ) : (
                  <div className="variables-grid">
                    {Object.entries(variablesSnapshot).map(([name, data]) => (
                      <div key={name} className="variable-card">
                        <div className="var-header">
                          <span className="var-type">
                            {data.type.toUpperCase()}
                          </span>
                          <span className="var-name">{name}</span>
                        </div>
                        <div className="var-value">
                          {Array.isArray(data.value)
                            ? `[Tableau ${data.value.length}]`
                            : String(data.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeRightTab === "errors" && (
              <ErrorPanel
                errors={structuredErrors}
                sourceCode={errorSourceCode}
                onErrorClick={handleErrorClick}
                settings={settings}
              />
            )}

            {/* Visualisation Pédagogique des Tableaux */}
            <ArrayVisualizer
              arrays={arrayData}
              records={recordData}
              lastAction={lastArrayAction}
              visible={
                settings.showArrayVisualizer !== false &&
                activeRightTab === "visualisation"
              }
              settings={settings}
              isMobile={isMobile}
            />
          </div>
        </div>
      </main>



      {/* ── Bottom Nav Bar (mobile only) ── */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn${activeMobilePane === "editor" ? " mobile-nav-btn--active" : ""}`}
          onClick={() => setActiveMobilePane("editor")}
        >
          <Code size={20} />
          <span>Éditeur</span>
        </button>

        <button
          className={`mobile-nav-btn run-nav-btn`}
          onClick={handleRun}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <Loader2 size={24} className="spin" />
          ) : (
            <Play size={24} fill="currentColor" />
          )}
        </button>

        <button
          className={`mobile-nav-btn${activeMobilePane === "output" && activeRightTab !== "visualisation" ? " mobile-nav-btn--active" : ""}`}
          onClick={() => {
            setActiveMobilePane("output");
            if (activeRightTab === "visualisation")
              setActiveRightTab("terminal");
          }}
        >
          {structuredErrors.length > 0 ? (
            <AlertTriangle size={20} color="#ef4444" />
          ) : (
            <Terminal size={20} />
          )}
          <span>Sortie</span>
        </button>
      </nav>

      {/* ── Status Bar (desktop only via CSS) ── */}
      <footer className="editor-statusbar">
        <div className="status-left">
          <span className="status-item">
            <TerminalSquare size={14} /> BQL-Strict
          </span>
          <span className="status-item">UTF-8</span>
          <span className="status-item success">● Serveur Connecté</span>
          {formatMessage && (
            <span
              className="status-item"
              style={{ color: "#34d399", fontWeight: "bold" }}
            >
              ✓ {formatMessage}
            </span>
          )}
        </div>
        <div className="status-right">
          <span className="status-item">
            Ln {activeFile.content.split("\n").length}, Col{" "}
            {activeFile.content.length - activeFile.content.lastIndexOf("\n")}
          </span>
          <span className="status-item">Espaces: 2</span>
        </div>
      </footer>

      {/* Validation Overlay */}
      <ValidationOverlay 
        isOpen={validationState !== 'idle'} 
        status={validationState} 
        results={validationResults} 
        onClose={() => setValidationState('idle')}
        onContinue={() => {
          setValidationState('idle');
          setActiveCourseLesson(null);
          navigate('/cours'); 
        }}
      />
    </div>
  );
};

export default EditorLayout;
