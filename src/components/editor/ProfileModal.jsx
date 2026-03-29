import React, { useState } from 'react';
import { X, User, Mail, Camera, Shield, Key } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, user, displayName, displayEmail, userInitials }) => {
  const [name, setName] = useState(displayName);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content profile-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profil Utilisateur</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body profile-body">
          <div className="profile-hero">
            <div className="profile-avatar-large">
              {userInitials}
              <button className="avatar-edit-btn" title="Modifier la photo">
                <Camera size={14} />
              </button>
            </div>
            <div className="profile-hero-info">
              <h2>{displayName}</h2>
              <p className="badge-role">Membre BQL</p>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="section-title"><User size={16} /> Informations Personnelles</h4>
            
            <div className="form-group">
              <label>Nom complet</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="profile-input" 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Adresse Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  value={displayEmail} 
                  disabled 
                  className="profile-input disabled" 
                />
              </div>
              <span className="input-help">L'email ne peut pas être modifié pour le moment.</span>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="section-title"><Shield size={16} /> Sécurité</h4>
            <div className="setting-item">
              <label>Mot de passe</label>
              <button className="btn-secondary small"><Key size={14} style={{ marginRight: '6px' }}/> Modifier</button>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={onClose}>Sauvegarder les modifications</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
