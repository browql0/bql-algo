import React from 'react';
import { TerminalSquare, FolderTree, MoonStar, Keyboard, GraduationCap, Save } from 'lucide-react';
import './Features.css';

const Features = () => {
  const featureList = [
    {
      icon: <TerminalSquare size={22} className="feat-icon" />,
      title: 'Console Interactive',
      description: 'Une véritable expérience CLI intégrée. Visualisez vos sorties, gérez les erreurs et déboguez votre logique en temps réel lors de l\'exécution.'
    },
    {
      icon: <FolderTree size={22} className="feat-icon" />,
      title: 'Gestion de Fichiers Virtuelle',
      description: 'Organisez vos algorithmes comme dans un vrai projet. Créez des dossiers, modulez vos fonctions et structurez vos révisions proprement.'
    },
    {
      icon: <MoonStar size={22} className="feat-icon" />,
      title: 'Mode Sombre Natif',
      description: 'Conçu avec une approche « Dark Mode First ». Reposez vos yeux lors de vos longues sessions de codage tardives grâce à un contraste optimisé.'
    },
    {
      icon: <Keyboard size={22} className="feat-icon" />,
      title: 'Raccourcis Productivité',
      description: 'Naviguez, exécutez et formatez sans quitter votre clavier. La plateforme respecte les standards des IDE modernes (VS Code, IntelliJ).'
    },
    {
      icon: <GraduationCap size={22} className="feat-icon" />,
      title: 'Simulation d\'Examens',
      description: 'Un mode sans distraction respectant les limitations des sujets de concours. Parfait pour se conditionner à la vraie rigueur algorithmique.'
    },
    {
      icon: <Save size={22} className="feat-icon" />,
      title: 'Sauvegarde Cloud Auto',
      description: 'Votre progression est enregistrée à chaque touche. Changez d\'appareil et reprenez exactement où vous vous étiez arrêté sans tracas.'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="landing-container">
        <div className="features-header text-center">
          <span className="features-badge">Fonctionnalités Clés</span>
          <h2 className="features-title">Un environnement complet pour exceller</h2>
          <p className="features-subtitle">
            Tout ce dont vous avez besoin pour coder, tester et progresser, sans aucune installation.
          </p>
        </div>

        <div className="features-card-grid">
          {featureList.map((feat, idx) => (
            <div key={idx} className="feat-card">
              <div className="feat-icon-box">
                {feat.icon}
              </div>
              <h3 className="feat-title">{feat.title}</h3>
              <p className="feat-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
