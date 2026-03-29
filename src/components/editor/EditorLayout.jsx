import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { TerminalSquare, Play, Loader2, BookOpen, Trophy, Settings, Plus, X, Share2, DownloadCloud, Check, User, CreditCard, LogOut, RotateCcw, AlertTriangle, Code, Terminal } from 'lucide-react';
import CodeEditor from './CodeEditor';
import InteractiveTerminal from './InteractiveTerminal';
import ErrorPanel from './ErrorPanel';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import BillingModal from './BillingModal';
import { executeCode } from '../../lib/executeCode.js';
import { formatErrorReact } from '../../lib/errors/formatError.js';
import './EditorLayout.css';

const EditorLayout = () => {
  // Multi-file state
  const [files, setFiles] = useState([
    { id: 1, name: 'main.bql', content: '' }
  ]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [fileCounter, setFileCounter] = useState(2);

  // Right pane state
  const [activeRightTab, setActiveRightTab] = useState('terminal');

  // Mobile : quel panneau est actif (editor | output)
  const [activeMobilePane, setActiveMobilePane] = useState('editor');

  const [outputLines, setOutputLines] = useState([]);
  const [structuredErrors, setStructuredErrors] = useState([]);
  const [errorSourceCode, setErrorSourceCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals & Menus state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  const [user, setUser] = useState(null);

  // Editor Settings State
  const [settings, setSettings] = useState({
    fontSize: '14',
    fontFamily: 'jetbrains',
    tabSize: '2',
    wordWrap: false,
    theme: 'hacker'
  });

  const navigate = useNavigate();

  const activeFile = files.find(f => f.id === activeFileId);

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

    // Reset de l'état
    setIsExecuting(true);
    setActiveRightTab('terminal');
    setOutputLines([]);
    setStructuredErrors([]);
    setErrorSourceCode('');
    setInputPrompt(null);
    inputResolverRef.current = null;

    // Basculer vers le terminal avant l'exécution
    setActiveMobilePane('output');

    // ── Callback output : ECRIRE() stream chaque ligne en direct ────────────
    const outputCallback = (line) => {
      setOutputLines(prev => [...prev, line]);
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

    try {
      // executeCode est désormais async → on peut await
      const result = await executeCode(source, {
        output: outputCallback,
        input: inputCallback,
      });

      // Fin de l'exécution : masquer le prompt
      setInputPrompt(null);

      // ── Construire les erreurs structurées pour ErrorPanel ─────────────────
      const structured = result.errors.map(err => formatErrorReact(err, source));
      setStructuredErrors(structured);
      setErrorSourceCode(source);

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
    setOutputLines(prev => [...prev, `${inputPrompt?.varName ?? '?'}: ${value}`]);
    // Masquer le prompt
    setInputPrompt(null);
    // Résoudre la Promise que l'interpréteur attend
    if (inputResolverRef.current) {
      inputResolverRef.current(value);
      inputResolverRef.current = null;
    }
  }, [inputPrompt]);



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

  const handleReset = () => {
    setOutputLines([]);
    setStructuredErrors([]);
    setErrorSourceCode('');
    setActiveRightTab('terminal');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Close profile dropdown when clicking outside
  const handleWorkspaceClick = () => {
    if (isProfileOpen) setIsProfileOpen(false);
  };

  return (
    <div className="editor-layout" onClick={handleWorkspaceClick}>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
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
            <button
              className={`run-button ${isExecuting ? 'executing' : ''}`}
              onClick={handleRun}
              disabled={isExecuting}
              title="Exécuter le code (Ctrl+Enter)"
            >
              {isExecuting ? <Loader2 size={16} className="spin" /> : <Play size={16} fill="currentColor" />}
              {isExecuting ? 'Exécution...' : 'Exécuter'}
            </button>
            <button
              className="reset-button"
              onClick={handleReset}
              title="Réinitialiser la console"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="header-right">
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
      <main className="editor-workspace">
        {/* Left Pane: Code Editor */}
        <div className={`workspace-pane editor-pane-wrapper${activeMobilePane === 'editor' ? ' mobile-active' : ' mobile-hidden'}`}>
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
              code={activeFile.content} 
              onChange={handleCodeChange} 
              settings={settings}
            />
          </div>
        </div>

        <div className="workspace-resizer mobile-resizer-hidden"></div>

        {/* Right Pane: Terminal & Cours */}
        <div className={`workspace-pane terminal-pane-wrapper${activeMobilePane === 'output' ? ' mobile-active' : ' mobile-hidden'}`}>
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
            {activeRightTab === 'errors' && (
              <ErrorPanel errors={structuredErrors} sourceCode={errorSourceCode} />
            )}
            {activeRightTab === 'cours' && (
              <div className="cours-placeholder">
                <BookOpen size={48} className="cours-icon" />
                <h3>Espace Cours</h3>
                <p>Sélectionnez un module de cours dans la navigation pour l'afficher ici.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Bottom Nav Bar (mobile only) ── */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn${activeMobilePane === 'editor' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveMobilePane('editor')}
        >
          <Code size={18} />
          <span>Éditeur</span>
        </button>

        <button
          className={`mobile-nav-btn run-nav-btn`}
          onClick={handleRun}
          disabled={isExecuting}
        >
          {isExecuting
            ? <Loader2 size={20} className="spin" />
            : <Play size={20} fill="currentColor" />
          }
          <span>{isExecuting ? '...' : 'Lancer'}</span>
        </button>

        <button
          className={`mobile-nav-btn${activeMobilePane === 'output' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveMobilePane('output')}
        >
          {structuredErrors.length > 0
            ? <AlertTriangle size={18} color="#ef4444" />
            : <Terminal size={18} />
          }
          <span>
            {structuredErrors.length > 0 ? `Erreurs (${structuredErrors.length})` : 'Terminal'}
          </span>
        </button>
      </nav>

      {/* ── Status Bar (desktop only via CSS) ── */}
      <footer className="editor-statusbar">
        <div className="status-left">
          <span className="status-item"><TerminalSquare size={14} /> BQL-Strict</span>
          <span className="status-item">UTF-8</span>
          <span className="status-item success">● Serveur Connecté</span>
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
