import React from 'react';
import { Plus, X, AlertTriangle, List, Award } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import InteractiveTerminal from '../InteractiveTerminal';
import ErrorPanel from '../ErrorPanel';
import ArrayVisualizer from '../ArrayVisualizer';

const EditorPanels = ({
  editorRef,
  files,
  activeFileId,
  setActiveFileId,
  createNewFile,
  closeFile,
  activeFile,
  handleCodeChange,
  handleFormatDoc,
  runningLine,
  activeCourseLesson,
  activeMobilePane,
  activeRightTab,
  setActiveRightTab,
  outputLines,
  inputPrompt,
  handleSubmitInput,
  isExecuting,
  structuredErrors,
  errorSourceCode,
  handleErrorClick,
  variablesSnapshot,
  arrayData,
  recordData,
  lastArrayAction,
  settings,
  isMobile,
  splitRatio,
  resizerRef,
  workspaceRef,
  handleResizerMouseDown,
}) => {
  return (
    <main
      ref={workspaceRef}
      className={`editor-workspace ${isMobile ? 'mobile-view' : 'desktop-view'}`}
    >
      <div
        className={`workspace-pane editor-pane-wrapper ${activeMobilePane === 'editor' ? 'mobile-active' : 'mobile-hidden'}`}
        style={!isMobile ? { flex: `0 0 ${splitRatio}%` } : undefined}
      >
        {activeCourseLesson?.isChallenge && (
          <div
            style={{
              padding: '15px 20px',
              background: 'rgba(250, 204, 21, 0.08)',
              borderBottom: '1px solid rgba(250, 204, 21, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <Award size={20} color="#facc15" />
              <h3
                style={{
                  margin: 0,
                  color: '#facc15',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                }}
              >
                {activeCourseLesson.lessonTitle}
              </h3>
            </div>
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '0.92rem',
                marginBottom: '8px',
                lineHeight: '1.5',
              }}
            >
              {activeCourseLesson.lessonContent}
            </p>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                fontStyle: 'italic',
                padding: '8px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
                borderLeft: '3px solid #64748b',
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
                className={`tab ${activeFileId === file.id ? 'active' : ''}`}
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

      <div
        ref={resizerRef}
        className="workspace-resizer"
        onMouseDown={handleResizerMouseDown}
        onTouchStart={(e) => handleResizerMouseDown(e.touches[0])}
        title="Glisser pour redimensionner"
      />

      <div
        className={`workspace-pane terminal-pane-wrapper ${activeMobilePane === 'output' ? 'mobile-active' : 'mobile-hidden'}`}
        style={!isMobile ? { flex: `0 0 ${100 - splitRatio}%` } : undefined}
      >
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
                <AlertTriangle
                  size={12}
                  style={{ color: '#ef4444', marginRight: 4 }}
                />
              )}
              Erreurs{' '}
              {structuredErrors.length > 0
                ? `(${structuredErrors.length})`
                : ''}
            </div>
            <div
              className={`tab ${activeRightTab === 'visualisation' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('visualisation')}
            >
              Visualisation
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
          {activeRightTab === 'errors' && (
            <ErrorPanel
              errors={structuredErrors}
              sourceCode={errorSourceCode}
              onErrorClick={handleErrorClick}
              settings={settings}
            />
          )}

          <ArrayVisualizer
            arrays={arrayData}
            records={recordData}
            lastAction={lastArrayAction}
            visible={
              settings.showArrayVisualizer !== false &&
              activeRightTab === 'visualisation'
            }
            settings={settings}
            isMobile={isMobile}
          />
        </div>
      </div>
    </main>
  );
};

export default EditorPanels;
