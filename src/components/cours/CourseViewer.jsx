import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, Loader2, Award,
  Play, Zap, Target
} from 'lucide-react';
import { useCourseDetails } from '../../hooks/useCourses';
import { XPBadge, QuickRefPanel } from './LessonComponents';
import { SkeletonSidebar, SkeletonLesson } from './SkeletonComponents';
import { LESSON_RENDERERS, GenericRenderer } from './LessonRenderers';
import './CoursePage.css';

//  Rich Lesson Renderer 

const RichLessonContent = ({ lesson, onTryCode }) => {
  const lt = lesson.lesson_type || 'generic';
  const Renderer = LESSON_RENDERERS[lt] || GenericRenderer;
  return <Renderer lesson={lesson} onTryCode={onTryCode} />;
};

//  LEGACY PLACEHOLDER (kept for reference, not used) 
const _LegacyUnused = ({ lesson, onTryCode }) => {
  const lt = lesson.lesson_type || 'generic';
  if (lt === 'intro') return (
    <div>
      <InfoCard icon={<Info size={17} />} title="Définition" color="#4f8ff0">
        Un <strong>algorithme</strong> est une suite d'instructions logiques et ordonnées permettant de résoudre un problème. C'est la <em>recette</em> avant le code.
      </InfoCard>

      <LessonSection icon={<BookOpen size={15} />} title="Pourquoi apprendre les algorithmes ?" step={1}>
        <p>Avant d'écrire du code dans n'importe quel langage (Python, JavaScript...), on conçoit l'algorithme. C'est comme dessiner un plan avant de construire une maison.</p>
        <p style={{ marginTop: '0.8rem' }}>En <strong style={{ color: '#4f8ff0' }}>BQL</strong>, vous rédigez directement ces algorithmes dans une syntaxe pensée pour les débutants, lisible comme du français.</p>
      </LessonSection>

      <LessonSection icon={<Code2 size={15} />} title="Structure obligatoire de tout algorithme BQL" step={2}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: 'Nom du programme', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: 'Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: 'Début du code', accent: '#34d399' },
          { label: 'Instructions', sub: 'ECRIRE, calculs...', accent: '#facc15' },
          { label: 'FIN', sub: 'Fin obligatoire', accent: '#fb7185' },
        ]} />
        <InfoCard color="#c084fc" title="Règle de nommage">
          Le nom suit directement <code style={{ color: '#c084fc' }}>ALGORITHME</code> sans espace, avec un underscore :<br />
          <code style={{ color: '#c084fc' }}>ALGORITHME_MonProgramme</code>
        </InfoCard>
      </LessonSection>

      {code && (
        <LessonSection icon={<Code2 size={15} />} title="Le programme BQL le plus simple" step={3}>
          <p>Il n'y a pas besoin de VARIABLE(S) si on n'utilise aucune variable :</p>
          <CodeBlock code={code} title="bonjour.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="ì retenir">
        La structure <code style={{ color: '#facc15' }}>ALGORITHME_Nom ... DEBUT ... FIN</code> est <strong>toujours obligatoire</strong>. Si vous oubliez DEBUT ou FIN, le programme ne fonctionnera pas.
      </TipCard>

      <SummaryCard items={[
        'Un algorithme = suite d\'étapes logiques pour résoudre un problème',
        'Structure BQL : ALGORITHME_Nom   DEBUT   Instructions   FIN',
        'ECRIRE("texte") affiche quelque chose dans le terminal',
        'Sans variable   pas besoin de bloc VARIABLE(S)',
      ]} />
    </div>
  );

  //  variables 
  if (lt === 'variables') return (
    <div>
      <InfoCard icon={<Info size={17} />} title="Définition" color="#c084fc">
        Une <strong>variable</strong> est une boîte mémoire nommée qui stocke une information. On lui donne un <em>nom</em>, un <em>type</em>, et on lui assigne une <em>valeur</em>.
      </InfoCard>

      <LessonSection icon={<Hash size={15} />} title="Les 5 types de données" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
          {[
            { type: 'ENTIER', ex: '0, 5, -7, 100', color: '#facc15', desc: 'Nombre entier' },
            { type: 'REEL', ex: '3.14, -0.5, 1.0', color: '#fb7185', desc: 'Nombre décimal' },
            { type: 'CHAINE DE CARACTERE', ex: '"Bonjour", "BQL"', color: '#4ade80', desc: 'Texte' },
            { type: 'CARACTERE', ex: "'A', '3', '!'", color: '#a78bfa', desc: 'Un caractère' },
            { type: 'BOOLEEN', ex: 'VRAI, FAUX', color: '#34d399', desc: 'Vrai ou Faux' },
          ].map(t => (
            <div key={t.type} style={{ background: `${t.color}0e`, border: `1.5px solid ${t.color}33`, borderRadius: '12px', padding: '0.9rem', textAlign: 'center' }}>
              <div style={{ color: t.color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '0.3rem' }}>{t.type}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem' }}>{t.desc}</div>
              <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace' }}>{t.ex}</div>
            </div>
          ))}
        </div>
      </LessonSection>

      <LessonSection icon={<Code2 size={15} />} title="Syntaxe BQL  singulier vs pluriel" step={2}>
        <InfoCard color="#c084fc" title="Règle importante">
          <strong>VARIABLE</strong> (sans S)   une seule variable<br />
          <strong>VARIABLES</strong> (avec S)   plusieurs variables<br />
          On ne met <strong>pas de ":" après VARIABLE(S)</strong>. Le ":" vient <em>après le nom</em> de la variable.
        </InfoCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CodeBlock code={`VARIABLE\n  x : ENTIER;`} title="1 variable" />
          <CodeBlock code={`VARIABLES\n  x : ENTIER;\n  nom : CHAINE DE CARACTERE;`} title="2+ variables" />
        </div>
      </LessonSection>

      <LessonSection icon={<Zap size={15} />} title="L'affectation avec  " step={3}>
        <p>En BQL, l'opérateur <code style={{ color: '#c084fc' }}>&lt;-</code> assigne une valeur à une variable (comme <code>=</code> dans d'autres langages).</p>
        <VariableDiagram vars={[
          { name: 'age', type: 'ENTIER', value: '18', color: '#facc15' },
          { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
          { name: 'actif', type: 'BOOLEEN', value: 'VRAI', color: '#34d399' },
        ]} />
      </LessonSection>

      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple complet" step={4}><CodeBlock code={code} title="variables.bql" onTry={tryCode} /></LessonSection>}

      <WarningCard title="Erreur classique">
        Ne pas confondre <code style={{ color: '#fb7185' }}>VARIABLE</code> et <code style={{ color: '#fb7185' }}>VARIABLES</code>. Utiliser le singulier pour 2 variables = erreur de syntaxe BQL.
      </WarningCard>

      <SummaryCard items={[
        'VARIABLE (singulier)   1 seule variable',
        'VARIABLES (pluriel)   2 variables ou plus',
        'Affectation avec <- (pas avec =)',
        '5 types : ENTIER, REEL, CHAINE DE CARACTERE, CARACTERE, BOOLEEN',
      ]} />
    </div>
  );

  //  syntaxe 
  if (lt === 'syntaxe') return (
    <div>
      <InfoCard title="La structure BQL">
        Tout algorithme BQL obéit à une structure <strong>stricte et immuable</strong> : 4 blocs dans un ordre précis.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Les 4 blocs obligatoires" step={1}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: ' Identification', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: ' Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: ' Début', accent: '#34d399' },
          { label: 'Instructions', sub: ' Corps du code', accent: '#facc15' },
          { label: 'FIN', sub: ' Fermeture', accent: '#fb7185' },
        ]} />
      </LessonSection>
      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple complet" step={2}><CodeBlock code={code} title="structure.bql" onTry={tryCode} /></LessonSection>}
      <SummaryCard items={[
        'ALGORITHME_Nom   en premier, sans espace, underscore recommandé',
        'VARIABLE(S)   déclarations avant DEBUT',
        'DEBUT...FIN   tout le code exécutable entre ces blocs',
      ]} />
    </div>
  );

  //  operateurs 
  if (lt === 'operateurs') return (
    <div>
      <LessonSection icon={<Hash size={15} />} title="Opérateurs arithmétiques" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {[['+', 'Addition'], ['-', 'Soustraction'], ['*', 'Multiplication'], ['/', 'Division'], ['MOD', 'Modulo']].map(([op, label]) => (
            <div key={op} style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '10px', padding: '0.7rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#facc15', fontFamily: 'monospace' }}>{op}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
        <TipCard title="MOD  Modulo">
          <code style={{ color: '#facc15' }}>7 MOD 2 = 1</code>   Le reste de la division de 7 par 2 est 1 (car 7 = 32 + <strong>1</strong>).<br />
          Très utile pour tester si un nombre est pair : <code style={{ color: '#facc15' }}>n MOD 2 = 0</code> signifie "n est pair".
        </TipCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Opérateurs de comparaison" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {[['=', '0gal'], ['<>', 'Différent'], ['<', 'Inférieur'], ['>', 'Supérieur'], ['<=', 'Inf. ou égal'], ['>=', 'Sup. ou égal']].map(([op, label]) => (
            <div key={op} style={{ background: 'rgba(79,143,240,0.07)', border: '1px solid rgba(79,143,240,0.2)', borderRadius: '10px', padding: '0.7rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f8ff0', fontFamily: 'monospace' }}>{op}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
        <InfoCard color="#4f8ff0" title="BQL utilise <> pour 'différent'">
          En BQL, l'inégalité s'écrit <code style={{ color: '#4f8ff0' }}>&lt;&gt;</code> (et non pas != comme en Python ou JS).
        </InfoCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Opérateurs logiques" step={3}>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          {[['ET', 'Les DEUX conditions doivent être vraies', '#34d399'], ['OU', 'Au moins UNE condition vraie suffit', '#a78bfa'], ['NON', 'Inverse la condition', '#fb7185']].map(([op, desc, color]) => (
            <div key={op} style={{ background: `${color}0e`, border: `1px solid ${color}33`, borderRadius: '12px', padding: '1rem 1.2rem', flex: 1, minWidth: '130px' }}>
              <div style={{ color, fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>{op}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>{desc}</div>
            </div>
          ))}
        </div>
      </LessonSection>

      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple pratique" step={4}><CodeBlock code={code} title="operateurs.bql" onTry={tryCode} /></LessonSection>}

      <SummaryCard items={[
        'Arithmétique : +, -, *, /, MOD (modulo)',
        'Comparaison : =, <>, <, >, <=, >= (différent = <>)',
        'Logique : ET, OU, NON',
        'MOD = reste de la division entière',
      ]} />
    </div>
  );

  //  io 
  if (lt === 'io') return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <InfoCard icon={<Code2 size={17} />} title="ECRIRE( )" color="#4ade80">
          Affiche du texte ou la valeur d'une variable dans le terminal.
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#4ade80', marginTop: '0.6rem', lineHeight: '1.7' }}>
            ECRIRE("Bonjour");<br />
            ECRIRE("Age :", age);
          </div>
        </InfoCard>
        <InfoCard icon={<Code2 size={17} />} title="LIRE( )" color="#60a5fa">
          Attend la saisie de l'utilisateur et stocke dans une variable.
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#60a5fa', marginTop: '0.6rem', lineHeight: '1.7' }}>
            LIRE(nom);<br />
            LIRE(age);
          </div>
        </InfoCard>
      </div>

      <LessonSection icon={<Code2 size={15} />} title="Exemple interactif complet" step={1}>
        <p>Ce programme demande le prénom de l'utilisateur, attend sa réponse, puis affiche un message :</p>
        {code && <CodeBlock code={code} title="entree_sortie.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Combiner texte et variables dans ECRIRE" step={2}>
        <p>On peut passer <strong>plusieurs arguments</strong> à ECRIRE en les séparant par des virgules :</p>
        <CodeBlock code={`ALGORITHME_Multi;\nVARIABLES\n  prenom : CHAINE DE CARACTERE;\n  age : ENTIER;\nDEBUT\n  prenom <- "Alice";\n  age <- 25;\n  ECRIRE("Bonjour ", prenom, " ! Tu as ", age, " ans.");\nFIN`} title="multi_args.bql" />
      </LessonSection>

      <WarningCard>La variable utilisée dans <code style={{ color: '#fb7185' }}>LIRE(x)</code> doit être déclarée AVANT dans VARIABLE(S). Sinon : erreur.</WarningCard>

      <SummaryCard items={[
        'ECRIRE("texte")   affiche dans le terminal',
        'ECRIRE("texte", variable, ...)   combine texte et variables',
        'LIRE(variable)   attend la saisie utilisateur',
        'La variable LIRE doit être déclarée avant d\'être utilisée',
      ]} />
    </div>
  );

  //  exemples 
  if (lt === 'exemples') return (
    <div>
      <InfoCard title="Cas pratique complet">
        Ce programme combine tout le Niveau 1 : variables, opérateurs, LIRE et ECRIRE.
      </InfoCard>
      {code && <CodeBlock code={code} title="exemple_complet.bql" onTry={tryCode} />}
      <TipCard title="Entraînez-vous !">Modifiez ce programme pour calculer autre chose. Essayez de faire un calcul de note, un convertisseur de température, ou un programme qui demande l'année de naissance.</TipCard>
      <SummaryCard items={[
        'Combiner plusieurs variables dans un même calcul',
        'LIRE() permet d\'interagir avec l\'utilisateur',
        'ECRIRE(..., ...) peut afficher plusieurs valeurs à la fois',
      ]} />
    </div>
  );

  //  condition_si 
  if (lt === 'condition_si') return (
    <div>
      <InfoCard icon={<Info size={17} />} title="Définition" color="#facc15">
        <strong>SI</strong> permet de prendre une décision : exécuter un bloc d'instructions <em>seulement si</em> une condition est vraie.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure et schéma de décision" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc exécuté" falseLabel="Ignoré" />
        {code && <CodeBlock code={code} title="si_simple.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard>Toujours fermer le bloc avec <code style={{ color: '#fb7185' }}>FINSI</code>. L'oublier est l'erreur de syntaxe la plus fréquente chez les débutants !</WarningCard>

      <SummaryCard items={[
        'SI condition ALORS ... FINSI',
        'Le bloc s\'exécute seulement si la condition est VRAI',
        'FINSI est obligatoire pour fermer le bloc',
        'Pas de limites au niveau d\'imbrication des SI',
      ]} />
    </div>
  );

  //  condition_sinon 
  if (lt === 'condition_sinon') return (
    <div>
      <InfoCard title="SI / SINON">
        Le bloc <strong>SINON</strong> est le chemin alternatif  il s'exécute quand la condition est <em>fausse</em>.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Deux chemins possibles" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc ALORS" falseLabel="Bloc SINON" />
        {code && <CodeBlock code={code} title="si_sinon.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard>Maximum <strong>un seul SINON</strong> par bloc SI. Pour plusieurs cas, utilisez SINONSI ou SELON.</TipCard>
      <SummaryCard items={['SI ... ALORS ... SINON ... FINSI', 'SINON = chemin si condition fausse', 'Maximum 1 SINON par SI']} />
    </div>
  );

  //  sinon_si 
  if (lt === 'sinon_si') return (
    <div>
      <InfoCard title="Chaîne de conditions">
        Grâce à <strong>SINONSI</strong>, on évalue plusieurs conditions à la suite. BQL s'arrête au <em>premier bloc vrai</em> rencontré.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Structure en cascade" step={1}>
        {code && <CodeBlock code={code} title="sinon_si.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard title="Ordre important !">Placez les conditions <strong>du plus restrictif au plus général</strong>. BQL s'arrête dès qu'une condition est vraie.</TipCard>
      <SummaryCard items={['SINONSI permet d\'enchaîner plusieurs conditions', 'Le 1er bloc VRAI est exécuté', 'Un seul FINSI pour tout le bloc']} />
    </div>
  );

  //  condition_imbrique 
  if (lt === 'condition_imbrique') return (
    <div>
      <InfoCard title="Conditions imbriquées">Un bloc SI peut contenir d'autres SI à l'intérieur. Chaque SI a son propre FINSI.</InfoCard>
      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple" step={1}><CodeBlock code={code} title="imbrique.bql" onTry={tryCode} /></LessonSection>}
      <TipCard>Indentez soigneusement pour identifier quel FINSI correspond à quel SI.</TipCard>
      <SummaryCard items={['Chaque SI imbriqué a son propre FINSI', 'Utile pour vérifier plusieurs critères indépendants']} />
    </div>
  );

  //  selon 
  if (lt === 'selon') return (
    <div>
      <InfoCard title="SELON  sélection multiple">
        <strong>SELON</strong> évalue une variable et exécute le <strong>CAS</strong> correspondant. <strong>AUTRE</strong> est le cas par défaut.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Structure SELON" step={1}>
        <CodeBlock code={`SELON variable FAIRE\n  CAS valeur1:\n    // instructions\n  CAS valeur2:\n    // instructions\n  AUTRE:\n    // cas par défaut\nFINSELON`} title="structure_selon.bql" />
        {code && <CodeBlock code={code} title="selon.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard title="SELON vs SI/SINON">Préférez SELON quand vous testez une variable contre des <strong>valeurs exactes</strong>. C'est plus lisible.</TipCard>
      <SummaryCard items={['SELON variable FAIRE ... FINSELON', 'CAS valeur:   branche exacte', 'AUTRE:   branche par défaut', 'Fermer avec FINSELON']} />
    </div>
  );

  //  selon_imbrique 
  if (lt === 'selon_imbrique') return (
    <div>
      <InfoCard title="SELON imbriqué">Un CAS peut contenir d'autres conditions. Utile pour des logiques à deux niveaux.</InfoCard>
      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple  catégorie + niveau" step={1}><CodeBlock code={code} title="selon_imbrique.bql" onTry={tryCode} /></LessonSection>}
      <TipCard>Dans un CAS, utilisez des SI/SINON normaux plutôt qu'un SELON imbriqué si cela suffit.</TipCard>
      <SummaryCard items={['Un CAS peut contenir des SI/SINON', 'Fermer avec FINSI (SI internes) et FINSELON']} />
    </div>
  );

  //  boucle_intro 
  if (lt === 'boucle_intro') return (
    <div>
      <InfoCard title="Les boucles">
        Une boucle <strong>répète automatiquement</strong> un bloc. Sans boucle, afficher 100 nombres = 100 lignes de code. Avec une boucle = 3 lignes.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="3 types de boucles BQL" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {[['POUR', 'Nb de tours connu à l\'avance', '#4f8ff0'], ['TANTQUE', 'Répète tant que condition vraie', '#a78bfa'], ['REPETER', 'S\'exécute au moins 1 fois', '#34d399']].map(([n, d, c]) => (
            <div key={n} style={{ background: `${c}0e`, border: `1px solid ${c}33`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ color: c, fontFamily: 'monospace', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>{n}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
        </div>
        {code && <CodeBlock code={code} title="intro_boucle.bql" onTry={tryCode} />}
      </LessonSection>

      <SummaryCard items={['Une boucle répète un bloc automatiquement', 'POUR : nombre de tours connu | TANTQUE : condition | REPETER : 01 fois', 'Essentielle pour éviter la répétition de code']} />
    </div>
  );

  //  boucle_pour 
  if (lt === 'boucle_pour') return (
    <div>
      <InfoCard title="Boucle POUR">
        Utilisée quand on connaît <strong>à l'avance</strong> le nombre d'itérations. La variable de boucle est incrémentée automatiquement.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement étape par étape" step={1}>
        <LoopDiagram type="pour" initLabel="i = début" condLabel="i 0 fin ?" bodyLabel="Corps" updateLabel="i + 1" />
        <InfoCard color="#c084fc" title="Syntaxe exacte">
          <code style={{ color: '#c084fc' }}>POUR i ALLANT DE début A fin FAIRE ... FINPOUR</code><br />
          La variable <code>i</code> est incrémentée de 1 automatiquement à chaque tour.
        </InfoCard>
      </LessonSection>

      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple" step={2}><CodeBlock code={code} title="boucle_pour.bql" onTry={tryCode} /></LessonSection>}

      <WarningCard>Fermer avec <code style={{ color: '#fb7185' }}>FINPOUR</code>. Ne pas oublier <code style={{ color: '#fb7185' }}>FAIRE</code> après les bornes.</WarningCard>
      <SummaryCard items={['POUR i ALLANT DE debut A fin FAIRE ... FINPOUR', 'i est automatiquement incrémenté de 1 à chaque tour', 'Si debut > fin   boucle ignorée']} />
    </div>
  );

  //  boucle_tantque 
  if (lt === 'boucle_tantque') return (
    <div>
      <InfoCard title="Boucle TANTQUE">
        La condition est vérifiée <strong>AVANT chaque itération</strong>. Si elle est fausse dès le départ, la boucle ne s'exécute jamais.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement" step={1}>
        <LoopDiagram type="tantque" initLabel="Init" condLabel="Cond ?" bodyLabel="Corps" updateLabel="Update" />
        {code && <CodeBlock code={code} title="tantque.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Boucle infinie !">
        Si vous oubliez de modifier la variable de la condition à l'intérieur du bloc, vous créez une <strong>boucle infinie</strong> qui ne s'arrêtera jamais !
      </WarningCard>
      <SummaryCard items={['TANTQUE condition FAIRE ... FINTANTQUE', 'Condition vérifiée AVANT chaque tour', '0 exécution possible si condition fausse dès le début', 'Modifier la variable de condition dans le corps !']} />
    </div>
  );

  //  boucle_repeter 
  if (lt === 'boucle_repeter') return (
    <div>
      <InfoCard title="Boucle REPETER...JUSQU'A">
        La boucle s'exécute <strong>au moins une fois</strong>. La condition est vérifiée <em>après</em> chaque itération.
      </InfoCard>
      {code && <CodeBlock code={code} title="repeter.bql" onTry={tryCode} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <InfoCard color="#a78bfa" title="TANTQUE">Condition AVANT   peut ne jamais s'exécuter.</InfoCard>
        <InfoCard color="#34d399" title="REPETER">Condition APRS   au moins 1 exécution garantie.</InfoCard>
      </div>
      <WarningCard>La boucle s'arrête quand la condition devient <strong>VRAIE</strong> (logique <em>inverse</em> de TANTQUE).</WarningCard>
      <SummaryCard items={["REPETER ... JUSQU'A condition;", 'Condition après le bloc', 'Au moins 1 exécution garantie', 'S\'arrête quand condition = VRAI']} />
    </div>
  );

  //  boucle_imbrique 
  if (lt === 'boucle_imbrique') return (
    <div>
      <InfoCard title="Boucles imbriquées">
        On place une boucle <em>dans</em> une autre. La boucle interne s'exécute entièrement à chaque tour de la boucle externe.
      </InfoCard>
      {code && <LessonSection icon={<Code2 size={15} />} title="Exemple concret" step={1}><CodeBlock code={code} title="boucles_imbriquees.bql" onTry={tryCode} /></LessonSection>}
      <TipCard>Utilisez <code style={{ color: '#facc15' }}>i</code> pour la boucle externe, <code style={{ color: '#facc15' }}>j</code> pour l'interne. Ne jamais réutiliser le même nom !</TipCard>
      <SummaryCard items={['La boucle interne s\'exécute entièrement par tour de la boucle externe', 'N  M itérations pour des boucles de taille N et M', 'Indispensable pour les matrices 2D']} />
    </div>
  );

  //  tableau 
  if (lt === 'tableau') return (
    <div>
      <InfoCard title="Tableau (Array)">
        Un tableau stocke <strong>plusieurs valeurs du même type</strong> dans des cases numérotées. Les indices commencent à <strong>0</strong>.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Représentation visuelle" step={1}>
        <TableauDiagram values={[10, 20, 30]} name="T" color="#4f8ff0" />
        {code && <CodeBlock code={code} title="tableau.bql" onTry={tryCode} />}
      </LessonSection>
      <WarningCard>Les indices commencent à <strong>0</strong>, pas à 1. Tableau T[3]   indices T[0], T[1], T[2].</WarningCard>
      <SummaryCard items={['Tableau T[n] : TYPE   taille n', 'T[0] = premier élément', 'T[n-1] = dernier élément', 'Tous les éléments = même type']} />
    </div>
  );

  //  tableau_parcours 
  if (lt === 'tableau_parcours') return (
    <div>
      <InfoCard title="Parcours de tableau">La boucle POUR est idéale pour parcourir tous les éléments d'un tableau.</InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Parcours et visualisation" step={1}>
        <TableauDiagram values={[12, 15, 9, 18]} name="notes" color="#34d399" />
        {code && <CodeBlock code={code} title="parcours.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard>Pour un tableau de taille n : <code style={{ color: '#facc15' }}>POUR i ALLANT DE 0 A n-1 FAIRE</code>. L'indice max = taille - 1.</TipCard>
      <SummaryCard items={['POUR i ALLANT DE 0 A n-1   tous les éléments', 'T[i]   élément à l\'indice i', 'Parfait pour afficher, modifier, chercher']} />
    </div>
  );

  //  matrice 
  if (lt === 'matrice') return (
    <div>
      <InfoCard title="Matrice (tableau 2D)">
        Une matrice = tableau à deux dimensions. Accès : <code style={{ color: '#a78bfa' }}>M[ligne,colonne]</code>.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Représentation  lignes  colonnes" step={1}>
        <MatriceDiagram matrix={[[1,2,3],[4,5,6]]} name="M" color="#a78bfa" />
        {code && <CodeBlock code={code} title="matrice.bql" onTry={tryCode} />}
      </LessonSection>
      <SummaryCard items={['Tableau M[lignes,colonnes] : TYPE', 'M[i,j] = ligne i, colonne j', 'Indices 0-based dans les deux dimensions']} />
    </div>
  );

  //  matrice_parcours 
  if (lt === 'matrice_parcours') return (
    <div>
      <InfoCard title="Double boucle">
        Pour parcourir une matrice : boucle externe   lignes, boucle interne   colonnes.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Parcours complet" step={1}>
        <MatriceDiagram matrix={[[1,2],[3,4]]} name="M" color="#a78bfa" />
        {code && <CodeBlock code={code} title="parcours_matrice.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard>Pour M[L, C] : <code style={{ color: '#facc15' }}>i DE 0 A L-1</code> (lignes) et <code style={{ color: '#facc15' }}>j DE 0 A C-1</code> (colonnes).</TipCard>
      <SummaryCard items={['Double boucle POUR : i (lignes)  j (colonnes)', 'LC itérations totales', 'Boucle interne complète par ligne']} />
    </div>
  );

  //  struct 
  if (lt === 'struct') return (
    <div>
      <InfoCard title="Enregistrement (struct)">
        Regroupe des variables de <strong>types différents</strong> sous un même nom. Accès via la notation pointée.
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Définition et accès aux champs" step={1}>
        <InfoCard color="#a78bfa" title="Schéma  TYPE Personne">
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#a78bfa', lineHeight: '1.8' }}>
            Personne <br />
            &nbsp;&nbsp;S nom : CHAINE DE CARACTERE   "Alice"<br />
            &nbsp;&nbsp;S age : ENTIER   25<br />
            &nbsp;&nbsp; score : REEL   17.5
          </div>
        </InfoCard>
        {code && <CodeBlock code={code} title="struct.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard>Accès aux champs : <code style={{ color: '#facc15' }}>p.nom</code>, <code style={{ color: '#facc15' }}>p.age</code>. La notation pointée est obligatoire.</TipCard>
      <SummaryCard items={['TYPE Nom = ENREGISTREMENT ... FIN Nom', 'Regroupe variables de types différents', 'Accès : variable.champ', 'Déclarer : p : Personne;']} />
    </div>
  );

  //  exercice 
  if (lt === 'exercice') return (
    <div>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1.2rem', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ marginBottom: '0.6rem' }}><Target size={48} color="#14b8a6" /></div>
        <h2 style={{ color: '#e4e7ec', margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.6rem' }}>Défi final du niveau !</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Prouvez que vous maîtrisez ce niveau en réussissant l'exercice ci-dessous.</p>
      </div>
      {paragraphs.map((p, i) => <p key={i} style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '0.8rem' }}>{p}</p>)}
      <ExerciseBlock text={lesson.exercise || content} code={code} onTry={tryCode} />
    </div>
  );

  //  generic fallback 
  return <div><p style={{color:'#cbd5e1'}}>Leçon non trouvée.</p></div>;
};

//  Main CourseViewer 

const CourseViewer = ({ course, onBack }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [completingId, setCompletingId] = useState(null);
  const [xpFlash, setXpFlash] = useState(null);
  const [lessonKey, setLessonKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { lessons, loading, userProgress, markLessonComplete } = useCourseDetails(course?.id);

  useEffect(() => { setActiveChapterIndex(0); }, [course]);

  const scrollTop = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryCode = (lesson) => {
    navigate('/editor', {
      state: {
        codeToRun: lesson.example_code,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        isChallenge: lesson.lesson_type === 'challenge',
        lessonExercise: lesson.exercise,
        lessonContent: lesson.content
      }
    });
  };

  const goToLesson = (idx) => {
    setActiveChapterIndex(idx);
    setLessonKey(k => k + 1);
    setSidebarOpen(false); // close mobile drawer on lesson select
    scrollTop();
  };

  const autoCompleteAndNext = async () => {
    const lesson = lessons[activeChapterIndex];
    if (!lesson) return;
    const isCompleted = userProgress.has(lesson.id);
    const isExercise = lesson.lesson_type === 'exercice' || lesson.lesson_type === 'challenge';

    if (!isCompleted && !isExercise) {
      setCompletingId(lesson.id);
      await markLessonComplete(lesson.id);
      setXpFlash(lesson.xp_value || 25);
      setTimeout(() => setXpFlash(null), 2500);
      setCompletingId(null);
    }

    if (activeChapterIndex < lessons.length - 1) {
      goToLesson(activeChapterIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeChapterIndex > 0) goToLesson(activeChapterIndex - 1);
  };

  //  Loading state   skeleton
  if (loading) {
    return (
      <div className="course-viewer-container">
        <SkeletonSidebar isMobile={isMobile} />
        <div className="course-content-area" style={{ padding: '2rem 2.5rem' }}>
          <div className="course-content-inner">
            <SkeletonLesson />
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[activeChapterIndex];
  if (!currentLesson) return null;

  const isCompleted = userProgress.has(currentLesson.id);
  const isExercise = currentLesson.lesson_type === 'exercice' || currentLesson.lesson_type === 'challenge';
  const totalXP = lessons.filter(l => userProgress.has(l.id)).reduce((acc, l) => acc + (l.xp_value || 25), 0);
  const progressPct = lessons.length > 0 ? Math.round((userProgress.size / lessons.length) * 100) : 0;

  return (
    <div className="course-viewer-container">
      {/*  Mobile Sidebar Overlay  */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(3px)' }}
        />
      )}

      {/*  Sidebar  */}
      <div
        className="course-sidebar"
        style={isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '82vw', maxWidth: '320px',
          zIndex: 201, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1)', boxShadow: sidebarOpen ? '8px 0 40px rgba(0,0,0,0.5)' : 'none'
        } : {}}
      >
        <div className="sidebar-header">
          <button className="sidebar-back-btn" onClick={onBack}>
            <ChevronLeft size={14} /> Tous les cours
          </button>
          <h2 className="sidebar-title">{course.title}</h2>

          {/* Progress bar */}
          <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', marginBottom: '0.55rem' }}>
              <span>{userProgress.size}/{lessons.length} leçons</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>+{totalXP} XP</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #4f8ff0, #34d399)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: progressPct === 100 ? '#34d399' : '#475569', marginTop: '0.4rem', fontWeight: progressPct === 100 ? 700 : 400 }}>
              {progressPct === 100 ? 'S Cours terminé !' : `${progressPct}% complété`}
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {lessons.map((lesson, idx) => {
            const done = userProgress.has(lesson.id);
            const active = activeChapterIndex === idx;
            const isEx = lesson.lesson_type === 'exercice' || lesson.lesson_type === 'challenge';
            return (
              <button
                key={lesson.id}
                className={`chapter-btn ${active ? 'active' : ''}`}
                onClick={() => goToLesson(idx)}
              >
                <span style={{ flexShrink: 0, width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done
                    ? <CheckCircle size={15} style={{ color: '#34d399' }} />
                    : isEx
                      ? <Target size={14} color="#fb7185" style={{ marginTop: '2px' }} />
                      : <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#4f8ff0' : 'rgba(255,255,255,0.15)', display: 'inline-block', transition: 'background 0.2s' }} />
                  }
                </span>
                <span style={{ flex: 1, textAlign: 'left', lineHeight: '1.4', fontSize: '0.85rem' }}>{lesson.title}</span>
                {active && <ChevronRight size={12} style={{ color: '#4f8ff0', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/*  Content area  */}
      <div className="course-content-area" ref={contentRef}>
        <div className="course-content-inner">

          {/* Mobile top bar with lesson progress + sidebar toggle */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13,18,30,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.7rem 1rem', position: 'sticky', top: 0, zIndex: 100, marginBottom: '1.5rem', backdropFilter: 'blur(12px)', borderRadius: '12px', marginTop: '-0.5rem' }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(79,143,240,0.1)', border: '1px solid rgba(79,143,240,0.25)', borderRadius: '8px', color: '#4f8ff0', fontSize: '0.82rem', fontWeight: 700, padding: '0.4rem 0.8rem', cursor: 'pointer' }}
              >
                <ChevronRight size={14} /> Sommaire
              </button>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {activeChapterIndex + 1} / {lessons.length} leçons
              </div>
              <div style={{ height: '6px', width: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#4f8ff0,#34d399)', transition: 'width 0.5s' }} />
              </div>
            </div>
          )}

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div className="hero-badge" style={{ margin: 0 }}>
                Leçon {activeChapterIndex + 1} / {lessons.length}
              </div>
              {isExercise && (
                <div style={{ background: 'rgba(79,143,240,0.1)', border: '1px solid rgba(79,143,240,0.2)', borderRadius: '100px', padding: '0.25rem 0.7rem', color: '#4f8ff0', fontSize: '0.78rem', fontWeight: 700 }}>
                  <Target size={14} style={{ display: 'inline', marginTop: '-3px', verticalAlign: 'middle' }} /> Exercice
                </div>
              )}
            </div>
            {isCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} style={{ color: '#34d399' }} />
                <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>Terminée</span>
                <XPBadge xp={currentLesson.xp_value || 25} />
              </div>
            )}
          </div>

          {/* XP Flash */}
          {xpFlash && (
            <div style={{ position: 'fixed', top: '80px', right: '2rem', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '0.8rem 1.3rem', color: '#34d399', fontWeight: 800, fontSize: '1rem', zIndex: 999, animation: 'xpFadeOut 2.5s forwards', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(52,211,153,0.2)' }}>
              <Zap size={16} fill="currentColor" /> +{xpFlash} XP !
            </div>
          )}

          {/* Lesson title */}
          <h1 style={{ marginBottom: '2.2rem' }}>{currentLesson.title}</h1>

          {/* Lesson content with fade-in animation */}
          <div key={lessonKey} style={{ animation: 'fadeInUp 0.35s ease' }}>
            <RichLessonContent lesson={currentLesson} onTryCode={handleTryCode} />
          </div>

          {/* Footer nav */}
          <div className="course-footer-nav" style={{ flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            <button className="nav-pill" onClick={handlePrev} disabled={activeChapterIndex === 0}>
              <ChevronLeft size={15} /> Précédent
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              {isExercise && !isCompleted && (
                <button
                  onClick={() => handleTryCode(currentLesson)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#4f8ff0,#6366f1)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.4rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(79,143,240,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,143,240,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,143,240,0.3)'; }}>
                  <Play size={14} fill="currentColor" /> Résoudre l'exercice
                </button>
              )}

              {activeChapterIndex < lessons.length - 1 && (
                <button
                  className="nav-pill"
                  onClick={autoCompleteAndNext}
                  disabled={completingId === currentLesson.id}
                  style={{ background: isExercise && !isCompleted ? 'rgba(255,255,255,0.04)' : 'rgba(79,143,240,0.12)', borderColor: isExercise && !isCompleted ? 'rgba(255,255,255,0.08)' : 'rgba(79,143,240,0.3)', color: isExercise && !isCompleted ? '#475569' : '#4f8ff0', fontWeight: 700 }}
                >
                  {completingId === currentLesson.id
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : null}
                  Suivant <ChevronRight size={15} />
                </button>
              )}

              {activeChapterIndex === lessons.length - 1 && (
                <button className="nav-pill" onClick={onBack} style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.35)', color: '#34d399', fontWeight: 700 }}>
                  <Award size={15} /> Terminer le cours
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BQL Quick Reference */}
      <QuickRefPanel />

      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes xpFadeOut { 0%{opacity:1;transform:translateY(0) scale(1)} 70%{opacity:1} 100%{opacity:0;transform:translateY(-20px) scale(0.95)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
};

export default CourseViewer;

