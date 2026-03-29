import React, { useState } from 'react';
import { X, CreditCard, Zap, CheckCircle2, Star, Download, Clock, Receipt, Check } from 'lucide-react';
import './BillingModal.css';

const BillingModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('offres'); // 'offres' | 'history'

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content billing-modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="billing-glow"></div>

        <div className="modal-header pricing-header">
          <div>
            <h3>Facturation & Abonnements</h3>
            <p className="modal-subtitle">Gérez votre formule, vos factures et vos paiements de manière simple et sécurisée.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="billing-tabs-nav-container">
          <div className="billing-tabs-nav">
            <button className={`billing-tab-btn ${activeTab === 'offres' ? 'active' : ''}`} onClick={() => setActiveTab('offres')}>
              <Star size={16}/> Offres
            </button>
            <button className={`billing-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <Receipt size={16}/> Historique
            </button>
          </div>
        </div>
        
        <div className="modal-body billing-body">
          
          {activeTab === 'offres' ? (
            <div className="pricing-grid">
              
              {/* PLAN GRATUIT */}
              <div className="pricing-card standard">
                <div className="plan-header">
                  <span className="plan-label">Plan de base</span>
                  <h4>BQL Gratuit</h4>
                  <div className="price">0€<span>/mois</span></div>
                  <p className="plan-desc">Pour bien débuter l'apprentissage de l'algorithmique sans limite de temps.</p>
                </div>
                
                <ul className="plan-features">
                  <li><Check size={16} className="feature-icon standard" /> <span>Accès aux Défis Fondamentaux</span></li>
                  <li><Check size={16} className="feature-icon standard" /> <span>Éditeur de code Basique</span></li>
                  <li><Check size={16} className="feature-icon standard" /> <span>Exécution mutualisée (1s de délai)</span></li>
                  <li className="dimmed"><Check size={16} className="feature-icon standard" /> <span>Outils pro, AI & Analytics</span></li>
                </ul>

                <button className="btn-plan current">Plan actuel</button>
              </div>

              {/* PLAN PRO */}
              <div className="pricing-card premium">
                <div className="premium-glow-inner"></div>
                
                <div className="plan-header">
                  <div className="pro-badge"><Star size={12}/> RECOMMANDÉ</div>
                  <span className="plan-label pro-label">Plan Avancé</span>
                  <h4>BQL Pro</h4>
                  <div className="price">9€<span>/mois</span></div>
                  <p className="plan-desc">Débloquez 100% de la plateforme, pour devenir un expert compétitif.</p>
                </div>

                <ul className="plan-features">
                  <li><CheckCircle2 size={16} className="feature-icon pro" /> <span><strong>Toutes les Masterclasses</strong> Algorithmiques</span></li>
                  <li><CheckCircle2 size={16} className="feature-icon pro" /> <span>Accès prioritaire Serveur Cloud <strong>(0 délai d'exécution)</strong></span></li>
                  <li><CheckCircle2 size={16} className="feature-icon pro" /> <span>Assistance et debogage <strong>IA Illimité</strong></span></li>
                  <li><CheckCircle2 size={16} className="feature-icon pro" /> <span>Mode multijoueur (Live Share Collaboration)</span></li>
                  <li><CheckCircle2 size={16} className="feature-icon pro" /> <span>Certifications BQL Vérifiées</span></li>
                </ul>

                <button className="btn-plan upgrade">
                  <Zap size={16} fill="currentColor" /> Mettre à niveau maintenant
                </button>
                <p className="plan-disclaimer">Annulable à tout moment. Paiement sécurisé via Stripe.</p>
              </div>

            </div>
          ) : (
            <div className="billing-history-container">
              
              <div className="payment-method-card">
                <div className="pm-info">
                  <CreditCard size={24} className="pm-icon" />
                  <div>
                    <h5>Carte se terminant par •••• 4242</h5>
                    <p>Expire le 12/28</p>
                  </div>
                </div>
                <button className="btn-secondary small">Mettre à jour</button>
              </div>

              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Reçu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>12 Mars 2026</td>
                      <td>BQL Pro - 1 Mois</td>
                      <td className="amount">9,00 €</td>
                      <td><span className="status-badge paid">Payé</span></td>
                      <td><button className="download-invoice-btn" title="Télécharger PDF"><Download size={16}/></button></td>
                    </tr>
                    <tr>
                      <td>12 Fév. 2026</td>
                      <td>BQL Pro - 1 Mois</td>
                      <td className="amount">9,00 €</td>
                      <td><span className="status-badge paid">Payé</span></td>
                      <td><button className="download-invoice-btn" title="Télécharger PDF"><Download size={16}/></button></td>
                    </tr>
                    <tr>
                      <td>12 Jan. 2026</td>
                      <td>BQL Pro - 1 Mois</td>
                      <td className="amount">9,00 €</td>
                      <td><span className="status-badge paid">Payé</span></td>
                      <td><button className="download-invoice-btn" title="Télécharger PDF"><Download size={16}/></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="history-footer">
                <Clock size={16} className="clock-icon" /> Prochain paiement estimé au 12 Avril 2026
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BillingModal;
