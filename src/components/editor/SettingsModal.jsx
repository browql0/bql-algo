import React, { useState, useRef, useEffect } from 'react';
import { X, Type, AlignLeft, Layout, Terminal, ChevronDown } from 'lucide-react';
import './SettingsModal.css';

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

const SettingsModal = ({ isOpen, onClose, settings, setSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Paramètres de l'éditeur</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          {/* Typographie */}
          <div className="settings-section">
            <h4 className="section-title"><Type size={16} /> Typographie</h4>
            <div className="setting-item">
              <label>Taille de police</label>
              <CustomSelect 
                value={settings.fontSize} 
                onChange={(val) => setSettings({ ...settings, fontSize: val })}
                options={[
                  { value: '12', label: '12px' },
                  { value: '14', label: '14px (Défaut)' },
                  { value: '16', label: '16px' },
                  { value: '18', label: '18px' }
                ]} 
              />
            </div>
            <div className="setting-item">
              <label>Famille de police</label>
              <CustomSelect 
                value={settings.fontFamily} 
                onChange={(val) => setSettings({ ...settings, fontFamily: val })}
                options={[
                  { value: 'jetbrains', label: 'JetBrains Mono' },
                  { value: 'fira', label: 'Fira Code' },
                  { value: 'consolas', label: 'Consolas' }
                ]} 
              />
            </div>
          </div>

          {/* Éditeur */}
          <div className="settings-section">
            <h4 className="section-title"><AlignLeft size={16} /> Édition</h4>
            <div className="setting-item">
              <label>Taille d'indentation</label>
              <CustomSelect 
                value={settings.tabSize} 
                onChange={(val) => setSettings({ ...settings, tabSize: val })}
                options={[
                  { value: '2', label: '2 espaces' },
                  { value: '4', label: '4 espaces' },
                  { value: 'tab', label: 'Tabulation' }
                ]} 
              />
            </div>
            <div className="setting-item">
              <label>Retour à la ligne automatique</label>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={settings.wordWrap} 
                  onChange={(e) => setSettings({ ...settings, wordWrap: e.target.checked })} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Environnement */}
          <div className="settings-section">
            <h4 className="section-title"><Terminal size={16} /> Environnement BQL</h4>
            <div className="setting-item">
              <label>Thème du terminal</label>
              <CustomSelect 
                value={settings.theme} 
                onChange={(val) => setSettings({ ...settings, theme: val })}
                options={[
                  { value: 'hacker', label: 'Hacker (Vert)' },
                  { value: 'ocean', label: 'Océan (Bleu)' }
                ]} 
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={onClose}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
