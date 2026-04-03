import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { TerminalSquare, Play, Loader2, BookOpen, Trophy, Settings, Plus, X, Share2, DownloadCloud, Check, User, CreditCard, LogOut, RotateCcw, AlertTriangle, Code, Terminal, Wand2, StepForward, List, MoreVertical } from 'lucide-react';
import CodeEditor from './CodeEditor';
import InteractiveTerminal from './InteractiveTerminal';
import ErrorPanel from './ErrorPanel';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import BillingModal from './BillingModal';
import ArrayVisualizer from './ArrayVisualizer';
import { executeCode, getStructuredErrors } from '../../lib/executeCode.js';
import { formatCode } from '../../lib/formatter/Formatter.js';
import './EditorLayout.css';

const DEFAULT_SETTINGS = {
  fontSize: '14',
  fontFamily: 'jetbrains',
  lineHeight: '1.5',
  fontLigatures: true,
  editorZoom: 100,
  tabSize: '4',
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
  errorDetailLevel: 'normal',
  autoGotoFirstError: true,
  groupSimilarErrors: true,
  showCorrectionSuggestions: true,
  terminalTheme: 'hacker',
  terminalFontSize: '14',
  clearTerminalOnRun: true,
  keepHistory: false,
  terminalSpeed: 'normal',
  globalTheme: 'dark',
  accentColor: 'blue',
  interfaceDensity: 'comfortable',
  enableAnimations: true,
  enableVisualEffects: false,
  autoSave: false,
  restoreLastSession: true,
  confirmBeforeReset: true,
  showFieldNames: false
};

const EditorLayout = () => {
  const editorRef = useRef(null);

  // Editor Settings State (defined first to be used in files init)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bql_editor_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) { }
    return DEFAULT_SETTINGS;
  });

  // Multi-file state
  const [files, setFiles] = useState(() => {
    let shouldRestore = DEFAULT_SETTINGS.restoreLastSession;
    try {
      const savedSettings = localStorage.getItem('bql_editor_settings');
      if (savedSettings) {
        shouldRestore = JSON.parse(savedSettings).restoreLastSession;
      }

      if (shouldRestore !== false) {
        const savedFiles = localStorage.getItem('bql_files_cache');
        if (savedFiles) {
          const parsed = JSON.parse(savedFiles);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) { }

    return [{ id: 1, name: 'main.bql', content: '' }];
  });

  const [activeFileId, setActiveFileId] = useState(() => files[0]?.id || 1);
  const [fileCounter, setFileCounter] = useState(() => {
    if (files.length === 0) return 2;
    const ids = files.map(f => f.id);
    return Math.max(...ids) + 1;
  });

  // --- STATES & REFS Initialization ---
  const [activeRightTab, setActiveRightTab] = useState('terminal');
  const [activeMobilePane, setActiveMobilePane] = useState('editor');
  const [outputLines, setOutputLines] = useState([]);
  const [structuredErrors, setStructuredErrors] = useState([]);
  const [errorSourceCode, setErrorSourceCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatMessage, setFormatMessage] = useState('');

  // Array Visualizer state
  const [arrayData, setArrayData] = useState(new Map());
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
  const [user, setUser] = useState(null);

  // ─ Auto Save Effect
  useEffect(() => {
    if (settings.autoSave !== false) {
      localStorage.setItem('bql_files_cache', JSON.stringify(files));
    }
  }, [files, settings.autoSave]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('bql_terminal_history');
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
      if (mobile && activeMobilePane === 'editor' && activeRightTab !== 'terminal') {
        // Optionally sync here or let user decide
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMobilePane, activeRightTab]);

  // Sync mobile pane with right tabs for desktop users who resize or vice-versa
  useEffect(() => {
    if (isMobile) {
      if (activeRightTab === 'terminal' || activeRightTab === 'errors' || activeRightTab === 'variables' || activeRightTab === 'cours') {
        if (activeMobilePane === 'editor') {
          // If we click a right tab toggle in desktop then resize, or if something triggers it
        }
      }
    }
  }, [activeRightTab, isMobile]);

  useEffect(() => {
    if (settings.keepHistory !== false && outputLines.length > 0) {
      localStorage.setItem('bql_terminal_history', JSON.stringify(outputLines));
    }
  }, [outputLines, settings.keepHistory]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('bql_editor_settings', JSON.stringify(newSettings));
  };

  const navigate = useNavigate();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Auth Listener
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Visiteur BQL";
  const displayEmail = user?.email || "Non connecté";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const handleCodeChange = (newCode) => {
    setFiles(files.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
  };

  const createNewFile = () => {
    const newFile = {
      id: fileCounter,
      name: `fichier${fileCounter}.bql`,
      content: ''
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setFileCounter(fileCounter + 1);
  };

  const closeFile = (e, idToClose) => {
    e.stopPropagation();
    if (files.length === 1) return; // Prevent closing the last file

    if (settings.confirmBeforeReset !== false) {
      const fileToClose = files.find(f => f.id === idToClose);
      if (fileToClose && fileToClose.content.trim() !== '') {
        if (!window.confirm(`Êtes-vous sûr de vouloir fermer "${fileToClose.name}" ? Vous risquez de perdre son contenu.`)) {
          return;
        }
      }
    }

    const newFiles = files.filter(f => f.id !== idToClose);
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
    setActiveRightTab('terminal');

    // Nettoyage terminal conditionnel (Lot 2)
    if (settings.clearTerminalOnRun !== false) {
      setOutputLines([]);
    }

    setStructuredErrors([]);
    setErrorSourceCode('');
    setInputPrompt(null);
    inputResolverRef.current = null;
    setRunningLine(null);
    setVariablesSnapshot({});

    // Arrays reset
    setArrayData(new Map());
    setLastArrayAction(null);

    // Basculer vers le terminal avant l'exécution
    setActiveMobilePane('output');

    // ── Callback output : ECRIRE() stream chaque ligne en direct ────────────
    const outputCallback = (line) => {
      setOutputLines(prev => [...prev, line]);
    };

    // ── Callback Pédagogique (Lot 3) ──
    const onStep = (line) => {
      // On ne surligne QUE si on est en mode pas-à-pas (évite les sauts rapides)
      if (settings.highlightRunningLine !== false && settings.stepByStepExecution === true) {
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
      return new Promise(resolve => {
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
    const onArrayUpdate = async (name, action, index, values) => {
      if (settings.showArrayVisualizer === false) return;

      setArrayData(prev => {
        const next = new Map(prev);
        const highlight = (action !== 'create' && index !== null)
          ? { index, type: action }
          : null;
        next.set(name, { values, highlight });
        return next;
      });

      if (action !== 'create' && index !== null) {
        const actionText = action === 'read' ? 'Lecture de' : 'Modification de';
        setLastArrayAction({ text: `${actionText} ${name}[${index}]` });
      } else if (action === 'create') {
        setLastArrayAction({ text: `Création du tableau ${name}` });
      }

      // Petite pause pour laisser l'animation respirer (80ms)
      await new Promise(r => setTimeout(r, 80));
    };

    try {
      // executeCode est désormais async → on peut await
      const result = await executeCode(currentSource, {
        output: outputCallback,
        input: inputCallback,
        onArrayUpdate: onArrayUpdate,
        terminalSpeed: settings.terminalSpeed || 'instant', // Lot 2
        onStep,
        onSnapshot,
        waitStep,
      });

      // Fin de l'exécution : masquer le surlignage pédagogique
      setRunningLine(null);
      setVariablesSnapshot({});
      setInputPrompt(null);

      // ── Construire les erreurs structurées pour ErrorPanel ─────────────────
      const structured = getStructuredErrors(result.errors, currentSource, settings);
      setStructuredErrors(structured);
      setErrorSourceCode(currentSource);

      if (result.success && result.errors.length === 0) {
        // Succès : si pas de sortie streaming, afficher le résumé
        if (result.output.length > 0 && outputLines.length === 0) {
          setOutputLines(result.output);
        }
        setActiveRightTab('terminal');
      } else {
        // Erreurs : résumé dans le terminal + basculer vers le panneau erreurs
        const summaryParts = [];
        if (result.lexicalErrors?.length) summaryParts.push(`${result.lexicalErrors.length} lexicale(s)`);
        if (result.syntaxErrors?.length) summaryParts.push(`${result.syntaxErrors.length} syntaxique(s)`);
        if (result.semanticErrors?.length) summaryParts.push(`${result.semanticErrors.length} sémantique(s)`);
        if (result.runtimeErrors?.length) summaryParts.push(`${result.runtimeErrors.length} d'exécution`);

        const total = result.errors.length;
        const summary = summaryParts.length > 0
          ? `[Erreurs : ${summaryParts.join(', ')}]`
          : `[${total} erreur(s) détectée(s)]`;

        setOutputLines(prev =>
          prev.length > 0 ? [...prev, summary] : [summary]
        );
        setActiveRightTab('errors');

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
      setOutputLines(prev => [
        ...prev,
        `[Erreur interne] ${unexpected?.message ?? 'Erreur inconnue'}`,
      ]);
      setInputPrompt(null);
    } finally {
      setIsExecuting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  // ── handleSubmitInput : appelé quand l'user tape et soumet dans le terminal ─
  const handleSubmitInput = useCallback((value) => {
    // Afficher la valeur saisie dans le terminal (comme un vrai terminal)
    const isPedagogic = settings?.showFieldNames === true;
    const lineToPrint = isPedagogic ? `${inputPrompt?.varName ?? '?'}: ${value}` : String(value);
    setOutputLines(prev => [...prev, lineToPrint]);
    // Masquer le prompt
    setInputPrompt(null);
    // Résoudre la Promise que l'interpréteur attend
    if (inputResolverRef.current) {
      inputResolverRef.current(value);
      inputResolverRef.current = null;
    }
  }, [inputPrompt, settings]);

  const handleFormatDoc = () => {
    try {
      const formatted = formatCode(activeFile.content, settings.tabSize);
      handleCodeChange(formatted);
      setFormatMessage("Code formaté avec succès");
      setTimeout(() => setFormatMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setFormatMessage("Erreur lors du formatage");
      setTimeout(() => setFormatMessage(''), 3000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(activeFile.content)
      .then(() => {
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
    setErrorSourceCode('');
    setActiveRightTab('terminal');
    setRunningLine(null);
    setVariablesSnapshot({});

    // Clear terminal history if needed
    if (settings.keepHistory === false) {
      localStorage.removeItem('bql_terminal_history');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleWorkspaceClick = () => {
    if (isProfileOpen) setIsProfileOpen(false);
  };

  const handleErrorClick = useCallback((line, col) => {
    setActiveMobilePane('editor');
    setTimeout(() => {
      editorRef.current?.jumpToLine(line, col);
    }, 50);
  }, []);

  return (
    <div className={`editor-layout global-theme-${settings?.globalTheme || 'dark'} density-${settings?.interfaceDensity || 'normal'} accent-${settings?.accentColor || 'blue'} ${settings?.enableAnimations !== false ? 'animations-enabled' : ''} ${settings?.enableVisualEffects !== false ? 'visual-effects-enabled' : ''}`} onClick={handleWorkspaceClick}>
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
        <div className="modal-backdrop" onClick={() => setIsResetConfirmOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', margin: 'auto' }}>
            <div className="modal-header">
              <h3>Réinitialiser la console</h3>
              <button className="close-btn" onClick={() => setIsResetConfirmOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', lineHeight: 1.5, maxHeight: 'none' }}>
              Voulez-vous vraiment réinitialiser la console et effacer l'historique d'exécution ?
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsResetConfirmOpen(false)}>Annuler</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={confirmReset}>
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
            <h2>BQL<span>algo</span></h2>
          </Link>
          <nav className="editor-nav">
            {/* Using editor-nav-link to avoid App.css .nav-link bleed (the pink line) */}
            <a href="#cours" className="editor-nav-link"><BookOpen size={16} /> Espace Cours</a>
            <a href="#defis" className="editor-nav-link"><Trophy size={16} /> Défis</a>
          </nav>
        </div>

        <div className="header-center">
          <div className="action-pill">
            <span className="env-badge">BQL Environnement</span>

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
              className={`run-button ${isExecuting ? 'executing' : ''}`}
              onClick={handleRun}
              disabled={isExecuting && !settings.stepByStepExecution}
              title="Exécuter le code (Ctrl+Enter)"
            >
              {isExecuting ? <Loader2 size={16} className="spin" /> : <Play size={16} fill="currentColor" />}
              {isExecuting ? 'Stop' : 'Exécuter'}
            </button>

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
              <button className="icon-btn" onClick={handleFormatDoc} title="Formater le code (Shift+Alt+F)">
                <Wand2 size={18} />
              </button>
              <div className="header-divider"></div>

              <button className="icon-btn" onClick={handleDownload} title="Télécharger le fichier">
                <DownloadCloud size={18} />
              </button>

              <button className="icon-btn" onClick={handleShare} title={copied ? "Code copié !" : "Copier le code"}>
                {copied ? <Check size={18} color="#34d399" /> : <Share2 size={18} />}
              </button>

              <div className="header-divider"></div>

              <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Paramètres de l'éditeur">
                <Settings size={18} />
              </button>

              <div className="header-divider"></div>
            </>
          ) : (
            <div className="profile-menu-container">
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}>
                <MoreVertical size={20} />
              </button>
              {isMobileMenuOpen && (
                <div className="profile-menu mobile-action-menu" onClick={e => e.stopPropagation()}>
                  <div className="profile-links">
                    <button onClick={() => { handleFormatDoc(); setIsMobileMenuOpen(false); }}>
                      <Wand2 size={16} /> Formater
                    </button>
                    <button onClick={() => { handleDownload(); setIsMobileMenuOpen(false); }}>
                      <DownloadCloud size={16} /> Télécharger
                    </button>
                    <button onClick={() => { handleShare(); setIsMobileMenuOpen(false); }}>
                      <Share2 size={16} /> Partager
                    </button>
                    <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}>
                      <Settings size={16} /> Paramètres
                    </button>
                    <button onClick={() => { handleReset(); setIsMobileMenuOpen(false); }} className="danger-text">
                      <RotateCcw size={16} /> Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="profile-menu-container">
            <div className="user-avatar" title="Mon Profil" onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}>
              {user ? (
                <span className="avatar-initials">{userInitials}</span>
              ) : (
                <User size={18} />
              )}
            </div>

            {isProfileOpen && (
              <div className="profile-menu" onClick={e => e.stopPropagation()}>
                <div className="profile-header">
                  <div className="profile-header-avatar">{userInitials}</div>
                  <div className="profile-header-info">
                    <p className="profile-name" title={displayName}>{displayName}</p>
                    <p className="profile-email" title={displayEmail}>{displayEmail}</p>
                  </div>
                </div>
                <div className="profile-links">
                  <button onClick={() => { setIsProfileModalOpen(true); setIsProfileOpen(false); }}>
                    <User size={14} /> Profil
                  </button>
                  <button onClick={() => { setIsBillingModalOpen(true); setIsProfileOpen(false); }}>
                    <CreditCard size={14} /> Facturation
                  </button>
                </div>
                <div className="profile-footer">
                  <button className="logout-btn" onClick={handleLogout}><LogOut size={14} /> Se déconnecter</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Workspace (Split Screen / Mobile Stack) ── */}
      <main className={`editor-workspace ${isMobile ? 'mobile-view' : 'desktop-view'}`}>
        {/* Left Pane: Code Editor */}
        <div className={`workspace-pane editor-pane-wrapper ${activeMobilePane === 'editor' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="pane-header">
            <div className="tabs-container">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`tab ${activeFileId === file.id ? 'active' : ''}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {file.name}
                  {files.length > 1 && (
                    <button className="close-tab-btn" onClick={(e) => closeFile(e, file.id)}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-file-btn" onClick={createNewFile} title="Créer un fichier .bql">
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

        <div className="workspace-resizer mobile-resizer-hidden"></div>

        {/* Right Pane: Terminal & Cours */}
        <div className={`workspace-pane terminal-pane-wrapper ${activeMobilePane === 'output' ? 'mobile-active' : 'mobile-hidden'}`}>
          <div className="pane-header">
            <div className="tabs-container">
              <div
                className={`tab ${activeRightTab === 'terminal' ? 'active' : ''}`}
                onClick={() => setActiveRightTab('terminal')}
              >
                Terminal
              </div>
              <div
                className={`tab ${activeRightTab === 'errors' ? 'active' : ''}`}
                onClick={() => setActiveRightTab('errors')}
              >
                {structuredErrors.length > 0 && (
                  <AlertTriangle size={12} style={{ color: '#ef4444', marginRight: 4 }} />
                )}
                Erreurs {structuredErrors.length > 0 ? `(${structuredErrors.length})` : ''}
              </div>
              <div
                className={`tab ${activeRightTab === 'cours' ? 'active' : ''}`}
                onClick={() => setActiveRightTab('cours')}
              >
                Cours
              </div>
              <div
                className={`tab ${activeRightTab === 'variables' ? 'active' : ''}`}
                onClick={() => setActiveRightTab('variables')}
              >
                <List size={12} style={{ marginRight: 4 }} />
                Variables
              </div>
            </div>
          </div>
          <div className="pane-content">
            {activeRightTab === 'terminal' && (
              <InteractiveTerminal
                lines={outputLines}
                inputPrompt={inputPrompt}
                onSubmitInput={handleSubmitInput}
                isRunning={isExecuting}
                settings={settings}
              />
            )}
            {activeRightTab === 'variables' && (
              <div className="variables-visualizer">
                {Object.keys(variablesSnapshot).length === 0 ? (
                  <div className="empty-variables">Aucune variable détectée pour le moment.</div>
                ) : (
                  <div className="variables-grid">
                    {Object.entries(variablesSnapshot).map(([name, data]) => (
                      <div key={name} className="variable-card">
                        <div className="var-header">
                          <span className="var-type">{data.type.toUpperCase()}</span>
                          <span className="var-name">{name}</span>
                        </div>
                        <div className="var-value">
                          {Array.isArray(data.value) ? `[Tableau ${data.value.length}]` : String(data.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeRightTab === 'errors' && (
              <ErrorPanel
                errors={structuredErrors}
                sourceCode={errorSourceCode}
                onErrorClick={handleErrorClick}
                settings={settings}
              />
            )}
            {activeRightTab === 'cours' && (
              <div className="cours-placeholder">
                <BookOpen size={48} className="cours-icon" />
                <h3>Espace Cours</h3>
                <p>Sélectionnez un module de cours dans la navigation pour l'afficher ici.</p>
              </div>
            )}

            {/* Visualisation Pédagogique des Tableaux */}
            <ArrayVisualizer
              arrays={arrayData}
              lastAction={lastArrayAction}
              visible={settings.showArrayVisualizer !== false}
            />
          </div>
        </div>
      </main>

      {/* ── Bottom Nav Bar (mobile only) ── */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn${activeMobilePane === 'editor' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveMobilePane('editor')}
        >
          <Code size={20} />
          <span>Éditeur</span>
        </button>

        <button
          className={`mobile-nav-btn run-nav-btn`}
          onClick={handleRun}
          disabled={isExecuting}
        >
          {isExecuting
            ? <Loader2 size={24} className="spin" />
            : <Play size={24} fill="currentColor" />
          }
        </button>

        <button
          className={`mobile-nav-btn${activeMobilePane === 'output' && activeRightTab !== 'cours' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => { setActiveMobilePane('output'); if(activeRightTab === 'cours') setActiveRightTab('terminal'); }}
        >
          {structuredErrors.length > 0
            ? <AlertTriangle size={20} color="#ef4444" />
            : <Terminal size={20} />
          }
          <span>Sortie</span>
        </button>
      </nav>

      {/* ── Status Bar (desktop only via CSS) ── */}
      <footer className="editor-statusbar">
        <div className="status-left">
          <span className="status-item"><TerminalSquare size={14} /> BQL-Strict</span>
          <span className="status-item">UTF-8</span>
          <span className="status-item success">● Serveur Connecté</span>
          {formatMessage && <span className="status-item" style={{ color: '#34d399', fontWeight: 'bold' }}>✓ {formatMessage}</span>}
        </div>
        <div className="status-right">
          <span className="status-item">Ln {activeFile.content.split('\n').length}, Col {activeFile.content.length - activeFile.content.lastIndexOf('\n')}</span>
          <span className="status-item">Espaces: 2</span>
        </div>
      </footer>
    </div>
  );
};


export default EditorLayout;
