import React, { useState } from 'react';
import { Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import './Contact.css';

const contactInfo = [
  {
    icon: <Mail size={20} />,
    label: 'Email',
    value: 'bqlalgo@hotmail.com',
    href: 'mailto:bqlalgo@hotmail.com',
  },
  {
    icon: <MapPin size={20} />,
    label: 'Siège',
    value: 'Tanger, Maroc',
    href: null,
  },
  {
    icon: <Clock size={20} />,
    label: 'Réponse',
    value: 'Sous 24h ouvrées',
    href: null,
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      return;
    }
    // Simulate send
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="contact-section">
      <div className="landing-container">

        {/* Section header */}
        <div className="contact-header">
          <span className="contact-badge">Contact</span>
          <h2 className="contact-heading">
            Une question ? <span className="text-gradient">Parlons-en.</span>
          </h2>
          <p className="contact-intro">
            Notre équipe répond dans les 24&nbsp;h. Remplissez le formulaire ou écrivez-nous directement.
          </p>
        </div>

        {/* Main card */}
        <div className="contact-card">

          {/* Left — info panel */}
          <div className="contact-info-pane">
            <div className="info-pane-inner">
              <p className="info-tagline">
                Que vous ayez besoin d'aide, d'un retour, ou juste envie de dire bonjour — nous sommes là.
              </p>

              <ul className="contact-detail-list">
                {contactInfo.map((item, i) => (
                  <li key={i} className="contact-detail-item">
                    <div className="detail-icon-wrap">{item.icon}</div>
                    <div className="detail-text">
                      <span className="detail-label">{item.label}</span>
                      {item.href
                        ? <a href={item.href} className="detail-value link">{item.value}</a>
                        : <span className="detail-value">{item.value}</span>
                      }
                    </div>
                  </li>
                ))}
              </ul>

              {/* Trust badges */}
              <div className="trust-badges">
                <div className="trust-badge">
                  <span className="trust-dot green"></span>
                  Disponible en ligne
                </div>
                <div className="trust-badge">
                  <span className="trust-dot blue"></span>
                  Beta gratuite
                </div>
              </div>
            </div>

            {/* Decorative blur blobs */}
            <div className="info-blob blob-1"></div>
            <div className="info-blob blob-2"></div>
          </div>

          {/* Right — form panel */}
          <div className="contact-form-pane">
            {status === 'success' ? (
              <div className="form-success">
                <CheckCircle2 size={48} className="success-icon" />
                <h3>Message envoyé !</h3>
                <p>Merci pour votre message. Nous vous répondrons dans les prochaines 24&nbsp;h.</p>
                <button className="btn-secondary reset-btn" onClick={() => setStatus(null)}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <h3 className="form-title">Envoyez-nous un message</h3>

                {status === 'error' && (
                  <div className="form-error-banner">
                    <AlertCircle size={16} />
                    Veuillez remplir tous les champs obligatoires.
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nom complet <span className="req">*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Adresse email <span className="req">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Sujet</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Comment pouvons-nous vous aider ?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message <span className="req">*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Décrivez votre besoin ou question..."
                  />
                </div>

                <button type="submit" className="contact-submit-btn">
                  <Send size={17} />
                  Envoyer le message
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
