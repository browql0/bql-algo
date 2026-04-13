import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, BookOpen, Users, Code, AlertTriangle, Scale, Bell } from 'lucide-react';
import './Legal.css';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Conditions d'utilisation – BQL Algo";
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-back-link">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="legal-badge">
            <Scale size={14} /> Conditions d'utilisation
          </div>
          <h1>Conditions d'utilisation</h1>
          <p className="legal-subtitle">
            Ces conditions régissent votre utilisation de la plateforme BQL Algo. En utilisant notre service, vous acceptez ces conditions.
          </p>
          <p className="legal-date">Dernière mise à jour : Avril 2026</p>
        </div>
      </div>

      <div className="legal-container">

        {/* ── Résumé ── */}
        <div className="legal-summary">
          <h2>📋 En résumé</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <BookOpen size={18} />
              <span>BQL Algo est une plateforme éducative gratuite d'apprentissage de l'algorithmique.</span>
            </div>
            <div className="summary-item">
              <Users size={18} />
              <span>Vous devez être âgé d'au moins 13 ans pour créer un compte.</span>
            </div>
            <div className="summary-item">
              <Code size={18} />
              <span>Votre code vous appartient. Notre contenu pédagogique nous appartient.</span>
            </div>
            <div className="summary-item">
              <AlertTriangle size={18} />
              <span>Toute utilisation abusive peut entraîner la suspension de votre compte.</span>
            </div>
          </div>
        </div>

        {/* ── Article 1 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">01</span>
            <h2>Présentation du service</h2>
          </div>
          <p>
            BQL Algo (ci-après « la Plateforme » ou « le Service ») est une plateforme d'apprentissage interactive dédiée à l'algorithmique. Elle permet aux utilisateurs d'apprendre les concepts fondamentaux de la programmation et de l'algorithmique à travers un langage pédagogique personnalisé (BQL), un éditeur de code en ligne, des cours structurés et des exercices progressifs.
          </p>
          <p>
            BQL Algo est conçu à des fins exclusivement éducatives. Nous nous engageons à fournir un environnement d'apprentissage inclusif, sécurisé et stimulant pour les apprenants de tous niveaux.
          </p>
          <p>
            En accédant à la Plateforme, vous acceptez d'être lié par les présentes Conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.
          </p>
        </section>

        {/* ── Article 2 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">02</span>
            <h2>Accès au service</h2>
          </div>

          <h3>2.1 Création de compte</h3>
          <p>
            L'accès à certaines fonctionnalités de la Plateforme (éditeur de code, suivi de progression, cours) nécessite la création d'un compte utilisateur. Lors de l'inscription, vous vous engagez à fournir des informations exactes, complètes et à jour.
          </p>
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités effectuées sous votre compte. En cas d'utilisation non autorisée, vous devez nous en informer immédiatement à l'adresse <a href="mailto:contact@bqlalgo.com" className="legal-link">contact@bqlalgo.com</a>.
          </p>

          <h3>2.2 Âge minimum</h3>
          <p>
            L'utilisation du Service est ouverte à toute personne âgée d'au moins <strong>13 ans</strong>. Si vous avez moins de 18 ans, vous déclarez avoir obtenu le consentement de votre parent ou tuteur légal pour utiliser la Plateforme.
          </p>

          <h3>2.3 Un compte par utilisateur</h3>
          <p>
            Chaque utilisateur ne peut détenir qu'un seul compte actif. La création de comptes multiples dans le but de contourner des restrictions ou d'exploiter le système de progression est strictement interdite.
          </p>
        </section>

        {/* ── Article 3 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">03</span>
            <h2>Utilisation du service</h2>
          </div>

          <h3>3.1 Utilisation acceptable</h3>
          <p>Vous vous engagez à utiliser la Plateforme uniquement à des fins légales, éducatives et personnelles. En particulier, vous vous engagez à :</p>
          <ul className="legal-list">
            <li>Respecter les autres utilisateurs et les membres de l'équipe BQL Algo.</li>
            <li>Ne pas diffuser de contenu offensant, illégal, ou contraire à la bonne morale.</li>
            <li>Ne pas tenter de perturber, d'attaquer ou de compromettre l'infrastructure technique de la Plateforme.</li>
            <li>Ne pas utiliser de robots, scripts ou systèmes automatisés pour interagir avec le Service sans autorisation préalable.</li>
          </ul>

          <h3>3.2 Interdiction de triche et d'exploitation</h3>
          <p>
            BQL Algo est une plateforme pédagogique dont l'objectif est de favoriser l'apprentissage réel. À ce titre, sont strictement interdites :
          </p>
          <ul className="legal-list">
            <li>La manipulation du système d'XP ou de niveaux par des moyens artificiels.</li>
            <li>La partage de solutions d'exercices encore non résolus avec l'intention de nuire à la progression des autres.</li>
            <li>L'exploitation de failles techniques pour acquérir des avantages injustes.</li>
            <li>L'utilisation de la plateforme pour distribuer des logiciels malveillants ou du code nuisible.</li>
          </ul>

          <h3>3.3 Contenu généré par l'utilisateur</h3>
          <p>
            Tout code ou contenu que vous soumettez sur la Plateforme ne doit pas enfreindre les droits de tiers, contenir de données personnelles sensibles appartenant à autrui, ou viser à compromettre la sécurité du Service.
          </p>
        </section>

        {/* ── Article 4 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">04</span>
            <h2>Propriété intellectuelle</h2>
          </div>

          <h3>4.1 Contenu de la plateforme</h3>
          <p>
            L'ensemble du contenu pédagogique disponible sur BQL Algo — incluant les cours, les exercices, les défis, le langage BQL, le design de l'interface et le code source de la Plateforme — est la propriété exclusive de BQL Algo et est protégé par les lois relatives à la propriété intellectuelle et au droit d'auteur.
          </p>
          <p>
            Toute reproduction, distribution, modification ou utilisation commerciale de ce contenu sans autorisation écrite préalable de BQL Algo est strictement interdite.
          </p>

          <h3>4.2 Votre contenu</h3>
          <p>
            Le code que vous écrivez dans l'éditeur BQL Algo vous appartient pleinement. En le soumettant à la Plateforme pour évaluation ou stockage, vous accordez à BQL Algo une licence limitée, non exclusive et non transférable, uniquement dans le but de faire fonctionner le Service (exécution, sauvegarde, analyse pédagogique anonymisée).
          </p>
          <p>
            BQL Algo ne revendique aucun droit de propriété sur vos créations personnelles.
          </p>
        </section>

        {/* ── Article 5 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">05</span>
            <h2>Limitation de responsabilité</h2>
          </div>
          <p>
            BQL Algo est fourni « en l'état » et « tel que disponible », sans garantie d'aucune sorte, expresse ou implicite. Nous ne garantissons pas que le Service sera disponible en permanence, sans interruption, ni exempt d'erreurs ou de bugs.
          </p>
          <p>
            Dans les limites permises par la loi applicable, BQL Algo ne saurait être tenu responsable de :
          </p>
          <ul className="legal-list">
            <li>Toute perte de données résultant d'une défaillance technique.</li>
            <li>L'exactitude ou la complétude du contenu pédagogique.</li>
            <li>Les dommages directs ou indirects résultant de l'utilisation ou de l'incapacité à utiliser le Service.</li>
            <li>Les interruptions de service dues à des événements hors de notre contrôle (force majeure, pannes d'infrastructure tiers, etc.).</li>
          </ul>
          <p>
            Nous nous efforçons constamment d'améliorer la qualité et la disponibilité du Service, mais nous vous encourageons à ne pas dépendre exclusivement de BQL Algo pour des besoins critiques.
          </p>
        </section>

        {/* ── Article 6 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">06</span>
            <h2>Suspension et suppression de compte</h2>
          </div>
          <p>
            BQL Algo se réserve le droit de suspendre ou de résilier votre accès au Service, à tout moment et sans préavis, en cas de :
          </p>
          <ul className="legal-list">
            <li>Violation des présentes Conditions d'utilisation.</li>
            <li>Comportement abusif, malveillant ou frauduleux.</li>
            <li>Tentative de compromission de la sécurité ou de l'intégrité de la Plateforme.</li>
            <li>Demande formulée par les autorités compétentes.</li>
          </ul>
          <p>
            En cas de suspension jugée injustifiée, vous pouvez nous contacter à <a href="mailto:contact@bqlalgo.com" className="legal-link">contact@bqlalgo.com</a> pour demander un réexamen de la situation.
          </p>
          <p>
            Vous pouvez demander la suppression de votre compte à tout moment. Vos données seront supprimées conformément à notre Politique de confidentialité.
          </p>
        </section>

        {/* ── Article 7 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">07</span>
            <h2>Modification des conditions</h2>
          </div>
          <p>
            BQL Algo se réserve le droit de modifier les présentes Conditions d'utilisation à tout moment. En cas de modification substantielle, nous vous en informerons via une notification sur la Plateforme ou par email, au moins 30 jours avant leur entrée en vigueur.
          </p>
          <p>
            La poursuite de l'utilisation du Service après la date d'entrée en vigueur des modifications constitue votre acceptation des nouvelles Conditions d'utilisation. Si vous n'acceptez pas les nouvelles conditions, vous devez cesser d'utiliser le Service.
          </p>
        </section>

        {/* ── Article 8 ── */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">08</span>
            <h2>Loi applicable et résolution des litiges</h2>
          </div>
          <p>
            Les présentes Conditions d'utilisation sont régies par les principes généraux du droit applicable aux services en ligne éducatifs internationaux. En cas de litige découlant de l'utilisation du Service, les parties s'engagent à rechercher en premier lieu une résolution amiable.
          </p>
          <p>
            Pour tout désaccord, veuillez nous contacter à <a href="mailto:contact@bqlalgo.com" className="legal-link">contact@bqlalgo.com</a> afin que nous puissions trouver une solution satisfaisante pour les deux parties.
          </p>
        </section>

        {/* ── Contact ── */}
        <div className="legal-contact-card">
          <h3>Des questions ?</h3>
          <p>Si vous avez des questions concernant ces Conditions d'utilisation, n'hésitez pas à nous contacter.</p>
          <a href="mailto:contact@bqlalgo.com" className="legal-contact-btn">
            Contacter BQL Algo
          </a>
        </div>

        <div className="legal-footer-nav">
          <Link to="/privacy" className="legal-footer-link">
            <Shield size={14} /> Politique de confidentialité
          </Link>
          <Link to="/" className="legal-footer-link">
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
};

export default TermsOfService;
