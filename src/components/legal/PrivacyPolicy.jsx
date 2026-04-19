import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Database, Lock, Eye, Trash2, Mail, Globe, Scale } from 'lucide-react';
import './Legal.css';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Politique de confidentialité ? BQL Algo";
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-header privacy-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-back-link">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="legal-badge privacy-badge">
            <Shield size={14} /> Politique de confidentialité
          </div>
          <h1>Politique de confidentialité</h1>
          <p className="legal-subtitle">
            Chez BQL Algo, votre vie privée est une priorité. Cette page explique clairement quelles données nous collectons, pourquoi, et comment nous les protégeons.
          </p>
          <p className="legal-date">Dernière mise à jour : Avril 2026</p>
        </div>
      </div>

      <div className="legal-container">

        {/* -- Résumé -- */}
        <div className="legal-summary privacy-summary">
          <h2> En résumé</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <Database size={18} />
              <span>Nous collectons uniquement les données nécessaires au bon fonctionnement de la plateforme.</span>
            </div>
            <div className="summary-item">
              <Lock size={18} />
              <span>Vos données sont stockées de manière sécurisée. Nous ne les vendons jamais.</span>
            </div>
            <div className="summary-item">
              <Eye size={18} />
              <span>Vous avez le droit de consulter, modifier ou supprimer vos données à tout moment.</span>
            </div>
            <div className="summary-item">
              <Globe size={18} />
              <span>Les données sont hébergées via Supabase, un service à haute sécurité conforme aux standards internationaux.</span>
            </div>
          </div>
        </div>

        {/* -- Article 1 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">01</span>
            <h2>Données que nous collectons</h2>
          </div>
          <p>
            Afin de fournir et d'améliorer notre Service, BQL Algo collecte les catégories de données suivantes :
          </p>

          <h3>1.1 Données d'identification</h3>
          <ul className="legal-list">
            <li><strong>Adresse email</strong> : utilisée pour la création de compte, l'authentification et les communications importantes.</li>
            <li><strong>Nom d'utilisateur (username)</strong> : votre identifiant public sur la plateforme.</li>
            <li><strong>Nom complet</strong> (optionnel) : si vous le fournissez lors de l'inscription ou dans votre profil.</li>
          </ul>

          <h3>1.2 Données de progression pédagogique</h3>
          <ul className="legal-list">
            <li><strong>Points d'expérience (XP)</strong> et <strong>niveau atteint</strong> sur la plateforme.</li>
            <li><strong>Leçons complétées</strong> et leur statut de progression.</li>
            <li><strong>Résultats des exercices</strong> : réussite, échec, code soumis, durée d'exécution.</li>
            <li><strong>Historique des tentatives</strong> sur les exercices et les défis.</li>
          </ul>

          <h3>1.3 Données d'utilisation</h3>
          <ul className="legal-list">
            <li><strong>Date et heure de dernière activité</strong> sur la plateforme.</li>
            <li><strong>Date d'inscription</strong> au service.</li>
            <li><strong>Statut du compte</strong> (actif ou suspendu).</li>
          </ul>

          <h3>1.4 Données techniques</h3>
          <ul className="legal-list">
            <li>Informations de session générées par Supabase Auth pour maintenir votre connexion.</li>
            <li>Des cookies de session peuvent être utilisés pour maintenir votre état de connexion entre les visites (voir Article 6).</li>
          </ul>

          <div className="legal-highlight">
            <Shield size={16} />
            <p>Nous ne collectons <strong>jamais</strong> de numéros de carte bancaire, de données biométriques, ni d'informations de santé.</p>
          </div>
        </section>

        {/* -- Article 2 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">02</span>
            <h2>Utilisation de vos données</h2>
          </div>
          <p>Les données collectées sont utilisées exclusivement aux fins suivantes :</p>
          <ul className="legal-list">
            <li><strong>Gestion de votre compte</strong> : création, authentification et maintien de votre session.</li>
            <li><strong>Personnalisation de l'expérience</strong> : adaptation du contenu pédagogique à votre niveau et à votre progression.</li>
            <li><strong>Suivi de progression</strong> : calcul et affichage de votre XP, de vos niveaux et de vos trophées.</li>
            <li><strong>Amélioration de la plateforme</strong> : analyse des taux de réussite et des points de blocage pour améliorer le contenu des cours (données agrégées et anonymisées).</li>
            <li><strong>Sécurité et intégrité</strong> : détection et prévention des usages abusifs ou frauduleux.</li>
            <li><strong>Statistiques internes</strong> : suivi du nombre d'utilisateurs actifs et de l'efficacit? globale des cours.</li>
          </ul>
          <p>
            Nous ne vous enverrons pas d'emails marketing sans votre consentement explicite. Les seules communications que vous pourrez recevoir sont liées au bon fonctionnement de votre compte (réinitialisation de mot de passe, modifications importantes des conditions, etc.).
          </p>
        </section>

        {/* -- Article 3 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">03</span>
            <h2>Stockage et hébergement des données</h2>
          </div>
          <p>
            Vos données sont stockées et gérées via <strong>Supabase</strong>, une plateforme de base de données cloud qui offre un haut niveau de sécurité. Supabase utilise PostgreSQL avec le chiffrement des données au repos et en transit (TLS/SSL).
          </p>
          <p>
            Les données peuvent être hébergées sur des serveurs situés dans différentes régions (Europe, États-Unis), dans le respect des règlementations applicables à la protection des données.
          </p>
          <p>
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de votre compte, vos données personnelles seront supprimées dans un délai maximum de <strong>30 jours</strong>, à l'exception des données que nous sommes légalement tenus de conserver plus longtemps.
          </p>
        </section>

        {/* -- Article 4 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">04</span>
            <h2>Sécurité de vos données</h2>
          </div>
          <p>
            La sécurité de vos données est une priorité absolue pour nous. Nous mettons en place les mesures suivantes :
          </p>
          <ul className="legal-list">
            <li><strong>Chiffrement en transit</strong> : toutes les communications entre votre navigateur et nos serveurs utilisent le protocole HTTPS (TLS).</li>
            <li><strong>Chiffrement au repos</strong> : les données stockées sont chiffrées sur les serveurs Supabase.</li>
            <li><strong>Row Level Security (RLS)</strong> : des politiques de sécurité au niveau des lignes de base de données garantissent que chaque utilisateur n'a accès qu'à ses propres données.</li>
            <li><strong>Authentification sécurisée</strong> : les mots de passe sont hachés et jamais stockés en clair.</li>
            <li><strong>Accès limité</strong> : seuls les membres autorisés de l'équipe BQL Algo ont accès aux données, en cas de nécessité opérationnelle stricte.</li>
          </ul>
          <p>
            Malgré nos efforts, aucun système n'est infaillible à 100%. En cas de violation de données susceptible d'affecter vos droits, nous nous engageons à vous en informer dans les meilleurs délais.
          </p>
        </section>

        {/* -- Article 5 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">05</span>
            <h2>Partage des données</h2>
          </div>

          <div className="legal-highlight highlight-success">
            <Lock size={16} />
            <p><strong>BQL Algo ne vend, ne loue et ne partage jamais vos données personnelles à des tiers à des fins commerciales.</strong></p>
          </div>

          <p>Vos données peuvent être partagées uniquement dans les cas suivants :</p>
          <ul className="legal-list">
            <li><strong>Prestataires techniques</strong> : Supabase, en tant qu'infrastructure technique, traite vos données pour assurer le fonctionnement du Service. Ces prestataires sont soumis à des obligations de confidentialité strictes.</li>
            <li><strong>Obligation légale</strong> : si la loi ou une autorité compétente nous l'impose expressément (réquisition judiciaire, etc.).</li>
            <li><strong>Protection de la sécurité</strong> : en cas de menace grave pour la sécurité de la plateforme ou d'autres utilisateurs.</li>
          </ul>
          <p>
            Dans tous les cas de partage, nous veillons à ce que les tiers concernés respectent les mêmes standards de protection des données.
          </p>
        </section>

        {/* -- Article 6 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">06</span>
            <h2>Cookies et technologies similaires</h2>
          </div>
          <p>
            BQL Algo utilise des cookies et des mécanismes de stockage local (localStorage) pour les finalités suivantes :
          </p>
          <ul className="legal-list">
            <li><strong>Cookies de session</strong> : pour maintenir votre état de connexion entre les visites et éviter de vous demander de vous reconnecter à chaque fois.</li>
            <li><strong>Préférences utilisateur</strong> : pour sauvegarder vos paramètres d'éditeur (thème, taille de police, etc.) et les restaurer lors de vos prochaines visites.</li>
            <li><strong>Cache de session pédagogique</strong> : pour sauvegarder localement vos fichiers de code en cours d'édition.</li>
          </ul>
          <p>
            Nous n'utilisons <strong>pas</strong> de cookies de tracking publicitaire ou de cookies tiers à des fins de ciblage marketing. Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies, mais cela peut affecter le bon fonctionnement du Service (notamment la persistance de la session).
          </p>
        </section>

        {/* -- Article 7 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">07</span>
            <h2>Vos droits</h2>
          </div>
          <p>
            Conformément aux principes généraux de protection des données, vous disposez des droits suivants concernant vos données personnelles :
          </p>

          <div className="rights-grid">
            <div className="right-item">
              <div className="right-icon"><Eye size={20} /></div>
              <div>
                <h4>Droit d'accès</h4>
                <p>Vous pouvez à tout moment consulter les données que nous détenons sur vous en accédant à votre profil.</p>
              </div>
            </div>
            <div className="right-item">
              <div className="right-icon"><Mail size={20} /></div>
              <div>
                <h4>Droit de rectification</h4>
                <p>Vous pouvez modifier vos informations personnelles directement depuis votre compte ou en nous contactant.</p>
              </div>
            </div>
            <div className="right-item">
              <div className="right-icon"><Trash2 size={20} /></div>
              <div>
                <h4>Droit à l'effacement</h4>
                <p>Vous pouvez demander la suppression de votre compte et de vos données à tout moment en nous écrivant.</p>
              </div>
            </div>
            <div className="right-item">
              <div className="right-icon"><Database size={20} /></div>
              <div>
                <h4>Droit à la portabilité</h4>
                <p>Vous pouvez demander une copie de vos données dans un format lisible et structuré.</p>
              </div>
            </div>
            <div className="right-item">
              <div className="right-icon"><Lock size={20} /></div>
              <div>
                <h4>Droit d'opposition</h4>
                <p>Vous pouvez vous opposer à certains traitements de vos données, notamment à des fins analytiques.</p>
              </div>
            </div>
            <div className="right-item">
              <div className="right-icon"><Shield size={20} /></div>
              <div>
                <h4>Droit à la limitation</h4>
                <p>Vous pouvez demander la limitation du traitement de vos données dans certaines circonstances.</p>
              </div>
            </div>
          </div>

          <p style={{ marginTop: '1.5rem' }}>
            Pour exercer l'un de ces droits, contactez-nous à l'adresse <a href="mailto:contact@bqlalgo.com" className="legal-link">contact@bqlalgo.com</a>. Nous nous engageons à répondre dans un délai maximum de <strong>30 jours</strong>.
          </p>
        </section>

        {/* -- Article 8 -- */}
        <section className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number privacy-number">08</span>
            <h2>Modifications de la politique</h2>
          </div>
          <p>
            Nous nous réservons le droit de mettre à jour la présente Politique de confidentialité pour refléter des changements dans nos pratiques ou dans la règlementation applicable. En cas de modification substantielle, vous en serez informé par email ou par une notification visible sur la Plateforme.
          </p>
          <p>
            La date de la dernière mise à jour est toujours indiquée en haut de cette page. Nous vous encourageons à la consulter régulièrement.
          </p>
        </section>

        {/* -- Contact -- */}
        <div className="legal-contact-card privacy-contact">
          <h3>Un droit à exercer ? Une question ?</h3>
          <p>Notre équipe est disponible pour répondre à toutes vos questions relatives à la protection de vos données personnelles.</p>
          <a href="mailto:contact@bqlalgo.com" className="legal-contact-btn privacy-contact-btn">
            <Mail size={16} /> contact@bqlalgo.com
          </a>
        </div>

        <div className="legal-footer-nav">
          <Link to="/terms" className="legal-footer-link">
            <Scale size={14} /> Conditions d'utilisation
          </Link>
          <Link to="/" className="legal-footer-link">
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;

