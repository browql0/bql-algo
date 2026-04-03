import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Type, AlignLeft, Wand2, Layout, AlertTriangle, 
  Terminal, Palette, Folder, RotateCcw, Check, ChevronDown, Sliders
} from 'lucide-react';
import './SettingsModal.css';

// ── Composants d'UI génériques ──────────────────────────────────────────────

const CustomSelect = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0] || { label: '' };

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div className={`custom-select-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOpt.label}</span>
        <ChevronDown size={14} className={`select-icon ${isOpen ? 'rotated' : ''}`} />
      </div>
      {isOpen && (
        <div className="custom-select-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
    />
    <span className="slider"></span>
  </label>
);

const RangeSlider = ({ value, min, max, step, onChange, unit = "" }) => (
  <div className="range-slider-container">
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      className="range-input"
    />
    <span className="range-value">{value}{unit}</span>
  </div>
);

// ── Configuration des Onglets ────────────────────────────────────────────────

const TABS = [
  { id: 'typography', label: 'Typographie', icon: Type },
  { id: 'editor', label: 'Édition', icon: AlignLeft },
  { id: 'formatting', label: 'Formatage', icon: Wand2 },
  { id: 'pedagogy', label: 'Pédagogie', icon: Layout },
  { id: 'diagnostics', label: 'Diagnostic', icon: AlertTriangle },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'project', label: 'Projet', icon: Folder },
];

const SettingsModal = ({ isOpen, onClose, settings, onSave, defaultSettings }) => {
  const [activeTab, setActiveTab] = useState('typography');
  const [localSettings, setLocalSettings] = useState(settings);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchroniser quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Nettoyage de l'ancienne propriété (migration)
      let syncedSettings = { ...settings };
      if (syncedSettings.theme && !syncedSettings.terminalTheme) {
        syncedSettings.terminalTheme = syncedSettings.theme;
        delete syncedSettings.theme;
      }
      if (syncedSettings.showArrayVisualizer !== undefined && syncedSettings.show1DVisualizer === undefined) {
         syncedSettings.show1DVisualizer = syncedSettings.showArrayVisualizer;
      }
      
      setLocalSettings(syncedSettings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const update = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm("Voulez-vous vraiment restaurer tous les paramètres par défaut ?")) {
      setLocalSettings({ ...defaultSettings });
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const renderTabContent = (tabId = activeTab) => {
    switch (tabId) {
      case 'typography':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Typographie de l'Éditeur</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <label>Taille de police</label>
                <span className="setting-desc">Taille globale du texte dans le code source.</span>
              </div>
              <CustomSelect 
                value={String(localSettings.fontSize)} 
                onChange={(v) => update('fontSize', v)}
                options={[
                  { value: '12', label: '12px (Petit)' },
                  { value: '14', label: '14px (Défaut)' },
                  { value: '16', label: '16px (Grand)' },
                  { value: '18', label: '18px (Très grand)' },
                  { value: '20', label: '20px (Maximum)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Famille de police</label>
                <span className="setting-desc">Police monospace privilégiée pour le code.</span>
              </div>
              <CustomSelect 
                value={localSettings.fontFamily} 
                onChange={(v) => update('fontFamily', v)}
                options={[
                  { value: 'jetbrains', label: 'JetBrains Mono' },
                  { value: 'fira', label: 'Fira Code' },
                  { value: 'consolas', label: 'Consolas' },
                  { value: 'ubuntu', label: 'Ubuntu Mono' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Hauteur de ligne</label>
                <span className="setting-desc">Espacement vertical entre les lignes de code.</span>
              </div>
              <CustomSelect 
                value={String(localSettings.lineHeight)} 
                onChange={(v) => update('lineHeight', v)}
                options={[
                  { value: '1.2', label: 'Compact (1.2)' },
                  { value: '1.5', label: 'Standard (1.5)' },
                  { value: '1.8', label: 'Aéré (1.8)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Ligatures de police</label>
                <span className="setting-desc">Active les symboles combinés (ex: &lt;- devient une flèche).</span>
              </div>
              <ToggleSwitch checked={localSettings.fontLigatures} onChange={(v) => update('fontLigatures', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Zoom global de l'éditeur</label>
                <span className="setting-desc">Ajuste l'échelle d'affichage globale.</span>
              </div>
              <RangeSlider value={localSettings.editorZoom} min={80} max={150} step={10} unit="%" onChange={(v) => update('editorZoom', v)} />
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Comportement d'Édition</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Taille d'indentation</label>
                <span className="setting-desc">Nombre d'espaces générés par la touche Tab.</span>
              </div>
              <CustomSelect 
                value={String(localSettings.tabSize)} 
                onChange={(v) => update('tabSize', v)}
                options={[
                  { value: '2', label: '2 espaces' },
                  { value: '4', label: '4 espaces (Défaut)' },
                  { value: '8', label: '8 espaces' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Retour à la ligne automatique (Word Wrap)</label>
                <span className="setting-desc">Renvoie le texte long à la ligne au lieu de créer un défilement horizontal.</span>
              </div>
              <ToggleSwitch checked={localSettings.wordWrap} onChange={(v) => update('wordWrap', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Numéros de ligne</label>
                <span className="setting-desc">Affiche les numéros dans la marge gauche.</span>
              </div>
              <ToggleSwitch checked={localSettings.lineNumbers} onChange={(v) => update('lineNumbers', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Surligner la ligne active</label>
                <span className="setting-desc">Met en valeur la ligne où se trouve le curseur.</span>
              </div>
              <ToggleSwitch checked={localSettings.highlightActiveLine} onChange={(v) => update('highlightActiveLine', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Guides d'indentation</label>
                <span className="setting-desc">Affiche des lignes verticales pour suivre les blocs lexicaux.</span>
              </div>
              <ToggleSwitch checked={localSettings.renderIndentGuides} onChange={(v) => update('renderIndentGuides', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Fermeture automatique () []</label>
                <span className="setting-desc">Ajoute automatiquement le caractère fermant pour les parenthèses et crochets.</span>
              </div>
              <ToggleSwitch checked={localSettings.autoClosingBrackets} onChange={(v) => update('autoClosingBrackets', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Fermeture automatique ""</label>
                <span className="setting-desc">Ajoute automatiquement les guillemets fermants.</span>
              </div>
              <ToggleSwitch checked={localSettings.autoClosingQuotes} onChange={(v) => update('autoClosingQuotes', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Convertir Tab en espaces</label>
                <span className="setting-desc">Remplace les tabulations insérées par des espaces discrets.</span>
              </div>
              <ToggleSwitch checked={localSettings.insertSpaces} onChange={(v) => update('insertSpaces', v)} />
            </div>
          </div>
        );

      case 'formatting':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Formatage de Code</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Formater à l'enregistrement</label>
                <span className="setting-desc">Applique le formateur (auto-indent, majuscules) lors d'un Ctrl+S.</span>
              </div>
              <ToggleSwitch checked={localSettings.formatOnSave} onChange={(v) => update('formatOnSave', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Formater avant exécution</label>
                <span className="setting-desc">Garantit que le code soumis à l'interpréteur est propre visuellement.</span>
              </div>
              <ToggleSwitch checked={localSettings.formatOnRun} onChange={(v) => update('formatOnRun', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Normalisation des opérateurs</label>
                <span className="setting-desc">Ajoute ou retire intelligemment les espaces autour des opérateurs (&lt;-, +, =).</span>
              </div>
              <ToggleSwitch checked={localSettings.autoSpaceNormalization} onChange={(v) => update('autoSpaceNormalization', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Gestion automatique de l'indentation</label>
                <span className="setting-desc">Le formateur gère l'indentation de bout en bout (ignore l'indentation actuelle).</span>
              </div>
              <ToggleSwitch checked={localSettings.manageIndentation} onChange={(v) => update('manageIndentation', v)} />
            </div>
          </div>
        );

      case 'pedagogy':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Outils Pédagogiques</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Visualiser les Tableaux 1D</label>
                <span className="setting-desc">Affiche une barre animée de valeurs pour chaque tableau simple.</span>
              </div>
              <ToggleSwitch checked={localSettings.show1DVisualizer} onChange={(v) => update('show1DVisualizer', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Visualiser les Matrices 2D</label>
                <span className="setting-desc">Affiche une grille animée pour représenter la mémoire 2D.</span>
              </div>
              <ToggleSwitch checked={localSettings.show2DVisualizer} onChange={(v) => update('show2DVisualizer', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Inspecteur de variables en direct</label>
                <span className="setting-desc">Voir les valeurs des variables simples (ENTIER, CHAINE...) en temps réel pendant le code.</span>
              </div>
              <ToggleSwitch checked={localSettings.liveVariableVisualizer} onChange={(v) => update('liveVariableVisualizer', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Mode pas-à-pas (Debug manuel)</label>
                <span className="setting-desc">Met le programme en pause à chaque instruction.</span>
              </div>
              <ToggleSwitch checked={localSettings.stepByStepExecution} onChange={(v) => update('stepByStepExecution', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Surligner la ligne en cours d'exécution</label>
                <span className="setting-desc">Relie l'exécution virtuelle à la UI de l'éditeur textuel.</span>
              </div>
              <ToggleSwitch checked={localSettings.highlightRunningLine} onChange={(v) => update('highlightRunningLine', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Mode Débutant strict</label>
                <span className="setting-desc">Force des règles additionnelles bienveillantes (déclarations requises en haut).</span>
              </div>
              <ToggleSwitch checked={localSettings.beginnerMode} onChange={(v) => update('beginnerMode', v)} />
            </div>
          </div>
        );

      case 'diagnostics':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Erreurs et Diagnostics</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Niveau de détail des erreurs</label>
                <span className="setting-desc">Impact le style et la longueur des conseils d'erreurs d'exécution.</span>
              </div>
              <CustomSelect 
                value={localSettings.errorDetailLevel} 
                onChange={(v) => update('errorDetailLevel', v)}
                options={[
                  { value: 'simple', label: 'Simple (Uniquement le nom de l\'erreur)' },
                  { value: 'normal', label: 'Normal (Détails et Astuce)' },
                  { value: 'detailed', label: 'Détail Complet (Mémoire interne etc)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Saut automatique à la première erreur</label>
                <span className="setting-desc">Ouvre et sélectionne automatiquement la ligne crashant dans le code.</span>
              </div>
              <ToggleSwitch checked={localSettings.autoGotoFirstError} onChange={(v) => update('autoGotoFirstError', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Grouper les erreurs Similaires</label>
                <span className="setting-desc">Factorise les alertes de syntaxe répétées (ex: 5 points-virgules manquants).</span>
              </div>
              <ToggleSwitch checked={localSettings.groupSimilarErrors} onChange={(v) => update('groupSimilarErrors', v)} />
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Terminal Interactif</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Thème du terminal</label>
                <span className="setting-desc">Moteur de rendu couleur du texte.</span>
              </div>
              <CustomSelect 
                value={localSettings.terminalTheme} 
                onChange={(v) => update('terminalTheme', v)}
                options={[
                  { value: 'hacker', label: 'Hacker (Vert néon)' },
                  { value: 'ocean', label: 'Océan (Bleu clair)' },
                  { value: 'ubuntu', label: 'Ubuntu (Violet/Blanc)' },
                  { value: 'minimal', label: 'Minimaliste (Blanc & Gris)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Taille de police du terminal</label>
                <span className="setting-desc">Ajuste la lisibilité des prompts.</span>
              </div>
              <CustomSelect 
                value={String(localSettings.terminalFontSize)} 
                onChange={(v) => update('terminalFontSize', v)}
                options={[
                  { value: '13', label: '13px (Petit)' },
                  { value: '14', label: '14px (Défaut)' },
                  { value: '16', label: '16px (Grand)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Afficher le nom de la variable (LIRE)</label>
                <span className="setting-desc">Affiche "variable : valeur" au lieu de seulement "valeur" (Mode pédagogique).</span>
              </div>
              <ToggleSwitch checked={localSettings.showFieldNames} onChange={(v) => update('showFieldNames', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Vider le terminal au lancement</label>
                <span className="setting-desc">Prévient la saturation en nettoyant l'écran à chaque execution.</span>
              </div>
              <ToggleSwitch checked={localSettings.clearTerminalOnRun} onChange={(v) => update('clearTerminalOnRun', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Vitesse d'affichage streamée</label>
                <span className="setting-desc">Effet "machine à écrire" dans les impressions terminal.</span>
              </div>
              <CustomSelect 
                value={localSettings.terminalSpeed} 
                onChange={(v) => update('terminalSpeed', v)}
                options={[
                  { value: 'instant', label: 'Instantané' },
                  { value: 'normal', label: 'Lisible (Standard)' },
                  { value: 'slow', label: 'Lente (Cinématique)' }
                ]} 
              />
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Apparence de l'Application</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Thème global</label>
                <span className="setting-desc">Thème de base entourant l'éditeur et l'interface cible.</span>
              </div>
              <CustomSelect 
                value={localSettings.globalTheme} 
                onChange={(v) => update('globalTheme', v)}
                options={[
                  { value: 'dark', label: 'Mode Sombre Automatique' },
                  { value: 'light', label: 'Mode Clair' },
                  { value: 'auto', label: 'Calqué sur le système (OS)' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Couleur du site (Accent)</label>
                <span className="setting-desc">Couleur générale pour les boutons et surlignages d'onglets.</span>
              </div>
              <CustomSelect 
                value={localSettings.accentColor} 
                onChange={(v) => update('accentColor', v)}
                options={[
                  { value: 'blue', label: 'Bleu Développeur' },
                  { value: 'green', label: 'Émeraude / Vert' },
                  { value: 'purple', label: 'Violet BQL' },
                  { value: 'red', label: 'Rouge / Ambre' }
                ]} 
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Animations d'interface</label>
                <span className="setting-desc">Transitions, apparitions modulaires et micro-effets contextuels.</span>
              </div>
              <ToggleSwitch checked={localSettings.enableAnimations} onChange={(v) => update('enableAnimations', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Densité d'interface</label>
                <span className="setting-desc">Gère les marges entres les blocs pour exploiter de gros écrans ou du mobile.</span>
              </div>
              <CustomSelect 
                value={localSettings.interfaceDensity} 
                onChange={(v) => update('interfaceDensity', v)}
                options={[
                  { value: 'compact', label: 'Compacte (Moins de marges)' },
                  { value: 'comfortable', label: 'Confortable (Bordures aérés)' }
                ]} 
              />
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="settings-panel">
            <h3 className="panel-title">Hôte et Projet Locaux</h3>

            <div className="setting-row">
              <div className="setting-info">
                <label>Sauvegarde automatique</label>
                <span className="setting-desc">Garde en cache le fichier chaque fois que vous tapez du code.</span>
              </div>
              <ToggleSwitch checked={localSettings.autoSave} onChange={(v) => update('autoSave', v)} />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label>Restaurer la dernière session locale</label>
                <span className="setting-desc">Au redémarrage, replace les codes laissés non sauvegardés en mémoire cache.</span>
              </div>
              <ToggleSwitch checked={localSettings.restoreLastSession} onChange={(v) => update('restoreLastSession', v)} />
            </div>

             <div className="setting-row">
              <div className="setting-info">
                <label>Confirmation avant réinitilisation complète</label>
                <span className="setting-desc">Prévient les effacements non voulus du code au clic sur 'Fichier &gt; Nouveau'.</span>
              </div>
              <ToggleSwitch checked={localSettings.confirmBeforeReset} onChange={(v) => update('confirmBeforeReset', v)} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-backdrop settings-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        
        {!isMobile && (
          <div className="settings-sidebar">
            <div className="settings-sidebar-header">
              <h3>Paramètres</h3>
            </div>
            <div className="settings-sidebar-nav">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id}
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} className="tab-icon" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`settings-content-wrapper ${isMobile ? 'mobile-wrapper' : ''}`}>
          <div className="settings-content-header">
            {isMobile ? (
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Paramètres</h3>
            ) : (
              <div className="settings-breadcrumb">
                Paramètres <span>/</span> {TABS.find(t => t.id === activeTab)?.label}
              </div>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className={`settings-content-body ${isMobile ? 'mobile-accordion' : ''}`}>
            {isMobile ? (
              TABS.map(tab => {
                const Icon = tab.icon;
                const isOpen = activeTab === tab.id;
                return (
                  <div key={tab.id} className="accordion-item">
                    <div 
                      className={`accordion-trigger ${isOpen ? 'open' : ''}`} 
                      onClick={() => setActiveTab(isOpen ? null : tab.id)}
                    >
                      <div className="accordion-trigger-left">
                        <Icon size={18} className="tab-icon" />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronDown size={16} className={`accordion-chevron ${isOpen ? 'rotated' : ''}`} />
                    </div>
                    {isOpen && (
                      <div className="accordion-content">
                        {renderTabContent(tab.id)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              renderTabContent()
            )}
          </div>

          <div className="settings-content-footer">
            <button className="settings-btn-reset" onClick={handleReset}>
              <RotateCcw size={14} /> Restaurer les défauts
            </button>
            <div className="settings-footer-actions">
              <button className="settings-btn-cancel" onClick={onClose}>Annuler</button>
              <button className="settings-btn-save" onClick={handleSave}>
                <Check size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
