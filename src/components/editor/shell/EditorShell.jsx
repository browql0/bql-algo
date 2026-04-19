import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import {
  TerminalSquare,
  BookOpen,
  Trophy,
  Settings,
  Share2,
  DownloadCloud,
  Check,
  User,
  X,
  LogOut,
  RotateCcw,
  Wand2,
  Menu,
  ShieldCheck,
  Terminal,
  Code,
  AlertTriangle,
  Play,
  Loader2,
} from 'lucide-react';
import SettingsModal from '../SettingsModal';
import ProfileModal from '../ProfileModal';
import BillingModal from '../BillingModal';
import { ValidationOverlay } from '../ValidationOverlay';
import { formatCode } from '../../../lib/formatter/Formatter.js';
import { DEFAULT_SETTINGS } from '../editorDefaults';
import EditorPanels from '../panels/EditorPanels';
import EditorActions from '../actions/EditorActions';
import EditorStatusBar from '../panels/EditorStatusBar';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { useEditorFiles } from '../hooks/useEditorFiles';
import { useEditorLesson } from '../hooks/useEditorLesson';
import { useEditorResize } from '../hooks/useEditorResize';
import { useEditorExecution } from '../hooks/useEditorExecution';
import { useEditorValidation } from '../hooks/useEditorValidation';
import { useEditorMobile } from '../hooks/useEditorMobile';
import { clearEditorHistory } from '../services/editorStorage';
import '../EditorLayout.css';

const EditorShell = () => {
  const editorRef = useRef(null);

  const [activeRightTab, setActiveRightTab] = useState('terminal');
  const [activeMobilePane, setActiveMobilePane] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [formatMessage, setFormatMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { settings, handleSaveSettings } = useEditorSettings();
  const {
    files,
    setFiles,
    activeFile,
    activeFileId,
    setActiveFileId,
    handleCodeChange,
    createNewFile,
    closeFile,
  } = useEditorFiles(settings);

  const { activeCourseLesson, setActiveCourseLesson } = useEditorLesson(
    setFiles,
    setActiveFileId,
  );

  const { splitRatio, resizerRef, workspaceRef, handleResizerMouseDown } =
    useEditorResize();

  const { isMobile, isMobileMenuOpen, setIsMobileMenuOpen } = useEditorMobile(
    activeMobilePane,
    activeRightTab,
  );

  const handleErrorClick = useCallback((line, col) => {
    setActiveMobilePane('editor');
    setTimeout(() => {
      editorRef.current?.jumpToLine(line, col);
    }, 50);
  }, []);

  const {
    outputLines,
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
  } = useEditorExecution({
    activeFile,
    settings,
    user,
    setActiveRightTab,
    setActiveMobilePane,
    onErrorNavigate: handleErrorClick,
  });

  const {
    validationState,
    validationResults,
    setValidationState,
    handleValidateChallenge,
  } = useEditorValidation({
    activeCourseLesson,
    activeFile,
    setActiveRightTab,
    appendOutputLines,
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Visiteur BQL';
  const displayEmail = user?.email || 'Non connecté';
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const handleFormatDoc = () => {
    try {
      const formatted = formatCode(activeFile.content, settings.tabSize);
      handleCodeChange(formatted);
      setFormatMessage('Code format? avec succès');
      setTimeout(() => setFormatMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setFormatMessage('Erreur lors du formatage');
      setTimeout(() => setFormatMessage(''), 3000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeFile.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(activeFile.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
    resetExecutionState();
    setActiveRightTab('terminal');

    if (settings.keepHistory === false) {
      clearEditorHistory();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleWorkspaceClick = () => {
    if (isProfileOpen) setIsProfileOpen(false);
  };

  return (
    <div
      className={`editor-layout global-theme-${settings?.globalTheme || 'dark'} density-${settings?.interfaceDensity || 'normal'} accent-${settings?.accentColor || 'blue'} ${settings?.enableAnimations !== false ? 'animations-enabled' : ''} ${settings?.enableVisualEffects !== false ? 'visual-effects-enabled' : ''}`}
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

      {isResetConfirmOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', margin: 'auto' }}
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
              style={{ padding: '1.5rem', lineHeight: 1.5, maxHeight: 'none' }}
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
                style={{ background: '#ef4444' }}
                onClick={confirmReset}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

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
            <Link to="/cours" className="editor-nav-link">
              <BookOpen size={16} /> Espace Cours
            </Link>
          </nav>
        </div>

        <div className="header-center">
          <EditorActions
            isExecuting={isExecuting}
            settings={settings}
            activeCourseLesson={activeCourseLesson}
            validationState={validationState}
            onRun={handleRun}
            onValidate={handleValidateChallenge}
            onNextStep={handleNextStep}
            onReset={handleReset}
            isMobile={isMobile}
          />
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
                title={copied ? 'Code copi? !' : 'Copier le code'}
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
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
              >
                <Menu size={20} />
              </button>
              {isMobileMenuOpen && (
                <div
                  className="profile-menu mobile-action-menu"
                  onClick={(event) => event.stopPropagation()}
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
              onClick={() => navigate('/admin/dashboard')}
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
              onClick={(event) => {
                event.stopPropagation();
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
                onClick={(event) => event.stopPropagation()}
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

      <EditorPanels
        editorRef={editorRef}
        files={files}
        activeFileId={activeFileId}
        setActiveFileId={setActiveFileId}
        createNewFile={createNewFile}
        closeFile={closeFile}
        activeFile={activeFile}
        handleCodeChange={handleCodeChange}
        handleFormatDoc={handleFormatDoc}
        runningLine={runningLine}
        activeCourseLesson={activeCourseLesson}
        activeMobilePane={activeMobilePane}
        activeRightTab={activeRightTab}
        setActiveRightTab={setActiveRightTab}
        outputLines={outputLines}
        inputPrompt={inputPrompt}
        handleSubmitInput={handleSubmitInput}
        isExecuting={isExecuting}
        structuredErrors={structuredErrors}
        errorSourceCode={errorSourceCode}
        handleErrorClick={handleErrorClick}
        arrayData={arrayData}
        recordData={recordData}
        lastArrayAction={lastArrayAction}
        settings={settings}
        isMobile={isMobile}
        splitRatio={splitRatio}
        resizerRef={resizerRef}
        workspaceRef={workspaceRef}
        handleResizerMouseDown={handleResizerMouseDown}
        variablesSnapshot={variablesSnapshot}
      />

      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn${activeMobilePane === 'editor' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveMobilePane('editor')}
        >
          <Code size={20} />
          <span>Éditeur</span>
        </button>

        <button
          className="mobile-nav-btn run-nav-btn"
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
          className={`mobile-nav-btn${activeMobilePane === 'output' && activeRightTab !== 'visualisation' ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => {
            setActiveMobilePane('output');
            if (activeRightTab === 'visualisation') setActiveRightTab('terminal');
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

      <EditorStatusBar activeFile={activeFile} formatMessage={formatMessage} />

      <ValidationOverlay
        isOpen={validationState !== 'idle'}
        status={validationState}
        results={validationResults}
        onClose={() => setValidationState('idle')}
        onContinue={() => {
          setValidationState('idle');
          setActiveCourseLesson(null);
          sessionStorage.removeItem('bql_active_lesson');
          navigate('/cours');
        }}
      />
    </div>
  );
};

export default EditorShell;
