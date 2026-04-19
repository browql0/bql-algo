import React from 'react';
import { Info, BookOpen, Code2, Hash, Zap } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  FlowDiagram,
  VariableDiagram,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { VariableStateVisualizer } from '../../../visualizers';
import { Mono, P } from '../../common/LessonRendererShared';

// 1. intro
export const IntroRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine une <strong>recette de cuisine</strong> : avant de cuisiner, tu lis les étapes dans l'ordre  préparer les ingrédients, cuire, dresser. Un algorithme c'est la même chose, mais pour un ordinateur.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#4f8ff0">
        Un <strong>algorithme</strong> est une suite finie d'instructions logiques et ordonnées permettant de résoudre un problème. <em>C'est la recette avant le code.</em>
      </InfoCard>

      <WhyCard>
        Avant d'écrire du Python, du JavaScript ou du C++, les meilleurs développeurs conçoivent leur algorithme. C'est comme dessiner un plan avant de construire une maison. BQL te permet de t'entraîner à penser algorithmiquement avec une syntaxe proche du français.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure obligatoire de tout algorithme BQL" step={1}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: 'Nom ', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: 'Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: 'Début du code', accent: '#34d399' },
          { label: 'Instructions', sub: 'ECRIRE, calculs...', accent: '#facc15' },
          { label: 'FIN', sub: 'Fermeture ', accent: '#fb7185' },
        ]} />
        <InfoCard color="#c084fc" title="Règle de nommage">
          Le nom suit directement <Mono>ALGORITHME</Mono> sans espace, avec un underscore :<br />
          <Mono>ALGORITHME_MonProgramme</Mono>
        </InfoCard>
      </LessonSection>

      <LessonSection icon={<BookOpen size={15} />} title="Le programme le plus simple possible" step={2}>
        <P>Sans variable   pas besoin du bloc VARIABLE(S). Voici le minimum absolu en BQL :</P>
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="bonjour.bql" onTry={tryCode} />}
      </LessonSection>

      <StepByStep steps={[
        { label: 'ALGORITHME_Nom', desc: 'Donne un nom à ton programme. Colle-le sans espace.' },
        { label: 'DEBUT', desc: 'Marque le début des instructions exécutables.' },
        { label: 'ECRIRE("...")', desc: 'Affiche un message dans le terminal.' },
        { label: 'FIN', desc: 'Ferme le programme. Sans FIN, erreur de syntaxe.' },
      ]} />

      <WarningCard title="Erreur fréquente  espace dans le nom">
        <Mono color="#fb7185">ALGORITHME MonProgramme</Mono>    ERREUR<br />
        <Mono color="#34d399">ALGORITHME_MonProgramme</Mono>    CORRECT<br />
        <Mono color="#34d399">ALGORITHMEMonProgramme</Mono>    CORRECT
      </WarningCard>

      <TipCard title="Astuce">
        Pas de variable dans ce premier programme ?<strong> Omets complètement le bloc VARIABLE(S)</strong>. BQL accepte ALGORITHME_Nom directement suivi de DEBUT.
      </TipCard>

      <SummaryCard items={[
        'Un algorithme = suite ordonnée d\'étapes pour résoudre un problème',
        'Structure BQL : ALGORITHME_Nom   DEBUT   Instructions   FIN',
        'ECRIRE("texte") affiche quelque chose dans le terminal',
        'Le nom de l\'algorithme est collé avec un underscore, sans espace',
      ]} />
    </div>
  );
};

// 2. variables
export const VariablesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine des <strong>boîtes étiquetées</strong> dans un tiroir. Chaque boîte a un nom (<em>age</em>), un type (<em>elle ne contient que des chiffres entiers</em>), et une valeur (<em>18</em>). En BQL, une variable c'est exactement ça.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#c084fc">
        Une <strong>variable</strong> est un espace mémoire nommé qui stocke une information. Elle possède trois propriétés : un <em>nom</em>, un <em>type</em>, et une <em>valeur</em>.
      </InfoCard>

      <WhyCard>
        Sans variables, un programme ne peut que calculer des choses fixes. Avec des variables, on peut traiter des données différentes à chaque exécution. C'est la base de toute logique dynamique.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Les 5 types de données en BQL" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {[
            { type: 'ENTIER', ex: '0, 5, -7, 100', color: '#facc15', desc: 'Nombre entier' },
            { type: 'REEL', ex: '3.14, -0.5, 1.0', color: '#fb7185', desc: 'Nombre décimal' },
            { type: 'CHAINE DE CARACTERE', ex: '"Bonjour"', color: '#4ade80', desc: 'Texte' },
            { type: 'CARACTERE', ex: "'A', '3'", color: '#a78bfa', desc: 'Un seul caractère' },
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

      <LessonSection icon={<Code2 size={15} />} title="VARIABLE vs VARIABLES  Singulier ou pluriel ?" step={2}>
        <InfoCard color="#c084fc" title="Règle importante">
          <strong>VARIABLE</strong> (sans S)   une seule variable<br />
          <strong>VARIABLES</strong> (avec S)   deux variables ou plus<br />
          Le <Mono>:</Mono> vient <em>après le nom</em> de la variable, pas après VARIABLE(S).
        </InfoCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CodeBlock code={`VARIABLE\n  x : ENTIER;`} title="1 variable" />
          <CodeBlock code={`VARIABLES\n  x : ENTIER;\n  nom : CHAINE DE CARACTERE;`} title="2+ variables" />
        </div>
      </LessonSection>

      <LessonSection icon={<Zap size={15} />} title="L'affectation avec  " step={3}>
        <P>L'opérateur <Mono color="#c084fc">{'<-'}</Mono> assigne une valeur à une variable. Pense-le comme "reçoit" ou "prend la valeur de".</P>
        <VariableDiagram vars={[
          { name: 'age', type: 'ENTIER', value: '18', color: '#facc15' },
          { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
          { name: 'actif', type: 'BOOLEEN', value: 'VRAI', color: '#34d399' },
        ]} />
        <VariableStateVisualizer sequence={[
          { name: 'x', value: 5, op: 'x <- 5' },
          { name: 'x', value: 6, op: 'x <- x + 1' },
          { name: 'x', value: 12, op: 'x <- x * 2' },
          { name: 'x', value: 10, op: 'x <- x - 2' },
        ]} />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet  programme réel" step={4}>
          <CodeBlock code={lesson.example_code} title="variables.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Erreur classique">
        Ne pas confondre <Mono color="#fb7185">VARIABLE</Mono> et <Mono color="#fb7185">VARIABLES</Mono>. Utiliser le singulier pour 2+ variables = erreur de syntaxe BQL.
      </WarningCard>

      <TipCard title="Conventions de nommage">
        Utilise des noms <strong>descriptifs</strong> : <Mono color="#facc15">age</Mono>, <Mono color="#facc15">note_finale</Mono>, <Mono color="#facc15">est_actif</Mono>. évite <Mono color="#fb7185">a</Mono>, <Mono color="#fb7185">x</Mono>, <Mono color="#fb7185">var1</Mono>  illisible !
      </TipCard>

      <SummaryCard items={[
        'VARIABLE (singulier)   1 seule variable | VARIABLES (pluriel)   2 ou plus',
        '5 types : ENTIER, REEL, CHAINE DE CARACTERE, CARACTERE, BOOLEEN',
        'Affectation avec <- (et non = comme en Python)',
        'Le ; en fin de déclaration est obligatoire en BQL',
      ]} />
    </div>
  );
};

// 3. syntaxe
export const SyntaxeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une lettre officielle a une structure imposée : destinataire, objet, corps, signature. Un algorithme BQL aussi : nom, déclarations, DEBUT, instructions, FIN. Pas de liberté sur l'ordre  c'est une règle inviolable.
      </AnalogieCard>

      <InfoCard title="La structure BQL">
        Tout algorithme BQL obéit à une structure <strong>stricte et immuable</strong> : 4 blocs dans un ordre précis. BQL est conçu pour être lisible comme du français structuré.
      </InfoCard>

      <WhyCard>
        Cette structure rigide n'est pas une contrainte  c'est une aide. Quand on lit n'importe quel algorithme BQL, on sait exactement où chercher les déclarations, où commence la logique, et où elle se termine.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Les 4 blocs obligatoires dans l'ordre" step={1}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: ' Identification', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: ' Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: ' Début', accent: '#34d399' },
          { label: 'Instructions', sub: ' Corps du code', accent: '#facc15' },
          { label: 'FIN', sub: ' Fermeture', accent: '#fb7185' },
        ]} />
      </LessonSection>

      <StepByStep steps={[
        { label: 'ALGORITHME_Nom', desc: 'Premier mot, toujours. Donne son identité au programme.' },
        { label: 'VARIABLE(S)', desc: 'Toutes les variables à utiliser. Déclarées AVANT DEBUT, jamais après.' },
        { label: 'DEBUT', desc: 'Marque le début des instructions exécutables. Tout ce qui suit est exécuté.' },
        { label: 'FIN', desc: 'Clôture le programme. Obligatoire sinon erreur de syntaxe.' },
      ]} />

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet comment?" step={2}>
          <CodeBlock code={lesson.example_code} title="structure.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Les 3 erreurs de structure les plus communes">
        1. Déclarer une variable apres DEBUT <br />
        2. Oublier FIN (le programme ne se termine pas proprement)<br />
        3. écrire <Mono color="#fb7185">ALGORITHME MonProg</Mono> avec un espace   
      </WarningCard>

      <SummaryCard items={[
        'ALGORITHME_Nom   en premier',
        'VARIABLE(S)   déclarations avant DEBUT (jamais après)',
        'DEBUT...FIN   tout le code exécutable entre ces deux mots',
        'La structure est immuable : on ne peut pas inverser l\'ordre des blocs',
      ]} />
    </div>
  );
};
