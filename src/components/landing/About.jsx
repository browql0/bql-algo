import React from 'react';
import { BookOpen, Terminal, Zap } from 'lucide-react';
import './About.css';

const About = () => {
  const features = [
    {
      icon: <Terminal size={28} className="feature-icon text-blue" />,
      title: 'Éditeur Intelligent',
      description: 'Un éditeur de code complet avec coloration syntaxique spécifique au BQL, auto-complétion et détection d\'erreurs en temps réel.',
      className: 'feature-card blue-gradient'
    },
    {
      icon: <Zap size={28} className="feature-icon text-purple" />,
      title: 'Exécution Instantanée',
      description: 'Pas besoin de configurer un environnement local complexe. Exécutez votre algorithme et visualisez les résultats instantanément dans votre navigateur.',
      className: 'feature-card purple-gradient'
    },
    {
      icon: <BookOpen size={28} className="feature-icon text-emerald" />,
      title: 'Apprentissage Guidé',
      description: 'Parcourez une large bibliothèque d\'exercices progressifs. Idéal pour débuter l\'algorithmique ou préparer des examens d\'informatique.',
      className: 'feature-card emerald-gradient'
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="landing-container">
        <div className="section-header text-center">
          <h2 className="section-title">Pourquoi choisir <span className="text-gradient">BQL Algo</span> ?</h2>
          <p className="section-subtitle">
            Nous avons simplifié l'apprentissage de l'algorithmique. Concentrez-vous sur la logique, nous nous occupons du reste.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={feature.className}>
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
