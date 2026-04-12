import React from 'react';
import {
  Info, BookOpen, Code2, Hash, Zap, GitBranch,
  RefreshCw, Database, Layers, ArrowRight, Target, Cpu, Play
} from 'lucide-react';
import {
  CodeBlock, InfoCard, WarningCard, TipCard, SummaryCard, LessonSection,
  FlowDiagram, LoopDiagram, VariableDiagram, TableauDiagram, MatriceDiagram,
  BranchDiagram, ExerciseBlock, AnalogieCard, WhyCard, StepByStep
} from './LessonComponents';
import {
  ArrayTraversalVisualizer,
  ArraySearchVisualizer,
  ArrayMaxMinVisualizer,
  ArraySumVisualizer,
  ArrayReverseVisualizer,
  ArrayShiftVisualizer,
  BubbleSortVisualizer,
  MatrixTraversalVisualizer,
  VariableStateVisualizer,
  ConditionFlowVisualizer,
  LoopExecutionVisualizer,
  AccumulatorVisualizer,
  ExpressionVisualizer,
  BooleanLogicVisualizer,
  ArrayCopyVisualizer,
  RecordVisualizer,
  MatrixReverseVisualizer,
  MatrixShiftVisualizer,
} from './AlgoVisualizer';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const P = ({ children, mt }) => (
  <p style={{ color: '#cbd5e1', lineHeight: '1.85', fontSize: '0.97rem', marginBottom: '0.9rem', marginTop: mt || 0 }}>
    {children}
  </p>
);

const Mono = ({ children, color = '#c084fc' }) => (
  <code style={{ color, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.88em', background: `${color}15`, padding: '0.1em 0.4em', borderRadius: '4px' }}>
    {children}
  </code>
);

// ─── NIVEAU 1 ─────────────────────────────────────────────────────────────────

// 1. intro
export const IntroRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine une <strong>recette de cuisine</strong> : avant de cuisiner, tu lis les étapes dans l'ordre — préparer les ingrédients, cuire, dresser. Un algorithme c'est la même chose, mais pour un ordinateur.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#4f8ff0">
        Un <strong>algorithme</strong> est une suite finie d'instructions logiques et ordonnées permettant de résoudre un problème. <em>C'est la recette avant le code.</em>
      </InfoCard>

      <WhyCard>
        Avant d'écrire du Python, du JavaScript ou du C++, les meilleurs développeurs conçoivent leur algorithme. C'est comme dessiner un plan avant de construire une maison. BQL te permet de t'entraîner à penser algorithmiquement avec une syntaxe proche du français.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure obligatoire de tout algorithme BQL" step={1}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: 'Nom du programme', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: 'Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: 'Début du code', accent: '#34d399' },
          { label: 'Instructions', sub: 'ECRIRE, calculs...', accent: '#facc15' },
          { label: 'FIN', sub: 'Fermeture obligatoire', accent: '#fb7185' },
        ]} />
        <InfoCard color="#c084fc" title="Règle de nommage">
          Le nom suit directement <Mono>ALGORITHME</Mono> sans espace, avec un underscore :<br />
          <Mono>ALGORITHME_MonProgramme</Mono>
        </InfoCard>
      </LessonSection>

      <LessonSection icon={<BookOpen size={15} />} title="Le programme le plus simple possible" step={2}>
        <P>Sans variable → pas besoin du bloc VARIABLE(S). Voici le minimum absolu en BQL :</P>
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="bonjour.bql" onTry={tryCode} />}
      </LessonSection>

      <StepByStep steps={[
        { label: 'ALGORITHME_Nom', desc: 'Donne un nom à ton programme. Colle-le sans espace.' },
        { label: 'DEBUT', desc: 'Marque le début des instructions exécutables.' },
        { label: 'ECRIRE("...")', desc: 'Affiche un message dans le terminal.' },
        { label: 'FIN', desc: 'Ferme le programme. Sans FIN, erreur de syntaxe.' },
      ]} />

      <WarningCard title="Erreur fréquente — espace dans le nom">
        <Mono color="#fb7185">ALGORITHME MonProgramme</Mono> → ❌ ERREUR<br />
        <Mono color="#34d399">ALGORITHME_MonProgramme</Mono> → ✅ CORRECT (underscore obligatoire)
      </WarningCard>

      <TipCard title="Astuce">
        Pas de variable dans ce premier programme ? <strong>Omets complètement le bloc VARIABLE(S)</strong>. BQL accepte ALGORITHME_Nom directement suivi de DEBUT.
      </TipCard>

      <SummaryCard items={[
        'Un algorithme = suite ordonnée d\'étapes pour résoudre un problème',
        'Structure BQL : ALGORITHME_Nom → DEBUT → Instructions → FIN',
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

      <LessonSection icon={<Code2 size={15} />} title="VARIABLE vs VARIABLES — Singulier ou pluriel ?" step={2}>
        <InfoCard color="#c084fc" title="Règle importante">
          <strong>VARIABLE</strong> (sans S) → une seule variable<br />
          <strong>VARIABLES</strong> (avec S) → deux variables ou plus<br />
          Le <Mono>:</Mono> vient <em>après le nom</em> de la variable, pas après VARIABLE(S).
        </InfoCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CodeBlock code={`VARIABLE\n  x : ENTIER;`} title="1 variable" />
          <CodeBlock code={`VARIABLES\n  x : ENTIER;\n  nom : CHAINE DE CARACTERE;`} title="2+ variables" />
        </div>
      </LessonSection>

      <LessonSection icon={<Zap size={15} />} title="L'affectation avec ←" step={3}>
        <P>L'opérateur <Mono color="#c084fc">{'<-'}</Mono> assigne une valeur à une variable. Pense-le comme "reçoit" ou "prend la valeur de".</P>
        <VariableDiagram vars={[
          { name: 'age', type: 'ENTIER', value: '18', color: '#facc15' },
          { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
          { name: 'actif', type: 'BOOLEEN', value: 'VRAI', color: '#34d399' },
        ]} />
        <VariableStateVisualizer sequence={[
          { name: 'x', value: 5, op: 'x ← 5' },
          { name: 'x', value: 6, op: 'x ← x + 1' },
          { name: 'x', value: 12, op: 'x ← x * 2' },
          { name: 'x', value: 10, op: 'x ← x - 2' },
        ]} />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet — programme réel" step={4}>
          <CodeBlock code={lesson.example_code} title="variables.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Erreur classique">
        Ne pas confondre <Mono color="#fb7185">VARIABLE</Mono> et <Mono color="#fb7185">VARIABLES</Mono>. Utiliser le singulier pour 2+ variables = erreur de syntaxe BQL.
      </WarningCard>

      <TipCard title="Conventions de nommage">
        Utilise des noms <strong>descriptifs</strong> : <Mono color="#facc15">age</Mono>, <Mono color="#facc15">note_finale</Mono>, <Mono color="#facc15">est_actif</Mono>. Évite <Mono color="#fb7185">a</Mono>, <Mono color="#fb7185">x</Mono>, <Mono color="#fb7185">var1</Mono> — illisible !
      </TipCard>

      <SummaryCard items={[
        'VARIABLE (singulier) → 1 seule variable | VARIABLES (pluriel) → 2 ou plus',
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
        Une lettre officielle a une structure imposée : destinataire, objet, corps, signature. Un algorithme BQL aussi : nom, déclarations, DEBUT, instructions, FIN. Pas de liberté sur l'ordre — c'est une règle inviolable.
      </AnalogieCard>

      <InfoCard title="La structure BQL">
        Tout algorithme BQL obéit à une structure <strong>stricte et immuable</strong> : 4 blocs dans un ordre précis. BQL est conçu pour être lisible comme du français structuré.
      </InfoCard>

      <WhyCard>
        Cette structure rigide n'est pas une contrainte — c'est une aide. Quand on lit n'importe quel algorithme BQL, on sait exactement où chercher les déclarations, où commence la logique, et où elle se termine.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Les 4 blocs obligatoires dans l'ordre" step={1}>
        <FlowDiagram steps={[
          { label: 'ALGORITHME_Nom', sub: '① Identification', accent: '#c084fc' },
          { label: 'VARIABLE(S)', sub: '② Déclarations', accent: '#4f8ff0' },
          { label: 'DEBUT', sub: '③ Début', accent: '#34d399' },
          { label: 'Instructions', sub: '④ Corps du code', accent: '#facc15' },
          { label: 'FIN', sub: '⑤ Fermeture', accent: '#fb7185' },
        ]} />
      </LessonSection>

      <StepByStep steps={[
        { label: 'ALGORITHME_Nom', desc: 'Premier mot, toujours. Underscore obligatoire. Donne son identité au programme.' },
        { label: 'VARIABLE(S)', desc: 'Toutes les variables à utiliser. Déclarées AVANT DEBUT, jamais après.' },
        { label: 'DEBUT', desc: 'Marque le début des instructions exécutables. Tout ce qui suit est exécuté.' },
        { label: 'FIN', desc: 'Clôture le programme. Obligatoire sinon erreur de syntaxe.' },
      ]} />

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet commenté" step={2}>
          <CodeBlock code={lesson.example_code} title="structure.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Les 3 erreurs de structure les plus communes">
        1. Déclarer une variable APRÈS DEBUT → ❌<br />
        2. Oublier FIN → ❌ (le programme ne se termine pas proprement)<br />
        3. Écrire <Mono color="#fb7185">ALGORITHME MonProg</Mono> avec un espace → ❌
      </WarningCard>

      <SummaryCard items={[
        'ALGORITHME_Nom → en premier, underscore obligatoire',
        'VARIABLE(S) → déclarations avant DEBUT (jamais après)',
        'DEBUT...FIN → tout le code exécutable entre ces deux mots',
        'La structure est immuable : on ne peut pas inverser l\'ordre des blocs',
      ]} />
    </div>
  );
};

// 4. operateurs
export const OperateursRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Les opérateurs sont les <strong>outils de calcul</strong> d'un programme. Comme en maths avec +, -, ×, ÷, mais BQL ajoute des opérateurs de comparaison (est-ce que A est plus grand que B ?) et des opérateurs logiques (ET, OU, NON).
      </AnalogieCard>

      <WhyCard>
        Sans opérateurs, un programme ne peut que lire et afficher des données fixes. Les opérateurs permettent de <em>calculer</em>, <em>comparer</em>, et <em>décider</em>. Ce sont les verbes de l'algorithme.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Opérateurs arithmétiques" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {[['+', 'Addition'], ['-', 'Soustraction'], ['*', 'Multiplication'], ['/', 'Division'], ['MOD', 'Modulo']].map(([op, label]) => (
            <div key={op} style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '10px', padding: '0.7rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#facc15', fontFamily: 'monospace' }}>{op}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
        <TipCard title="MOD — Modulo">
          <Mono color="#facc15">7 MOD 2 = 1</Mono> → reste de la division de 7 par 2.<br />
          Astuce : <Mono color="#facc15">n MOD 2 = 0</Mono> signifie "<strong>n est pair</strong>".
        </TipCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Opérateurs de comparaison" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {[['=', 'Égal'], ['<>', 'Différent'], ['<', 'Inférieur'], ['>', 'Supérieur'], ['<=', 'Inf. ou égal'], ['>=', 'Sup. ou égal']].map(([op, label]) => (
            <div key={op} style={{ background: 'rgba(79,143,240,0.07)', border: '1px solid rgba(79,143,240,0.2)', borderRadius: '10px', padding: '0.7rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f8ff0', fontFamily: 'monospace' }}>{op}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
        <InfoCard color="#4f8ff0" title="BQL utilise <> pour 'différent'">
          En BQL, l'inégalité s'écrit <Mono color="#4f8ff0">{'<>'}</Mono> (et non <Mono color="#fb7185">!=</Mono> comme en Python ou JS).
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
        <ExpressionVisualizer
          tokens={[{ val: '7', type: 'num' }, { val: 'MOD', type: 'op' }, { val: '2', type: 'num' }]}
          steps={[
            { highlight: [0,1,2], desc: { text: 'On évalue 7 MOD 2 — reste de la division de 7 par 2.', color: '#facc15' } },
            { highlight: [0,1,2], partial: '1', result: '1', desc: { text: '7 MOD 2 = 1 (car 7 = 3 × 2 + 1). Utile pour tester si un nombre est pair !', color: '#34d399' } },
          ]}
        />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple pratique — calcul et modulo" step={4}>
          <CodeBlock code={lesson.example_code} title="operateurs.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <SummaryCard items={[
        'Arithmétique : +, -, *, /, MOD (modulo = reste)',
        'Comparaison : =, <>, <, >, <=, >= (différent s\'écrit <>)',
        'Logique : ET (les deux), OU (au moins un), NON (inverse)',
        'Priorité : parenthèses → * / MOD → + - → comparaison → NON → ET → OU',
      ]} />
    </div>
  );
};

// 5. io
export const IORenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine un distributeur automatique : il <strong>affiche</strong> les choix (ECRIRE), tu tapes ta sélection (LIRE), et il <strong>affiche</strong> la confirmation. C'est exactement le cycle ECRIRE/LIRE d'un programme interactif.
      </AnalogieCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <InfoCard icon={<Code2 size={17} />} title="ECRIRE( )" color="#4ade80">
          Affiche du texte ou la valeur d'une variable dans le terminal.
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#4ade80', marginTop: '0.6rem', lineHeight: '1.7' }}>
            ECRIRE("Bonjour");<br />
            ECRIRE("Age :", age);
          </div>
        </InfoCard>
        <InfoCard icon={<Code2 size={17} />} title="LIRE( )" color="#60a5fa">
          Attend la saisie de l'utilisateur et la stocke dans une variable.
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#60a5fa', marginTop: '0.6rem', lineHeight: '1.7' }}>
            LIRE(nom);<br />
            LIRE(age);
          </div>
        </InfoCard>
      </div>

      <WhyCard>
        Sans LIRE, le programme ne peut traiter que des données fixes codées en dur. Avec LIRE, chaque utilisateur peut entrer ses propres données, rendant le programme <em>générique et réutilisable</em>.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Flux d'un programme interactif" step={1}>
        <FlowDiagram steps={[
          { label: 'ECRIRE(question)', sub: 'Poser la question', accent: '#4ade80' },
          { label: 'LIRE(variable)', sub: 'Attendre saisie', accent: '#60a5fa' },
          { label: 'Traitement', sub: 'Calcul / décision', accent: '#facc15' },
          { label: 'ECRIRE(résultat)', sub: 'Afficher résultat', accent: '#4ade80' },
        ]} />
        <VariableStateVisualizer sequence={[
          { name: 'age', value: '?', op: 'LIRE(age)' },
          { name: 'age', value: 25, op: '← utilisateur tape 25' },
          { name: 'age', value: 26, op: 'age ← age + 1' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="entree_sortie.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Combiner texte et variables dans ECRIRE" step={2}>
        <P>On passe <strong>plusieurs arguments</strong> à ECRIRE en les séparant par des virgules :</P>
        <CodeBlock code={`ALGORITHME_Multi\nVARIABLES\n  prenom : CHAINE DE CARACTERE;\n  age : ENTIER;\nDEBUT\n  prenom <- "Alice";\n  age <- 25;\n  ECRIRE("Bonjour ", prenom, " ! Tu as ", age, " ans.");\nFIN`} title="multi_args.bql" />
      </LessonSection>

      <WarningCard>
        La variable utilisée dans <Mono color="#fb7185">LIRE(x)</Mono> doit être déclarée AVANT dans VARIABLE(S). Sinon : erreur de variable inconnue.
      </WarningCard>

      <TipCard>
        Toujours ECRIRE une question <em>avant</em> chaque LIRE. L'utilisateur ne sait pas quoi taper sans indication !
      </TipCard>

      <SummaryCard items={[
        'ECRIRE("texte") → affiche dans le terminal',
        'ECRIRE("texte", variable, ...) → combine texte et variables',
        'LIRE(variable) → attend la saisie et la stocke',
        'La variable passée à LIRE doit être déclarée dans VARIABLE(S)',
      ]} />
    </div>
  );
};

// 6. constantes
export const ConstantesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        La vitesse de la lumière ne change pas, Pi non plus. En programmation, certaines valeurs sont <strong>gravées dans le marbre</strong> : on les déclare comme constantes pour signaler à tous qu'elles ne doivent jamais changer.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#facc15">
        Une <strong>constante</strong> est une valeur fixe déclarée une fois. Elle ne peut pas être modifiée après sa déclaration. On la déclare avec <Mono color="#facc15">CONSTANTE</Mono> ou <Mono color="#facc15">CONSTANTES</Mono>, avant DEBUT.
      </InfoCard>

      <WhyCard>
        Si tu utilises le taux de TVA (20%) à 15 endroits dans ton code et que la TVA change, avec une constante tu modifies <em>une seule ligne</em>. Sans constante, tu modifies 15 lignes et tu en oublies probablement une.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Syntaxe de déclaration" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CodeBlock code={`CONSTANTE\n  PI : REEL = 3.14159;`} title="1 constante" />
          <CodeBlock code={`CONSTANTES\n  TVA : REEL = 0.20;\n  MAX : ENTIER = 100;`} title="2+ constantes" />
        </div>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — calculateur de prix TTC" step={2}>
          <VariableStateVisualizer sequence={[
            { name: 'TVA', value: '0.20', op: 'CONSTANTE TVA = 0.20' },
            { name: 'prix_ht', value: 100, op: 'LIRE(prix_ht)' },
            { name: 'taxes', value: 20, op: 'taxes ← prix_ht * TVA' },
            { name: 'prix_ttc', value: 120, op: 'prix_ttc ← prix_ht + taxes' },
          ]} />
          <CodeBlock code={lesson.example_code} title="constantes.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Ne jamais modifier une constante">
        Tenter <Mono color="#fb7185">PI {'<-'} 3.0</Mono> dans le corps du programme est une erreur. Les constantes sont <em>en lecture seule</em> après déclaration.
      </WarningCard>

      <TipCard title="Convention de nommage">
        Par convention, les constantes sont écrites en <strong>MAJUSCULES</strong> : <Mono color="#facc15">MAX_ESSAIS</Mono>, <Mono color="#facc15">TAUX_CHARGES</Mono>. Ça les distingue visuellement des variables.
      </TipCard>

      <SummaryCard items={[
        'CONSTANTE / CONSTANTES se déclare avant VARIABLE(S)',
        'La valeur est fixée à la déclaration avec =',
        'Impossible de la modifier après déclaration',
        'Convention : noms en MAJUSCULES pour distinguer des variables',
      ]} />
    </div>
  );
};

// 7. expressions
export const ExpressionsRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une expression c'est comme une formule Excel : <strong>=(A1*2+B1)/C1</strong>. Le programme l'évalue de gauche à droite, en respectant les priorités, et produit une valeur.
      </AnalogieCard>

      <InfoCard title="Qu'est-ce qu'une expression ?">
        Une <strong>expression</strong> est une combinaison d'opérandes (variables, constantes, nombres) et d'opérateurs qui produit une valeur calculée. Elle peut être simple (<Mono>a + b</Mono>) ou complexe (<Mono>(a * 2 + b) / c</Mono>).
      </InfoCard>

      <WhyCard>
        Les expressions permettent d'effectuer des calculs complexes en une seule ligne. BQL les évalue selon les règles de priorité mathématique.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Priorité des opérateurs" step={1}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { niveau: '①', label: 'Parenthèses', ex: '(a + b)', color: '#c084fc', note: 'Évalué en premier' },
            { niveau: '②', label: '* / MOD', ex: 'a * b', color: '#facc15', note: 'Multiplication, division, modulo' },
            { niveau: '③', label: '+ -', ex: 'a + b', color: '#4ade80', note: 'Addition, soustraction' },
            { niveau: '④', label: '< > = <> <= >=', ex: 'a > b', color: '#4f8ff0', note: 'Comparaison' },
            { niveau: '⑤', label: 'NON ET OU', ex: 'a ET b', color: '#fb7185', note: 'Logique (évalué en dernier)' },
          ].map(r => (
            <div key={r.niveau} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0.8rem', background: `${r.color}08`, borderRadius: '8px', border: `1px solid ${r.color}20` }}>
              <span style={{ color: r.color, fontWeight: 800, flexShrink: 0 }}>{r.niveau}</span>
              <code style={{ color: r.color, fontFamily: 'monospace', fontWeight: 700, minWidth: '120px' }}>{r.label}</code>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{r.note}</span>
            </div>
          ))}
        </div>
        <ExpressionVisualizer />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemples d'expressions complexes" step={2}>
          <CodeBlock code={lesson.example_code} title="expressions.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Division entière">
        En BQL, <Mono color="#fb7185">5 / 2</Mono> donne <strong>2</strong> (pas 2.5) si les opérandes sont de type ENTIER. Pour obtenir 2.5, au moins un opérande doit être REEL : <Mono color="#34d399">5.0 / 2</Mono> = 2.5.
      </WarningCard>

      <TipCard title="Parenthèses = clarté">
        Même si les parenthèses ne changent pas le résultat, <Mono color="#facc15">(a * b) + c</Mono> est plus lisible que <Mono color="#facc15">a * b + c</Mono>. Utilise-les généreusement pour clarifier tes intentions.
      </TipCard>

      <SummaryCard items={[
        'Les parenthèses ont la priorité absolue',
        '* / MOD avant + - (comme en mathématiques)',
        'Division entière : 5/2 = 2 si les deux variables sont ENTIER',
        'Utilise REEL si tu veux un résultat avec décimales',
      ]} />
    </div>
  );
};

// 8. chaines
export const ChainesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une chaîne de caractères c'est comme un <strong>collier de perles</strong> : chaque perle est un caractère ('B', 'Q', 'L'). Ensemble, elles forment un mot, une phrase, un message.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#4ade80">
        Une <strong>chaîne de caractères</strong> est une suite de caractères entre guillemets doubles. En BQL, le type s'appelle <Mono color="#4ade80">CHAINE DE CARACTERE</Mono>.
      </InfoCard>

      <WhyCard>
        La plupart des programmes traitent du texte : noms, messages, menus, réponses utilisateur. Savoir manipuler les chaînes est indispensable pour des programmes utiles et lisibles.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Déclaration et affichage" step={1}>
        <CodeBlock code={`VARIABLE\n  message : CHAINE DE CARACTERE;\nDEBUT\n  message <- "Bonjour !";\n  ECRIRE(message);\nFIN`} title="chaine_simple.bql" />
      </LessonSection>

      <LessonSection icon={<Code2 size={15} />} title="Combiner plusieurs valeurs dans ECRIRE" step={2}>
        <P>ECRIRE accepte autant d'arguments qu'on veut, séparés par des virgules. On peut mélanger chaînes, variables et calculs :</P>
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="chaines.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Pas de concaténation avec + en BQL">
        En BQL, <Mono color="#fb7185">prenom + " " + nom</Mono> n'est PAS valide. Pour combiner du texte, passe tous les éléments à ECRIRE séparés par des virgules : <Mono color="#34d399">ECRIRE(prenom, " ", nom)</Mono>.
      </WarningCard>

      <TipCard title="Guillemets dans une chaîne">
        Pour inclure un guillemet dans une chaîne, utilise deux guillemets consécutifs ou un caractère d'échappement selon le contexte BQL.
      </TipCard>

      <SummaryCard items={[
        'Type CHAINE DE CARACTERE → texte entre guillemets doubles',
        'Affectation : nom <- "Alice"',
        'ECRIRE("texte", variable, ...) → combine librement texte et données',
        'Pas de + pour concaténer : utiliser les virgules dans ECRIRE',
      ]} />
    </div>
  );
};

// 9. exemples
export const ExemplesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Cas pratique complet — Niveau 1">
        Ce programme combine tout le Niveau 1 : constantes, variables, opérateurs, LIRE et ECRIRE. Il calcule un salaire net à partir d'un taux de charges.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="exemple_complet.bql" onTry={tryCode} />}

      <LessonSection icon={<Hash size={15} />} title="Décomposition du programme" step={1}>
        <StepByStep steps={[
          { label: 'Constante', desc: 'TAUX_CHARGES définit le taux fixe à 22%.' },
          { label: 'Variables', desc: 'prenom, salaire_brut, charges, salaire_net pour stocker chaque donnée.' },
          { label: 'LIRE', desc: 'Interagit avec l\'utilisateur pour obtenir ses données.' },
          { label: 'Calcul', desc: 'charges = salaire_brut × 0.22, puis soustraction.' },
          { label: 'ECRIRE', desc: 'Affiche le résultat formaté proprement.' },
        ]} />
      </LessonSection>

      <TipCard title="Entraîne-toi !">
        Modifie ce programme pour calculer autre chose : un IMC (poids / taille²), une conversion euros → dollars, ou l'âge dans X années.
      </TipCard>

      <SummaryCard items={[
        'Combiner constantes + variables + calculs + LIRE + ECRIRE',
        'Un programme complet suit un flux logique : entrée → traitement → sortie',
        'Les constantes rendent le code plus maintenable',
      ]} />
    </div>
  );
};

// ─── NIVEAU 2 ─────────────────────────────────────────────────────────────────

// condition_si
export const ConditionSiRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine un portier de boîte de nuit : <strong>SI la personne a plus de 18 ans ALORS</strong> elle entre, <strong>sinon</strong> elle reste dehors. Un SI c'est un gardien qui décide si un bloc de code s'exécute ou non.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#facc15">
        L'instruction <strong>SI</strong> exécute un bloc d'instructions <em>seulement si</em> une condition est vraie. Si la condition est fausse, le bloc est ignoré.
      </InfoCard>

      <WhyCard>
        Sans conditions, un programme fait toujours la même chose. Avec SI, il peut <em>réfléchir</em> et adapter son comportement. C'est la base de toute intelligence logicielle.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure et schéma de décision" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc exécuté" falseLabel="Ignoré" />
        <ConditionFlowVisualizer
          condition="age >= 18"
          trueBlock='ECRIRE("Accès autorisé")'
          falseBlock='ECRIRE("Refusé")'
          testValues={[
            { label: 'age = 20', result: true },
            { label: 'age = 15', result: false },
            { label: 'age = 18', result: true },
          ]}
        />
        <StepByStep steps={[
          { label: 'SI condition ALORS', desc: 'BQL évalue la condition (vrai ou faux).' },
          { label: 'Block ALORS', desc: 'Instructions exécutées seulement si VRAI.' },
          { label: 'FINSI', desc: 'Ferme le bloc. Obligatoire.' },
        ]} title="Déroulement étape par étape" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="si_simple.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Exemples de conditions" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          {[
            ['age >= 18', 'Majeur ?', '#34d399'],
            ['note <> 0', 'Note non nulle ?', '#4f8ff0'],
            ['score > 100', 'Score max dépassé ?', '#facc15'],
            ['actif = VRAI', 'Compte actif ?', '#a78bfa'],
          ].map(([cond, desc, c]) => (
            <div key={cond} style={{ background: `${c}0a`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '0.8rem' }}>
              <code style={{ color: c, display: 'block', fontFamily: 'monospace', marginBottom: '0.3rem' }}>{cond}</code>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</span>
            </div>
          ))}
        </div>
      </LessonSection>

      <WarningCard>
        Toujours fermer le bloc avec <Mono color="#fb7185">FINSI</Mono>. L'oublier est l'erreur N°1 des débutants en BQL !
      </WarningCard>

      <SummaryCard items={[
        'SI condition ALORS ... FINSI',
        'Le bloc s\'exécute seulement si la condition est VRAIE',
        'FINSI est obligatoire pour fermer le bloc',
        'La condition peut utiliser tout opérateur de comparaison',
      ]} />
    </div>
  );
};

// condition_sinon
export const ConditionSinonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un feu tricolore : <strong>SI le feu est vert ALORS</strong> tu passes, <strong>SINON</strong> tu t'arrêtes. Deux chemins exclusifs. L'un ou l'autre, jamais les deux.
      </AnalogieCard>

      <InfoCard title="SI / SINON — deux chemins">
        Le bloc <strong>SINON</strong> est le chemin alternatif — il s'exécute quand la condition est <em>fausse</em>. Ensemble, SI et SINON forment un branchement <em>binaire</em>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Les deux chemins possibles" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc ALORS" falseLabel="Bloc SINON" />
        <ConditionFlowVisualizer
          condition="note >= 10"
          trueBlock='ECRIRE("Admis !")'
          falseBlock='ECRIRE("Recalé")'
          testValues={[
            { label: 'note = 14', result: true },
            { label: 'note = 7', result: false },
            { label: 'note = 10', result: true },
          ]}
        />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="si_sinon.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Exemple concret — système de notes" step={2}>
        <CodeBlock code={`ALGORITHME_Bulletin\nVARIABLE\n  note : ENTIER;\nDEBUT\n  note <- 13;\n  SI note >= 10 ALORS\n    ECRIRE("Admis ! Félicitations.");\n  SINON\n    ECRIRE("Recalé. Bon courage pour le rattrapage.");\n  FINSI\nFIN`} title="bulletin.bql" />
      </LessonSection>

      <TipCard>Maximum <strong>un seul SINON</strong> par bloc SI. Pour plusieurs cas, utilise <Mono color="#facc15">SINON SI</Mono>.</TipCard>

      <SummaryCard items={[
        'SI ... ALORS ... SINON ... FINSI',
        'SINON = chemin si condition fausse',
        'Maximum 1 SINON par bloc SI',
        'Les deux blocs sont mutuellement exclusifs',
      ]} />
    </div>
  );
};

// sinon_si
export const SinonSiRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un jeu de tri de colis : <strong>SI le poids est {'<'} 1kg → lettre, SINON SI {'<'} 5kg → petit colis, SINON SI {'<'} 20kg → grand colis, SINON → palet</strong>. BQL s'arrête dès qu'une condition est vraie.
      </AnalogieCard>

      <InfoCard title="Chaîne de conditions">
        Grâce à <strong>SINON SI</strong>, on évalue plusieurs conditions à la suite. BQL s'arrête au <em>premier bloc vrai</em> rencontré. Les suivants sont ignorés.
      </InfoCard>

      <WhyCard>
        Sans SINON SI, il faudrait imbriquer des SI dans des SINON — code rapidement illisible. SINON SI permet une cascade linéaire, propre et facile à lire.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure en cascade" step={1}>
        <StepByStep steps={[
          { label: 'SI cond1 ALORS', desc: 'Évalué en premier. Si VRAI → exécuté + stop.' },
          { label: 'SINON SI cond2 ALORS', desc: 'Évalué seulement si cond1 est FAUSSE.' },
          { label: 'SINON SI cond3 ALORS', desc: 'Évalué seulement si cond1 et cond2 sont FAUSSES.' },
          { label: 'SINON', desc: 'Exécuté si AUCUNE condition précédente n\'était VRAIE.' },
          { label: 'FINSI', desc: 'Un seul FINSI pour toute la chaîne.' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="sinon_si.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Ordre des conditions !">
        Placez les conditions <strong>du plus restrictif au plus général</strong>. Si tu mets <Mono color="#facc15">{'note >= 10'}</Mono> avant <Mono color="#facc15">{'note >= 16'}</Mono>, les très bonnes notes seront classées "Passable".
      </TipCard>

      <SummaryCard items={[
        'SINON SI permet d\'enchaîner plusieurs conditions',
        'Le 1er bloc VRAI est exécuté, les suivants ignorés',
        'Un seul FINSI pour toute la chaîne',
        'Ordre critique : du plus restrictif au plus général',
      ]} />
    </div>
  );
};

// condition_imbrique
export const ConditionImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Accès à un bâtiment sécurisé : <strong>SI tu as le badge ALORS</strong> (tu entres dans le hall), puis <strong>SI tu as le code ALORS</strong> (tu accèdes au couloir), puis <strong>SI tu as l'empreinte ALORS</strong> (tu entres dans le bureau). Chaque vérification est dans la précédente.
      </AnalogieCard>

      <InfoCard title="Conditions imbriquées">
        Un bloc SI peut contenir d'autres SI à l'intérieur. Chaque SI a son propre FINSI. Cela permet de vérifier des critères <em>hiérarchiques</em> — le deuxième critère n'est évalué que si le premier est vrai.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — accès conditionnel" step={1}>
          <CodeBlock code={lesson.example_code} title="imbrique.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Compter les FINSI" step={2}>
        <InfoCard color="#facc15" title="Règle du 1-pour-1">
          Chaque <Mono color="#facc15">SI</Mono> doit avoir exactement un <Mono color="#facc15">FINSI</Mono>. Si tu as 3 SI imbriqués → 3 FINSI. Indente soigneusement pour ne pas perdre le fil.
        </InfoCard>
      </LessonSection>

      <WarningCard title="Attention à l'indentation">
        En BQL, l'indentation n'est pas obligatoire mais elle est <em>vitale pour la lisibilité</em>. Chaque SI imbriqué devrait être indenté d'un niveau supplémentaire.
      </WarningCard>

      <SummaryCard items={[
        'Chaque SI imbriqué a son propre FINSI',
        'N SI imbriqués → N FINSI',
        'Utilise l\'imbrication pour des critères hiérarchiques',
        'Indente soigneusement pour garder le fil',
      ]} />
    </div>
  );
};

// operateurs_logiques
export const OperateursLogiquesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Pour accéder à un avion : tu dois AVOIR ton passeport <strong>ET</strong> ton billet <strong>ET</strong> être là à l'heure. Si UNE condition manque, tu ne montes pas. Avec OU : une salle accepte les étudiants <strong>OU</strong> les enseignants (un seul suffit).
      </AnalogieCard>

      <InfoCard title="ET, OU, NON — les connecteurs logiques">
        Les opérateurs logiques combinent des conditions pour former des expressions booléennes complexes.
      </InfoCard>

      <LessonSection icon={<Hash size={15} />} title="Tables de vérité" step={1}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { op: 'ET', rows: [['VRAI', 'VRAI', '#34d399', 'VRAI'], ['VRAI', 'FAUX', '#fb7185', 'FAUX'], ['FAUX', 'VRAI', '#fb7185', 'FAUX'], ['FAUX', 'FAUX', '#fb7185', 'FAUX']] },
            { op: 'OU', rows: [['VRAI', 'VRAI', '#34d399', 'VRAI'], ['VRAI', 'FAUX', '#34d399', 'VRAI'], ['FAUX', 'VRAI', '#34d399', 'VRAI'], ['FAUX', 'FAUX', '#fb7185', 'FAUX']] },
          ].map(({ op, rows }) => (
            <div key={op} style={{ flex: 1, minWidth: '200px', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#4f8ff0', fontSize: '0.85rem' }}>{op}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['A', 'B', 'A ' + op + ' B'].map(h => <th key={h} style={{ padding: '0.4rem 0.8rem', color: '#475569', fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([a, b, c, r], i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.35rem 0.8rem', color: a === 'VRAI' ? '#34d399' : '#fb7185', fontFamily: 'monospace', textAlign: 'center' }}>{a}</td>
                      <td style={{ padding: '0.35rem 0.8rem', color: b === 'VRAI' ? '#34d399' : '#fb7185', fontFamily: 'monospace', textAlign: 'center' }}>{b}</td>
                      <td style={{ padding: '0.35rem 0.8rem', color: c, fontFamily: 'monospace', textAlign: 'center', fontWeight: 700 }}>{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <InfoCard color="#fb7185" title="NON — inversion" style={{ marginTop: '1rem' }}>
          <Mono color="#fb7185">NON VRAI = FAUX</Mono> &nbsp; | &nbsp; <Mono color="#34d399">NON FAUX = VRAI</Mono><br />
          Utile pour écrire des conditions négatives : <Mono color="#fb7185">SI NON inscrit ALORS ECRIRE("Inscrivez-vous !");</Mono>
        </InfoCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Expérimenter avec les portes logiques" step={1.5}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
          <BooleanLogicVisualizer operator="ET" />
          <BooleanLogicVisualizer operator="OU" />
        </div>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet" step={2}>
          <CodeBlock code={lesson.example_code} title="op_logiques.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Priorité des opérateurs logiques">
        L'ordre d'évaluation : <Mono color="#fb7185">NON</Mono> en premier, puis <Mono color="#facc15">ET</Mono>, puis <Mono color="#a78bfa">OU</Mono>. Utilise des parenthèses pour lever toute ambiguïté : <Mono color="#34d399">(A OU B) ET C</Mono>.
      </WarningCard>

      <SummaryCard items={[
        'ET : les DEUX conditions doivent être VRAIES',
        'OU : au moins UNE condition suffit',
        'NON : inverse la valeur booléenne',
        'Priorité : NON > ET > OU — utiliser les parenthèses !',
      ]} />
    </div>
  );
};

// selon
export const SelonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un menu de restaurant : <strong>SELON le numéro commandé</strong>, le serveur apporte CAS 1 une entrée, CAS 2 un plat, CAS 3 un dessert. Si le numéro n'existe pas → AUTRE : "Ce plat n'est pas disponible."
      </AnalogieCard>

      <InfoCard title="SELON — sélection multiple">
        <strong>SELON</strong> évalue une variable et exécute le <strong>CAS</strong> correspondant à sa valeur exacte. <strong>AUTRE</strong> est le cas par défaut. C'est l'équivalent du <em>switch</em> en Python/JS.
      </InfoCard>

      <WhyCard>
        Quand on a 5, 10, 15 valeurs possibles à tester, utiliser SINON SI devient vite illisible. SELON est plus propre, plus lisible, et indique clairement qu'on teste une seule variable contre plusieurs valeurs exactes.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure SELON" step={1}>
        <CodeBlock code={`SELON variable FAIRE\n  CAS valeur1:\n    // instructions\n  CAS valeur2:\n    // instructions\n  AUTRE:\n    // cas par défaut\nFINSELON`} title="structure_selon.bql" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="selon.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<GitBranch size={15} />} title="SELON vs SI/SINON — quand utiliser quoi ?" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#4f8ff0" title="Utilisez SELON">
            Quand vous testez une variable contre des <strong>valeurs exactes</strong> (1, 2, 3, "rouge", "bleu"...)
          </InfoCard>
          <InfoCard color="#a78bfa" title="Utilisez SI/SINON SI">
            Quand vous testez des <strong>plages ou intervalles</strong> ({">"} 10, {"<="} 18, entre 5 et 10...)
          </InfoCard>
        </div>
      </LessonSection>

      <WarningCard>
        Le bloc SELON se ferme avec <Mono color="#fb7185">FINSELON</Mono> (pas FINSI). Et chaque CAS se termine par des deux-points <Mono color="#fb7185">:</Mono>.
      </WarningCard>

      <SummaryCard items={[
        'SELON variable FAIRE ... FINSELON',
        'CAS valeur: → branche pour une valeur exacte',
        'AUTRE: → branche par défaut (si aucun CAS ne correspond)',
        'Préférer SELON quand on teste une variable contre des valeurs exactes',
      ]} />
    </div>
  );
};

// selon_imbrique
export const SelonImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="SELON imbriqué — deux niveaux de sélection">
        Un CAS peut contenir d'autres conditions à l'intérieur. Utile pour des logiques à deux niveaux (catégorie + sous-catégorie, type + niveau...).
      </InfoCard>
      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — catégorie + niveau" step={1}>
          <CodeBlock code={lesson.example_code} title="selon_imbrique.bql" onTry={tryCode} />
        </LessonSection>
      )}
      <TipCard>Dans un CAS, utilisez des SI/SINON normaux plutôt qu'un SELON imbriqué si cela suffit. Gardez SELON pour les sélections sur valeurs exactes.</TipCard>
      <SummaryCard items={[
        'Un CAS peut contenir des SI/SINON',
        'Fermer avec FINSI (SI internes) et FINSELON (SELON externe)',
        'Garder une indentation claire pour ne pas se perdre',
      ]} />
    </div>
  );
};

// conditions_combinees
export const ConditionsCombineesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Admission à une école : <strong>avoir {'>'} 12/20 ET {'<'} 3 absences ET avoir rendu son projet</strong>. Si une condition fail, c'est refusé. Les conditions réelles sont rarement simples — elles combinent plusieurs critères.
      </AnalogieCard>

      <InfoCard title="Conditions combinées en pratique">
        En production, les conditions combinent ET, OU et NON. L'ordre d'évaluation (NON {'>'} ET {'>'} OU) est crucial. Les parenthèses permettent de forcer un ordre précis.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Système d'admission avec critères multiples" step={1}>
          <CodeBlock code={lesson.example_code} title="conditions_combinees.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Piège classique">
        <Mono color="#fb7185">SI a = 1 OU b = 1</Mono> signifie "a est 1 OU b est 1".<br />
        <Mono color="#fb7185">SI a OU b = 1</Mono> est ambigu et peut ne pas faire ce que tu penses. Toujours être explicite avec les deux membres de la comparaison.
      </WarningCard>

      <TipCard>
        Pour les conditions complexes, construis-les étape par étape et teste chaque partie séparément avant de les combiner.
      </TipCard>

      <SummaryCard items={[
        'Combiner ET, OU, NON dans une même expression',
        'Priorité : NON > ET > OU',
        'Utiliser des parenthèses pour lever toute ambiguïté',
        'Chaque comparaison doit être explicite : a = 1 ET b = 1',
      ]} />
    </div>
  );
};

// selon_plage
export const SelonPlageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Les tranches d'imposition : <strong>0–10 000€ → 0%</strong>, <strong>10 001–25 000€ → 11%</strong>, etc. Ce ne sont pas des valeurs exactes mais des <em>intervalles</em> — SINON SI est la bonne structure.
      </AnalogieCard>

      <InfoCard title="Tester des plages de valeurs">
        Quand les valeurs possibles forment des <em>intervalles continus</em>, SINON SI en cascade est la bonne approche. SELON ne convient que pour des valeurs exactes.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Mention et IMC — deux classifications par plages" step={1}>
          <CodeBlock code={lesson.example_code} title="selon_plage.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Règle d'or — du plus restrictif au plus général">
        Toujours commencer par la condition la plus restrictive. Si tu testes <Mono color="#facc15">{'note >= 10'}</Mono> avant <Mono color="#facc15">{'note >= 16'}</Mono>, une note de 18 sera classée "Passable" au lieu de "Très bien".
      </TipCard>

      <SummaryCard items={[
        'Pour des intervalles, utiliser SINON SI en cascade (pas SELON)',
        'Ordre du plus restrictif au plus général',
        'Le premier bloc VRAI rencontré est exécuté',
        'SINON sans condition = cas "tout le reste"',
      ]} />
    </div>
  );
};

// ─── NIVEAU 3 ─────────────────────────────────────────────────────────────────

// boucle_intro
export const BoucleIntroRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine devoir écrire 100 fois "Je ne dois pas arriver en retard" au tableau. À la main : 100 lignes. Avec une boucle : 3 lignes de code. Les boucles sont le copier-coller intelligent d'un programmeur.
      </AnalogieCard>

      <InfoCard title="Les boucles — l'art de la répétition intelligente">
        Une boucle <strong>répète automatiquement</strong> un bloc d'instructions. Plutôt que d'écrire la même chose 100 fois, on dit au programme de le faire N fois.
      </InfoCard>

      <WhyCard>
        Imaginer faire une calculatrice sans boucle : afficher les 365 jours d'une année = 365 ECRIRE. Avec une boucle POUR : 3 lignes. C'est l'une des structures les plus puissantes en algorithmique.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Les 3 types de boucles BQL" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {[
            ['POUR', 'Nb de tours connu à l\'avance', '#4f8ff0', 'Ex: 5 fois, de 1 à 100'],
            ['TANTQUE', 'Répète TANT QUE condition vraie', '#a78bfa', 'Ex: tant qu\'il reste de l\'énergie'],
            ['REPETER', 'S\'exécute au moins 1 fois', '#34d399', 'Ex: redemander si saisie invalide'],
          ].map(([n, d, c, ex]) => (
            <div key={n} style={{ background: `${c}0e`, border: `1px solid ${c}33`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ color: c, fontFamily: 'monospace', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>{n}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '0.4rem' }}>{d}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic' }}>{ex}</div>
            </div>
          ))}
        </div>
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="intro_boucle.bql" onTry={tryCode} />}
      </LessonSection>

      <SummaryCard items={[
        'POUR → nombre de tours connu : POUR i DE 1 A n FAIRE',
        'TANTQUE → condition évaluée avant chaque tour',
        'REPETER → exécuté au moins 1 fois, condition vérifiée après',
        'Toutes les boucles nécessitent un point de sortie pour éviter l\'infini',
      ]} />
    </div>
  );
};

// boucle_pour
export const BouclePourRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un chef qui dit à un cuisinier : <strong>"Prépare 50 assiettes, de la numéro 1 à la numéro 50."</strong> Le cuisinier sait exactement combien d'assiettes il doit préparer — c'est une boucle POUR.
      </AnalogieCard>

      <InfoCard title="Boucle POUR — itérations fixes">
        Utilisée quand on connaît <strong>à l'avance</strong> le nombre d'itérations. La variable de boucle est automatiquement incrémentée de 1 à chaque tour.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement pas-à-pas" step={1}>
        <LoopDiagram type="pour" initLabel="i = début" condLabel="i ≤ fin ?" bodyLabel="Corps" updateLabel="i + 1" />
        <LoopExecutionVisualizer start={1} end={5} bodyLabel='ECRIRE(i)' type='pour' />
        <InfoCard color="#c084fc" title="Syntaxe exacte">
          <Mono color="#c084fc">POUR i DE début A fin FAIRE ... FINPOUR</Mono><br />
          La variable <Mono>i</Mono> est incrémentée de 1 automatiquement à chaque tour. Pas besoin de <Mono>i {'<-'} i + 1</Mono>.
        </InfoCard>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — afficher 1, 2, 3" step={2}>
          <CodeBlock code={lesson.example_code} title="boucle_pour.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Exemples d'utilisation typiques" step={3}>
        <CodeBlock code={`// Afficher les pairs de 0 à 10\nPOUR i DE 0 A 10 FAIRE\n  SI i MOD 2 = 0 ALORS\n    ECRIRE(i);\n  FINSI\nFINPOUR`} title="pairs.bql" />
      </LessonSection>

      <WarningCard>Fermer avec <Mono color="#fb7185">FINPOUR</Mono>. Ne pas oublier <Mono color="#fb7185">FAIRE</Mono> après les bornes.</WarningCard>

      <SummaryCard items={[
        'POUR i DE debut A fin FAIRE ... FINPOUR',
        'i est automatiquement incrémenté de 1 à chaque tour',
        'Si debut > fin → la boucle ne s\'exécute pas',
        'Parfait pour parcourir des tableaux ou répéter N fois',
      ]} />
    </div>
  );
};

// boucle_pour_pas
export const BouclePourPasRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Compter de 2 en 2 : 0, 2, 4, 6, 8, 10. Ou un compte à rebours : 10, 8, 6, 4, 2, 0. Avec PAS, on contrôle le "saut" entre chaque valeur de la boucle.
      </AnalogieCard>

      <InfoCard title="POUR avec PAS — incrément personnalisé">
        Par défaut, POUR incrémente de 1. Le mot-clé <Mono color="#4f8ff0">PAS</Mono> permet de définir un incrément différent, positif ou négatif.
      </InfoCard>

      <WhyCard>
        PAS est indispensable pour les patterns numériques courants : multiples, séquences paires/impaires, comptages à rebours, parcours de tableau à l'envers.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Syntaxe avec PAS" step={1}>
        <CodeBlock code={`// Syntaxe\nPOUR i DE debut A fin PAS increment FAIRE\n  // instructions\nFINPOUR\n\n// Exemples d'incréments\nPOUR i DE 0 A 10 PAS 2 FAIRE  // 0,2,4,6,8,10\nPOUR i DE 10 A 0 PAS -1 FAIRE // 10,9,8,7,...,0\nPOUR i DE 0 A 100 PAS 10 FAIRE // 0,10,20,...,100`} title="syntaxe_pas.bql" />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — pairs et compte à rebours" step={2}>
          <CodeBlock code={lesson.example_code} title="pour_pas.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="PAS négatif → début > fin">
        Pour un compte à rebours, le début doit être supérieur à la fin : <Mono color="#34d399">POUR i DE 5 A 1 PAS -1</Mono>.<br />
        Si tu écris <Mono color="#fb7185">POUR i DE 1 A 5 PAS -1</Mono>, la boucle ne s'exécutera jamais.
      </WarningCard>

      <SummaryCard items={[
        'POUR i DE debut A fin PAS incrément FAIRE',
        'PAS positif → comptage ascendant (PAS 2 : 0,2,4,6...)',
        'PAS négatif → compte à rebours (PAS -1 : 5,4,3,2,1)',
        'Quand PAS est négatif, debut doit être > fin',
      ]} />
    </div>
  );
};

// boucle_tantque
export const BoucleTantqueRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un médecin prend des médicaments <strong>tant que</strong> le patient a de la fièvre. Dès que la fièvre tombe, il arrête. Il ne sait pas à l'avance combien de jours ça prendra — c'est une boucle TANTQUE.
      </AnalogieCard>

      <InfoCard title="Boucle TANTQUE — condition avant chaque tour">
        La condition est vérifiée <strong>AVANT</strong> chaque itération. Si elle est fausse dès le départ, la boucle ne s'exécute <em>jamais</em>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement visualisé" step={1}>
        <LoopDiagram type="tantque" initLabel="Init" condLabel="Cond ?" bodyLabel="Corps" updateLabel="Update" />
        <LoopExecutionVisualizer start={1} end={4} bodyLabel="compteur ← compteur + 1" type='tantque' />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="tantque.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="🚨 Boucle infinie !">
        Si vous oubliez de <strong>modifier la variable de condition</strong> dans le corps, vous créez une boucle infinie ! Le programme ne s'arrêtera jamais. Vérifiez toujours qu'il existe un moyen de sortir.
      </WarningCard>

      <TipCard title="Checklist TANTQUE">
        ① Initialiser la variable de condition AVANT la boucle.<br />
        ② Modifier la variable de condition DANS le corps.<br />
        ③ Vérifier que la condition deviendra FAUSSE à un moment.
      </TipCard>

      <SummaryCard items={[
        'TANTQUE condition FAIRE ... FINTANTQUE',
        'Condition vérifiée AVANT chaque tour → possible 0 exécution',
        'Obligatoire : modifier la variable de condition dans le corps',
        'Idéal quand on ne connaît pas le nombre d\'itérations à l\'avance',
      ]} />
    </div>
  );
};

// boucle_repeter
export const BoucleRepeterRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Essayer d'ouvrir une porte : tu essaies d'abord, puis tu regardes si c'est ouvert. Tu essaies AU MOINS UNE FOIS avant de vérifier le résultat — c'est une boucle REPETER.
      </AnalogieCard>

      <InfoCard title="Boucle REPETER — condition après le corps">
        La boucle s'exécute <strong>au moins une fois</strong>. La condition est vérifiée <em>après</em> chaque itération. Elle s'arrête quand la condition devient <strong>VRAIE</strong>.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="repeter.bql" onTry={tryCode} />}

      <LessonSection icon={<Hash size={15} />} title="REPETER vs TANTQUE — la différence clé" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#a78bfa" title="TANTQUE">Condition vérifiée <strong>AVANT</strong> → peut s'exécuter <em>0 fois</em> si la condition est fausse dès le départ.</InfoCard>
          <InfoCard color="#34d399" title="REPETER">Condition vérifiée <strong>APRÈS</strong> → s'exécute <em>toujours au moins 1 fois</em>.</InfoCard>
        </div>
      </LessonSection>

      <WarningCard>
        La logique est inversée : REPETER s'arrête quand la condition devient <strong>VRAIE</strong> (contrairement à TANTQUE qui continue tant que VRAIE).
      </WarningCard>

      <SummaryCard items={[
        "REPETER ... JUSQU'A condition ;",
        'Condition vérifiée APRÈS le corps → au moins 1 exécution garantie',
        "S'arrête quand la condition = VRAI (logique inverse de TANTQUE)",
        "Idéal pour : redemander une saisie, lancer une action au moins 1 fois",
      ]} />
    </div>
  );
};

// boucle_compteur
export const BoucleCompteurRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un compteur de visiteurs à l'entrée d'un musée : il commence à 0, et à chaque visiteur qui entre, il s'incrémente. Un accumulateur de caisse : il commence à 0 et ajoute chaque vente. Ce sont des patterns universels.
      </AnalogieCard>

      <InfoCard title="Compteurs et accumulateurs — les piliers des boucles">
        Un <strong>compteur</strong> compte le nombre d'occurrences d'un événement.<br />
        Un <strong>accumulateur</strong> cumule des valeurs (somme, produit, etc.).<br />
        Les deux s'initialisent à une valeur neutre <em>avant</em> la boucle.
      </InfoCard>

      <WhyCard>
        90% des algorithmes de traitement de données utilisent un compteur ou un accumulateur. Moyenne d'un tableau, nombre de notes au-dessus de 10, somme des ventes — tous ces cas suivent ce pattern.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Valeurs neutres d'initialisation" step={1}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[['Somme', '0', 'Ajouter ne change pas 0', '#4ade80'], ['Produit', '1', 'Multiplier ne change pas 1', '#facc15'], ['Max', 'T[0]', 'Commencer avec la 1ère valeur', '#4f8ff0'], ['Compteur', '0', 'Aucun événement compté encore', '#a78bfa']].map(([n, v, d, c]) => (
            <div key={n} style={{ background: `${c}0e`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '0.7rem', flex: 1, minWidth: '100px' }}>
              <div style={{ color: c, fontWeight: 800, marginBottom: '0.2rem' }}>{n}</div>
              <div style={{ fontFamily: 'monospace', color: c, fontSize: '1.1rem', marginBottom: '0.2rem' }}>← {v}</div>
              <div style={{ fontSize: '0.72rem', color: '#475569' }}>{d}</div>
            </div>
          ))}
        </div>
        <AccumulatorVisualizer values={[3, 7, 2, 8, 5]} varName='somme' operation='+' initVal={0} />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — somme, produit, comptage" step={2}>
          <CodeBlock code={lesson.example_code} title="compteur.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Initialiser AVANT la boucle">
        Si tu initialises l'accumulateur à l'intérieur de la boucle, il sera remis à zéro à chaque tour. L'initialisation se fait <strong>toujours avant</strong> la boucle.
      </WarningCard>

      <SummaryCard items={[
        'Compteur : s\'incrémente à chaque événement (compteur <- compteur + 1)',
        'Accumulateur somme : initialiser à 0, ajouter chaque élément',
        'Accumulateur produit : initialiser à 1, multiplier chaque élément',
        'Toujours initialiser avant la boucle, jamais à l\'intérieur',
      ]} />
    </div>
  );
};

// boucle_imbrique
export const BoucleImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une horloge : l'aiguille des minutes fait un tour complet (60 secondes) pour chaque chiffre de l'aiguille des heures. Pour 12 heures → 12 tours × 60 minutes = 720 tours des minutes. C'est N × M itérations.
      </AnalogieCard>

      <InfoCard title="Boucles imbriquées — boucle dans une boucle">
        On place une boucle à l'intérieur d'une autre. La boucle <em>interne</em> s'exécute <strong>complètement</strong> à chaque tour de la boucle externe.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — table de multiplication partielle" step={1}>
          <CodeBlock code={lesson.example_code} title="boucles_imbriquees.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Comptage des itérations" step={2}>
        <InfoCard color="#4f8ff0" title="N × M itérations">
          Pour une boucle externe de taille N et interne de taille M :<br />
          <Mono color="#4f8ff0">Total = N × M itérations</Mono><br />
          Ex: externe 3 tours × interne 4 tours = 12 appels au corps interne.
        </InfoCard>
      </LessonSection>

      <TipCard>
        Utilise <Mono color="#facc15">i</Mono> pour la boucle externe, <Mono color="#facc15">j</Mono> pour l'interne. Ne jamais réutiliser le même nom dans les deux boucles !
      </TipCard>

      <SummaryCard items={[
        'La boucle interne s\'exécute entièrement par tour de la boucle externe',
        'N × M itérations totales pour boucles de taille N et M',
        'Variables différentes pour chaque niveau (i, j, k...)',
        'Indispensable pour parcourir des matrices 2D',
      ]} />
    </div>
  );
};

// boucle_recherche
export const BoucleRechercheRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Chercher un livre dans une bibliothèque sans catalogage : tu regardes chaque livre l'un après l'autre jusqu'à trouver le bon, ou jusqu'à avoir regardé tous les rayons. C'est la recherche séquentielle.
      </AnalogieCard>

      <InfoCard title="Recherche séquentielle — algorithme fondamental">
        La recherche séquentielle parcourt une séquence <em>élément par élément</em> jusqu'à trouver la valeur cherchée ou atteindre la fin.
      </InfoCard>

      <WhyCard>
        C'est l'algorithme de recherche le plus simple. Pas besoin que les données soient triées. Compris une fois, il s'applique à des tableaux, des listes, des fichiers...
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Pattern de recherche avec booléen" step={1}>
        <StepByStep steps={[
          { label: 'Initialiser', desc: 'trouve <- FAUX avant la boucle.' },
          { label: 'Parcourir', desc: 'POUR i DE 1 A n FAIRE pour tester chaque valeur.' },
          { label: 'Tester', desc: 'SI valeur[i] = cible ALORS trouve <- VRAI' },
          { label: 'Résultat', desc: 'Après la boucle, SI trouve ALORS → trouvé, SINON → absent.' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="recherche.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Optimisation">
        Pour des tableaux triés, on peut arrêter la recherche dès qu'on dépasse la cible. Mais pour débuter, la recherche complète est plus simple.
      </TipCard>

      <SummaryCard items={[
        'Initialiser trouve <- FAUX avant la boucle',
        'Comparer chaque élément avec la cible dans la boucle',
        'Mettre trouve <- VRAI quand trouvé',
        'Vérifier trouve après la boucle pour connaître le résultat',
      ]} />
    </div>
  );
};

// boucle_validation
export const BoucleValidationRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un guichet automatique : il te demande ton PIN, et si c'est faux, il te redemande. Il ne te laisse pas passer tant que le PIN est incorrect. C'est une boucle de validation.
      </AnalogieCard>

      <InfoCard title="Validation de saisie — pattern essentiel">
        On utilise une boucle TANTQUE pour redemander une saisie tant qu'elle est invalide. C'est un pattern fondamental pour les applications robustes qui ne plantent pas sur une mauvaise entrée.
      </InfoCard>

      <StepByStep steps={[
        { label: 'Première saisie', desc: 'LIRE(variable) avant la boucle pour obtenir une première valeur.' },
        { label: 'Condition de validation', desc: 'TANTQUE la valeur est INVALIDE FAIRE (ex: \u003c 0 OU \u003e 20).' },
        { label: 'Message d\'erreur', desc: 'ECRIRE("Valeur invalide !") pour guider l\'utilisateur.' },
        { label: 'Re-saisie', desc: 'LIRE(variable) à nouveau dans la boucle.' },
        { label: 'Valeur validée', desc: 'À la sortie de la boucle, la valeur est garantie valide.' },
      ]} />

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple — validation de note et d'âge" step={1}>
          <CodeBlock code={lesson.example_code} title="validation.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Toujours LIRE avant la boucle">
        Il faut faire un premier LIRE <em>avant</em> la boucle TANTQUE, sinon la variable est non-initialisée quand la condition est vérifiée pour la première fois.
      </TipCard>

      <SummaryCard items={[
        'LIRE une première fois avant la boucle',
        'TANTQUE valeur_invalide FAIRE → redemander',
        'À la sortie, la valeur est garantie valide',
        'Pattern essentiel pour des applications robustes',
      ]} />
    </div>
  );
};

// ─── NIVEAU 4 ─────────────────────────────────────────────────────────────────

// tableau
export const TableauRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine une <strong>boîte aux lettres avec des casiers numérotés</strong>. Chaque casier a un numéro (l'indice) et peut contenir une lettre (la valeur). Le tableau c'est ça : plusieurs valeurs du même type dans des cases numérotées.
      </AnalogieCard>

      <InfoCard icon={<Layers size={17} />} title="Définition" color="#4f8ff0">
        Un <strong>tableau</strong> stocke plusieurs valeurs du même type dans des cases numérotées. Les indices commencent à <strong>0</strong>. On déclare : <Mono>Tableau Nom[taille] : TYPE</Mono>.
      </InfoCard>

      <WhyCard>
        Sans tableau, stocker 100 valeurs = 100 variables. Est-ce que tu écrirais <Mono color="#fb7185">note1, note2, ..., note100</Mono> ? Avec un tableau : <Mono color="#34d399">Tableau notes[100] : ENTIER</Mono> — une ligne.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Représentation visuelle — tableau T[3]" step={1}>
        <TableauDiagram values={[10, 20, 30]} name="T" color="#4f8ff0" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="tableau.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Les indices commencent à 0, pas à 1 !">
        Tableau T[3] → les indices valides sont T[0], T[1], T[2].<br />
        Accéder à T[3] est une <strong>erreur d'indice hors limites</strong>.
      </WarningCard>

      <SummaryCard items={[
        'Tableau Nom[taille] : TYPE → déclare un tableau',
        'T[0] = premier élément, T[n-1] = dernier élément',
        'Tous les éléments doivent être du même type',
        'On accède à une case avec Nom[indice]',
      ]} />
    </div>
  );
};

// tableau_init
export const TableauInitRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Avant de ranger des affaires dans un tiroir, tu le vides et l'organises. Initialiser un tableau c'est pareil : on donne une valeur de départ propre à chaque case avant de l'utiliser.
      </AnalogieCard>

      <InfoCard title="Initialisation — bonne pratique obligatoire">
        Toujours initialiser un tableau avant de lire ses valeurs. Une case non initialisée contient une valeur arbitraire (garbage value) — source de bugs difficiles à déboguer.
      </InfoCard>

      <WhyCard>
        Initialiser avec une boucle POUR au lieu de case par case permet de gérer des tableaux de n'importe quelle taille avec le même code de 3 lignes.
      </WhyCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Initialiser un tableau à 0, puis modifier certaines cases" step={1}>
          <CodeBlock code={lesson.example_code} title="tab_init.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Pattern d'initialisation universelle">
        <code style={{ fontFamily: 'monospace', color: '#4ade80', display: 'block', lineHeight: '1.8' }}>
          POUR i DE 0 A taille-1 FAIRE<br />
          &nbsp;&nbsp;T[i] {'<-'} 0; // ou -1, "" selon le type<br />
          FINPOUR
        </code>
      </TipCard>

      <SummaryCard items={[
        'Toujours initialiser avant de lire',
        'POUR i DE 0 A taille-1 FAIRE T[i] <- valeur_neutre;',
        'Valeur neutre typique : 0 pour ENTIER/REEL, "" pour CHAINE',
        'Permet de détecter les cases non modifiées dans la logique',
      ]} />
    </div>
  );
};

// tableau_parcours
export const TableauParcoursRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Parcours de tableau — POUR + indice">
        La boucle POUR est le partenaire naturel des tableaux. La variable de boucle sert d'indice : <Mono color="#4f8ff0">T[i]</Mono> accède à la case i.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Visualisation du parcours" step={1}>
        <TableauDiagram values={[12, 15, 9, 18]} name="notes" color="#34d399" />
        <ArrayTraversalVisualizer array={[12, 15, 9, 18]} name="notes" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="parcours.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard>Pour un tableau de taille n : <Mono color="#facc15">POUR i DE 0 A n-1 FAIRE</Mono>. L'indice max = taille - 1 (jamais taille).</TipCard>

      <SummaryCard items={[
        'POUR i DE 0 A n-1 → parcourt tous les éléments',
        'T[i] accède à l\'élément à l\'indice i',
        'Parfait pour afficher, modifier ou chercher dans un tableau',
      ]} />
    </div>
  );
};

// tableau_somme
export const TableauSommeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un professeur qui calcule la moyenne de sa classe : il additionne toutes les notes une par une, puis divise par le nombre d'élèves. L'accumulateur de somme est l'outil de base de toute statistique.
      </AnalogieCard>

      <InfoCard title="Somme et moyenne d'un tableau">
        On utilise un <strong>accumulateur</strong> initialisé à 0 pour calculer la somme. La moyenne est la somme divisée par la taille du tableau.
      </InfoCard>

      <StepByStep steps={[
        { label: 'Déclarer', desc: 'somme : ENTIER; moyenne : REEL;' },
        { label: 'Initialiser', desc: 'somme <- 0; avant la boucle.' },
        { label: 'Parcourir', desc: 'POUR i DE 0 A n-1 FAIRE' },
        { label: 'Accumuler', desc: 'somme <- somme + T[i];' },
        { label: 'Calculer', desc: 'moyenne <- somme / n; après la boucle.' },
      ]} />
      <ArraySumVisualizer array={[5, 3, 8, 2, 6]} name="T" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="somme_moyenne.bql" onTry={tryCode} />}

      <WarningCard title="Division entière vs réelle">
        Si <Mono color="#fb7185">somme</Mono> est ENTIER, <Mono color="#fb7185">somme / 5</Mono> donnera un entier. Déclare <Mono color="#34d399">moyenne : REEL</Mono> et assure-toi que la division produit bien un réel.
      </WarningCard>

      <SummaryCard items={[
        'Accumulateur somme : initialiser à 0, somme <- somme + T[i]',
        'Calculer la moyenne APRÈS la boucle : moyenne <- somme / n',
        'Déclarer moyenne en REEL pour les décimales',
        'Pattern réutilisable pour tout type de cumul',
      ]} />
    </div>
  );
};

// tableau_max_min
export const TableauMaxMinRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un arbitre qui observe une course pour trouver le plus rapide : il retient le record actuel et dès qu'un coureur fait mieux, il met le record à jour. À la fin, il annonce le champion.
      </AnalogieCard>

      <InfoCard title="Trouver le maximum et le minimum">
        On suppose que le premier élément est le max/min, puis on compare chaque élément suivant. Si on trouve mieux, on met à jour. On retient aussi l'indice pour savoir <em>où</em> se trouve la valeur.
      </InfoCard>

      <StepByStep steps={[
        { label: 'Initialiser', desc: 'max <- T[0]; indice_max <- 0; (commencer avec la première valeur)' },
        { label: 'Parcourir', desc: 'POUR i DE 1 A n-1 FAIRE (commencer à 1, on a déjà traité 0)' },
        { label: 'Comparer', desc: 'SI T[i] > max ALORS max <- T[i]; indice_max <- i; FINSI' },
        { label: 'Résultat', desc: 'Après la boucle, max contient la valeur, indice_max sa position' },
      ]} />
      <ArrayMaxMinVisualizer array={[12, 5, 8, 17, 3, 9]} name="T" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="max_min.bql" onTry={tryCode} />}

      <TipCard>Pour chercher le MIN en même temps que le MAX, ajoute un deuxième SI dans la même boucle. Un seul parcours suffit pour les deux !</TipCard>

      <SummaryCard items={[
        'Initialiser max/min avec T[0] (première valeur)',
        'Parcourir de 1 à n-1 (la case 0 est déjà la référence)',
        'Mettre à jour max et indice_max dès qu\'on trouve plus grand',
        'Pattern identique pour min (changer > en <)',
      ]} />
    </div>
  );
};

// tableau_recherche
export const TableauRechercheRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Chercher un contact dans un carnet téléphonique non trié : on parcourt page par page jusqu'à trouver le nom. On mémorise la page (l'indice), ou on dit "non trouvé" si on arrive à la fin.
      </AnalogieCard>

      <InfoCard title="Recherche dans un tableau">
        La recherche séquentielle dans un tableau parcourt case par case et compare chaque valeur à la cible. On stocke l'indice trouvé (-1 si absent).
      </InfoCard>
      <ArraySearchVisualizer array={[12, 5, 8, 17, 3, 9]} target={17} name="T" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="recherche_tableau.bql" onTry={tryCode} />}

      <TipCard title="Retourner -1 pour 'non trouvé'">
        La convention universelle est d'initialiser <Mono color="#facc15">indice {'<-'} -1</Mono>. Si après la boucle indice vaut encore -1, la valeur est absente.
      </TipCard>

      <SummaryCard items={[
        'Initialiser indice <- -1 (valeur sentinelle)',
        'Parcourir de 0 à n-1 et comparer T[i] = cible',
        'Si trouvé : indice <- i',
        'Après la boucle : SI indice <> -1 → trouvé, SINON → absent',
      ]} />
    </div>
  );
};

// tableau_insertion
export const TableauInsertionRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Modification d'éléments dans un tableau">
        Modifier un élément se fait par simple affectation : <Mono>T[i] {'<-'} nouvelle_valeur</Mono>. On peut aussi remplir un tableau programmatiquement avec une boucle.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tab_modif.bql" onTry={tryCode} />}

      <TipCard>Pour remplir un tableau avec des valeurs calculées, utilise la variable de boucle i dans la formule : <Mono color="#facc15">T[i] {'<-'} (i + 1) * 3</Mono> → 3, 6, 9, 12, 15.</TipCard>

      <SummaryCard items={[
        'T[i] <- valeur modifie l\'élément à l\'indice i',
        'Remplissage programmatique : POUR i DE 0 A n-1 FAIRE T[i] <- formule(i);',
        'L\'indice doit être dans les bornes [0, taille-1]',
      ]} />
    </div>
  );
};

// tableau_copie
export const TableauCopieRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Photocopier un document : chaque page est copiée une par une. Modifier la photocopie ne change pas l'original. En BQL, copier un tableau = copier chaque case avec une boucle.
      </AnalogieCard>

      <InfoCard title="Copier un tableau — case par case">
        En BQL, on ne peut pas écrire <Mono color="#fb7185">B {'<-'} A</Mono> pour copier un tableau. Il faut recopier chaque élément un par un avec une boucle POUR. Après copie, les deux tableaux sont <em>indépendants</em>.
      </InfoCard>
      <ArrayCopyVisualizer arrayA={[12, 19, 5, 8, 22]} nameA="A" nameB="B" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tab_copie.bql" onTry={tryCode} />}

      <WarningCard title="Pas de copie directe">
        <Mono color="#fb7185">B {'<-'} A</Mono> est INVALIDE pour les tableaux en BQL. Toujours utiliser une boucle.
      </WarningCard>

      <SummaryCard items={[
        'Copier case par case : POUR i DE 0 A n-1 FAIRE B[i] <- A[i];',
        'Les deux tableaux sont indépendants après copie',
        'Modifier B ne change pas A et inversement',
      ]} />
    </div>
  );
};

// tableau_tri
export const TableauTriRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Des cartes à jouer en désordre. Tu les tries en comparant des paires adjacentes : si la carte de gauche est plus grande que celle de droite, tu les échanges. Tu répètes jusqu'à ce que plus rien ne soit à échanger. C'est le tri à bulles.
      </AnalogieCard>

      <InfoCard title="Tri à bulles — l'algorithme de tri le plus simple">
        Compare des paires d'éléments adjacents et les échange si dans le mauvais ordre. Répéter N fois pour un tableau de taille N garantit le tri.
      </InfoCard>

      <WhyCard>
        Le tri est l'une des opérations les plus fondamentales en informatique. Le tri à bulles n'est pas le plus efficace, mais il est le plus intuitif et le meilleur pour apprendre le principe.
      </WhyCard>

      <StepByStep steps={[
        { label: 'Boucle externe', desc: 'POUR i DE 0 A n-2 FAIRE — n-1 passes au total.' },
        { label: 'Boucle interne', desc: 'POUR j DE 0 A n-2 FAIRE — compare les pairs adjacents.' },
        { label: 'Comparer', desc: 'SI T[j] > T[j+1] ALORS — est-ce dans le mauvais ordre ?' },
        { label: 'Échanger', desc: 'temp <- T[j]; T[j] <- T[j+1]; T[j+1] <- temp; (3 lignes obligatoires)' },
      ]} />
      <BubbleSortVisualizer array={[5, 3, 8, 1, 9, 2]} name="T" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tri_bulles.bql" onTry={tryCode} />}

      <TipCard title="L'échange nécessite une variable temporaire">
        Pour échanger A et B, il faut temp (<Mono color="#facc15">temp {'<-'} A; A {'<-'} B; B {'<-'} temp</Mono>). Sans temp, l'une des valeurs est perdue !
      </TipCard>

      <SummaryCard items={[
        'Deux boucles imbriquées : externe (passes) × interne (comparaisons)',
        'Comparer T[j] et T[j+1], échanger si T[j] > T[j+1]',
        'Échange en 3 étapes : temp <- T[j]; T[j] <- T[j+1]; T[j+1] <- temp;',
        'Après n-1 passes, le tableau est trié en ordre croissant',
      ]} />
    </div>
  );
};

// ─── NIVEAU 5 ─────────────────────────────────────────────────────────────────

// matrice
export const MatriceRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un tableau de bord Excel avec des lignes et des colonnes. Chaque cellule est identifiée par sa ligne ET sa colonne : B3, C7... Une matrice c'est exactement ça, mais appelée M[ligne, colonne].
      </AnalogieCard>

      <InfoCard title="Matrice — tableau à deux dimensions">
        Une matrice stocke des valeurs dans un tableau <strong>lignes × colonnes</strong>. Déclaration : <Mono>Tableau M[L, C] : TYPE</Mono>. Accès : <Mono>M[i, j]</Mono> où i = ligne, j = colonne.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Représentation visuelle" step={1}>
        <MatriceDiagram matrix={[[1,2,3],[4,5,6]]} name="M" color="#a78bfa" />
        
        <div style={{ padding: '0.8rem', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', marginBottom: '1rem', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#facc15', fontSize: '0.9rem' }}>📌 Différence de syntaxe avec d'autres langages</h4>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Dans beaucoup de langages (C, Java, JavaScript), on accède à une matrice avec deux paires de crochets : <strong style={{ color: '#fb7185' }}>M[i][j]</strong>.<br/>
            En <strong>BQL</strong>, on les sépare par une virgule dans la même paire : <strong style={{ color: '#34d399' }}>M[i, j]</strong>.
          </div>
        </div>

        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice.bql" onTry={tryCode} />}
      </LessonSection>

      <SummaryCard items={[
        'Tableau M[L, C] : TYPE',
        'M[i, j] → ligne i, colonne j (indices 0-based)',
        'Déclaration : Tableau M[2, 3] : ENTIER (2 lignes, 3 colonnes)',
      ]} />
    </div>
  );
};

// matrice_init
export const MatriceInitRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Préparer une grille vierge pour un jeu de morpion : on remplit d'abord toutes les cases avec un espace vide, puis on joue. La matrice identité (1 sur la diagonale) est un autre cas d'initialisation structurée.
      </AnalogieCard>

      <InfoCard title="Initialisation d'une matrice">
        Deux boucles imbriquées parcourent toutes les cellules. La diagonale principale se reconnaît à <Mono>i = j</Mono> : une seule boucle POUR suffit pour la traiter.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mat_init.bql" onTry={tryCode} />}

      <LessonSection icon={<Hash size={15} />} title="Patterns d'initialisation" step={1}>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          {[['Tout à 0', 'M[i, j] <- 0;', '#4f8ff0'], ['Identité', 'SI i=j ALORS M[i, j]<-1 SINON M[i, j]<-0', '#34d399'], ['i+j', 'M[i, j] <- i + j;', '#facc15']].map(([n, c, col]) => (
            <div key={n} style={{ flex: 1, minWidth: '150px', background: `${col}0a`, border: `1px solid ${col}25`, borderRadius: '10px', padding: '0.7rem' }}>
              <div style={{ color: col, fontWeight: 800, marginBottom: '0.3rem', fontSize: '0.85rem' }}>{n}</div>
              <code style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>{c}</code>
            </div>
          ))}
        </div>
      </LessonSection>

      <SummaryCard items={[
        'Double boucle pour initialiser toutes les cellules',
        'Diagonale principale : M[i, i] — une seule boucle suffit',
        'Matrice identité : 1 sur la diagonale, 0 ailleurs',
      ]} />
    </div>
  );
};

// matrice_parcours
export const MatriceParcoursRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Double boucle — parcours complet d'une matrice">
        Boucle externe → lignes (i). Boucle interne → colonnes (j). Chaque paire (i, j) correspond à une cellule M[i, j].
      </InfoCard>
      <LessonSection icon={<Code2 size={15} />} title="Parcours et visualisation" step={1}>
        <MatriceDiagram matrix={[[1,2,3],[4,5,6],[7,8,9]]} name="M" color="#a78bfa" />
        <MatrixTraversalVisualizer matrix={[[1,2,3],[4,5,6],[7,8,9]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="parcours_matrice.bql" onTry={tryCode} />}
      </LessonSection>
      <TipCard>Pour M[i, j] : <Mono color="#facc15">i DE 0 A L-1</Mono> (lignes) et <Mono color="#facc15">j DE 0 A C-1</Mono> (colonnes).</TipCard>
      <SummaryCard items={['Double POUR : i (lignes) × j (colonnes)', 'L×C itérations totales', 'M[i, j] → ligne i, colonne j']} />
    </div>
  );
};

// matrice_somme
export const MatriceSommeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Somme de tous les éléments d'une matrice">
        Même pattern que pour un tableau 1D, mais avec deux boucles imbriquées. L'accumulateur s'incrémente de M[i, j] à chaque itération intérieure.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mat_somme.bql" onTry={tryCode} />}
      <StepByStep steps={[
        { label: 'Initialiser', desc: 'somme <- 0; avant les deux boucles.' },
        { label: 'Boucle externe', desc: 'POUR i DE 0 A L-1 FAIRE — lignes.' },
        { label: 'Boucle interne', desc: 'POUR j DE 0 A C-1 FAIRE — colonnes.' },
        { label: 'Accumuler', desc: 'somme <- somme + M[i, j];' },
        { label: 'Résultat', desc: 'ECRIRE(somme) après les deux FINPOUR.' },
      ]} />
      <SummaryCard items={['Accumulateur initialisé à 0 avant les deux boucles', 'somme <- somme + M[i, j]; dans la boucle interne', 'Total = somme de toutes les L×C cellules']} />
    </div>
  );
};

// matrice_diagonale
export const MatriceDiagonaleRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Dans une table de multiplication, la diagonale est le carré des nombres : 1, 4, 9, 16... C'est toujours là où ligne = colonne. Une propriété mathématique puissante des matrices carrées.
      </AnalogieCard>
      <InfoCard title="Diagonale principale — propriété des matrices carrées">
        La diagonale principale contient les éléments <Mono color="#a78bfa">M[i, j]</Mono> (même indice de ligne et colonne). Un seul POUR suffit pour la parcourir.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="diagonale.bql" onTry={tryCode} />}
      <TipCard>Pour une matrice N×N, la diagonale a exactement N éléments. Une seule boucle POUR i DE 0 A N-1 suffit.</TipCard>
      <SummaryCard items={['Diagonale principale : M[i, i] — ligne i = colonne i', 'Un seul POUR suffit (pas de boucle imbriquée)', 'Uniquement pour les matrices carrées (L = C)']} />
    </div>
  );
};

// matrice_ligne_col
export const MatriceLigneColRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Somme d'une ligne ou d'une colonne">
        Pour la somme de la ligne i : parcourir j de 0 à C-1, sommer M[i, j].<br />
        Pour la somme de la colonne j : parcourir i de 0 à L-1, sommer M[i, j].
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="ligne_col.bql" onTry={tryCode} />}
      <LessonSection icon={<Hash size={15} />} title="Visualisation — ligne vs colonne" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#4f8ff0" title="Somme ligne i">POUR j DE 0 A C-1 FAIRE<br />somme {'<-'} somme + M[i, j]</InfoCard>
          <InfoCard color="#34d399" title="Somme colonne j">POUR i DE 0 A L-1 FAIRE<br />somme {'<-'} somme + M[i, j]</InfoCard>
        </div>
      </LessonSection>
      <SummaryCard items={['Somme ligne i : fixer i, parcourir j (colonnes)', 'Somme colonne j : fixer j, parcourir i (lignes)', 'Un seul POUR dans les deux cas']} />
    </div>
  );
};

// matrice_max
export const MatriceMaxRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Maximum dans une matrice">
        Même logique que pour un tableau 1D, mais avec deux boucles. Initialiser avec M[i, j], puis comparer toutes les cellules.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mat_max.bql" onTry={tryCode} />}
      <TipCard>On retient les indices (lig_max, col_max) en même temps que la valeur max pour savoir exactement où se trouve le maximum.</TipCard>
      <SummaryCard items={['Initialiser max <- M[0, 0]; lig_max <- 0; col_max <- 0;', 'Double boucle pour parcourir toutes les cellules', 'Mettre à jour max et ses indices dès qu\'on trouve plus grand']} />
    </div>
  );
};

// matrice_symetrie
export const MatriceSymetrieRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un miroir : ce qui est à gauche est le reflet de ce qui est à droite. Une matrice symétrique est son propre "miroir" diagonal : M[i, j] = M[i, j].
      </AnalogieCard>
      <InfoCard title="Symétrie — M[i, j] = M[j, i]">
        Une matrice carrée est symétrique si chaque élément de la partie triangulaire supérieure est égal à son correspondant dans la partie inférieure.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="symetrie.bql" onTry={tryCode} />}
      <TipCard>Dès qu'on trouve UN élément qui n'est pas symétrique, on peut mettre <Mono color="#fb7185">symetrique {'<-'} FAUX</Mono> et sortir (ou continuer jusqu'à la fin).</TipCard>
      <SummaryCard items={['Matrice symétrique : M[i, j] = M[j, i] pour tout i, j', 'vérifier toutes les paires (i,j) avec double boucle', 'Un seul écart suffit à invalider la symétrie']} />
    </div>
  );
};

// matrice_transposee
export const MatriceTransposeeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Retourner une image : les colonnes deviennent des lignes et les lignes deviennent des colonnes. La transposée d'une matrice 2×3 est une matrice 3×2.
      </AnalogieCard>
      <InfoCard title="Transposée — lignes ⇄ colonnes">
        La transposée de M[i, j] est une matrice M[i, j] où <Mono>M[i, j] = M[i, j]</Mono>. Les dimensions sont inversées.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="transposee.bql" onTry={tryCode} />}
      <SummaryCard items={['M[i, j] = M[i, j] — inverser les indices', 'M[i, j] → M[i, j] (dimensions échangées)', 'Double boucle sur la matrice originale pour remplir la transposée']} />
    </div>
  );
};

// ─── NIVEAU 6 ─────────────────────────────────────────────────────────────────

// struct
export const StructRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une fiche de contact : elle rassemble le nom, le prénom, le téléphone et l'email — des types différents pour une seule personne. En BQL, un enregistrement c'est ça : plusieurs variables de types différents sous un même nom.
      </AnalogieCard>

      <InfoCard title="TYPE ENREGISTREMENT — regrouper des données hétérogènes">
        Un <strong>enregistrement</strong> regroupe plusieurs variables de <em>types différents</em> sous un même nom. On le définit avec <Mono>TYPE...ENREGISTREMENT...FIN</Mono>, puis on l'instancie avec une variable.
      </InfoCard>

      <WhyCard>
        Sans enregistrement, modéliser une personne = 3 variables de noms différents. Avec 50 personnes = 150 variables. Avec un enregistrement Personne et un tableau : 3 lignes de déclaration.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure TYPE et accès aux champs" step={1}>
        <RecordVisualizer 
          typeName="Etudiant"
          varName="e"
          fields={[
            { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
            { name: 'age', type: 'ENTIER', value: '25', color: '#facc15' },
            { name: 'moyenne', type: 'REEL', value: '17.5', color: '#4f8ff0' }
          ]}
        />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard>Accès aux champs : <Mono color="#facc15">e.nom</Mono>, <Mono color="#facc15">e.age</Mono>. La notation pointée est obligatoire — <Mono color="#fb7185">nom</Mono> seul n'existe pas.</TipCard>

      <SummaryCard items={[
        'TYPE Nom = ENREGISTREMENT ... FIN Nom',
        'Les champs peuvent être de types différents',
        'Accès via notation pointée : variable.champ',
        'Déclarer : p : Personne; (comme n\'importe quelle variable)',
      ]} />
    </div>
  );
};

// struct_champs
export const StructChampsRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Utiliser les champs dans des expressions et conditions">
        Les champs d'un enregistrement se comportent comme des variables normales. On peut les utiliser dans des calculs, des conditions SI, des ECRIRE.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_champs.bql" onTry={tryCode} />}
      <TipCard>On peut affecter un champ à partir d'une condition : <Mono color="#facc15">e.admis {'<-'} (e.note {'>='} 10)</Mono> n'est pas valide en BQL basique — utilisez un SI.</TipCard>
      <SummaryCard items={['e.note >= 10 → comparer un champ', 'e.admis <- VRAI → modifier un champ booléen', 'ECRIRE(e.nom, " : ", e.note) → afficher plusieurs champs']} />
    </div>
  );
};

// struct_modification
export const StructModificationRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un compte bancaire : après chaque opération (dépôt, retrait), le solde est mis à jour. L'enregistrement représente parfaitement cet objet dont l'état évolue.
      </AnalogieCard>
      <InfoCard title="Modifier les champs d'un enregistrement">
        Un champ se modifie comme une variable normale : <Mono>c.solde {'<-'} c.solde + 500.0</Mono>. On peut calculer de nouvelles valeurs à partir des champs existants.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_modif.bql" onTry={tryCode} />}
      <SummaryCard items={['c.solde <- c.solde + 500.0 → modifier avec calcul', 'c.transactions <- c.transactions + 1 → compteur', 'Les champs d\'un enregistrement sont muables']} />
    </div>
  );
};

// struct_affichage
export const StructAffichageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Affichage formaté des données d'un enregistrement">
        On affiche chaque champ séparément avec ECRIRE. On peut enrichir l'affichage avec des conditions (disponible/indisponible, premium/économique).
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_affichage.bql" onTry={tryCode} />}
      <TipCard>Utiliser des séparateurs visuels comme <Mono color="#facc15">ECRIRE("=== Fiche ===")</Mono> rend l'affichage plus lisible dans le terminal.</TipCard>
      <SummaryCard items={['Afficher chaque champ avec ECRIRE(p.champ)', 'Combiner champs et texte : ECRIRE("Prix : ", p.prix, " euros")', 'Enrichir avec des conditions sur les champs']} />
    </div>
  );
};

// struct_tableau
export const StructTableauRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un tableau de bord de classe : chaque ligne est un élève (fiche) et chaque colonne est un attribut (nom, note, mention). En BQL : un tableau d'enregistrements.
      </AnalogieCard>
      <InfoCard title="Tableau d'enregistrements — base de données en mémoire">
        On combine tableau et enregistrement : <Mono>Tableau classe[30] : Eleve</Mono>. Chaque case contient un enregistrement complet. Accès : <Mono>classe[i].champ</Mono>.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tableau_structs.bql" onTry={tryCode} />}
      <TipCard>Pattern ultra-courant en algorithmique : tableau de structs + POUR pour traiter chaque enregistrement.</TipCard>
      <SummaryCard items={['Tableau classe[n] : Eleve → déclarer un tableau de structs', 'classe[i].nom → accéder au champ d\'un élément', 'POUR i DE 0 A n-1 FAIRE → traiter tous les enregistrements']} />
    </div>
  );
};

// struct_recherche
export const StructRechercheRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Recherche du meilleur dans un tableau de structs">
        Chercher le joueur avec le score le plus élevé : on retient l'indice du meilleur dans un tableau d'enregistrements, puis on affiche tous ses champs.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_recherche.bql" onTry={tryCode} />}
      <TipCard>On retient l'<strong>indice</strong> du meilleur (pas la valeur isolée). Ainsi, après la recherche, on peut accéder à tous ses champs : <Mono color="#facc15">eleves[meilleur].nom</Mono>, <Mono color="#facc15">eleves[meilleur].note</Mono>.</TipCard>
      <SummaryCard items={['Initialiser meilleur <- 0 (indice du premier)', 'Comparer T[i].champ > T[meilleur].champ', 'Mettre à jour meilleur <- i si nouveau maximum', 'À la fin, T[meilleur] donne accès à tous les champs']} />
    </div>
  );
};

// struct_comparaison
export const StructComparaisonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Comparer deux enregistrements — champ par champ">
        En BQL, on ne compare pas deux enregistrements directement. On calcule des valeurs dérivées de leurs champs (aire, total, score) et on les compare.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_comp.bql" onTry={tryCode} />}
      <WarningCard title="Pas de comparaison directe">
        <Mono color="#fb7185">SI r1 = r2 ALORS</Mono> est invalide pour les enregistrements. Il faut comparer champ par champ : <Mono color="#34d399">SI r1.largeur = r2.largeur ET r1.hauteur = r2.hauteur ALORS</Mono>.
      </WarningCard>
      <SummaryCard items={['Calculer des valeurs dérivées : aire = r1.largeur * r1.hauteur', 'Comparer les valeurs calculées, pas les enregistrements directement', 'Comparer champ par champ pour tester l\'égalité complète']} />
    </div>
  );
};

// struct_complexe
export const StructComplexeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Dans la vraie vie, une fiche d'employé contient l'identité ET l'adresse ET le poste. On peut modéliser chaque concept séparément avec son propre TYPE puis les utiliser ensemble.
      </AnalogieCard>
      <InfoCard title="Plusieurs types liés — vers la modélisation réelle">
        On peut définir plusieurs types d'enregistrements et les utiliser ensemble dans un même algorithme. Chaque type modélise un concept du monde réel.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="struct_complexe.bql" onTry={tryCode} />}
      <TipCard title="Conception objet">
        Diviser les données en types cohérents (Adresse, Personne, Compte) est le début de la <em>programmation orientée objet</em>. Les TYPES BQL en sont la version algorithmique.
      </TipCard>
      <SummaryCard items={['Définir plusieurs TYPEs dans le même algorithme', 'Chaque TYPE = un concept distinct du problème', 'Les TYPEs s\'utilisent ensemble pour modéliser des réalités complexes']} />
    </div>
  );
};

// ─── Exercice ─────────────────────────────────────────────────────────────────

export const ExerciceRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1.2rem', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.6rem' }}>🎯</div>
        <h2 style={{ color: '#e4e7ec', margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.6rem' }}>Défi final du niveau !</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Prouvez que vous maîtrisez ce niveau en réussissant l'exercice ci-dessous.</p>
      </div>
      {paragraphs.map((p, i) => <P key={i}>{p}</P>)}
      <ExerciseBlock text={lesson.exercise || lesson.content} code={lesson.example_code} onTry={tryCode} />
    </div>
  );
};

// ─── Challenge Final ─────────────────────────────────────────────────────────

export const ChallengeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1.2rem', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.4)', color: '#facc15', padding: '5px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)' }}>
          <Target size={14} /> Défi Final de Niveau
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>{lesson.title.replace('Défi Final : ', '')}</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Prouvez que vous maîtrisez ce niveau en réussissant ce défi.</p>
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(255, 255, 255, 0.02))', 
        border: '1px solid rgba(250, 204, 21, 0.3)', 
        borderRadius: '16px', 
        padding: '2rem', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15), transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.15)', borderRadius: '10px', padding: '0.5rem', color: '#facc15' }}><Target size={20} /></div>
            <div>
              <div style={{ fontWeight: 800, color: '#e4e7ec', fontSize: '1.2rem' }}>Objectif du Défi</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '100px', padding: '0.35rem 0.85rem', color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
            <Zap size={14} fill="currentColor" /> +100 XP
          </div>
        </div>

        {paragraphs.map((p, i) => <P key={i} mt="0">{p}</P>)}

        {lesson.exercise && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', borderLeft: '3px solid #facc15' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Consignes :</div>
            <div style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6' }}>{lesson.exercise}</div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={tryCode} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'linear-gradient(to right, #eab308, #d97706)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '0.9rem 2rem', 
              fontWeight: 800, 
              fontSize: '1.05rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 119, 6, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(217, 119, 6, 0.3)'; }}
          >
            <Play size={16} fill="currentColor" /> Résoudre le défi
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NOUVELLES LEÇONS (Tableaux & Matrices) ──────────────────────────────────

export const TableauInverseRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Inverser un tableau, c'est comme plier une feuille en deux : le premier élément touche le dernier, le deuxième touche l'avant-dernier. On échange leurs places jusqu'à arriver au <strong>centre</strong>.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Le principe du miroir" color="#4f8ff0">
        Inverser le contenu d'un tableau sur place nécessite une <strong>variable temporaire</strong>. Étant donné une taille N, on échange <Mono color="#4f8ff0">T[i]</Mono> et <Mono color="#4f8ff0">T[N - 1 - i]</Mono>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="L'algorithme d'inversion" step={1}>
        <TableauDiagram values={[1, 2, 3, 4, 5]} name="T" color="#4f8ff0" />
        <ArrayReverseVisualizer array={[1, 2, 3, 4, 5]} name="T" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="inverser.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Le piège de la boucle complète">
        Attention à la condition de ta boucle POUR : <Mono color="#fb7185">POUR i DE 0 A N-1</Mono> annulera l'inversion ! Vous inverserez la première moitié, puis la deuxième moitié ré-inversera tout à sa place initiale. Il faut s'arrêter au niveau de la moitié du tableau.
      </WarningCard>

      <SummaryCard items={[
        'Échange classique avec variable : temp = A; A = B; B = temp',
        'L\'indice opposé à [i] dans un tableau de taille N est [N - 1 - i]',
        'On arrête la boucle au MILIEU du tableau'
      ]} />
    </div>
  );
};

export const TableauDecalageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un jeu de chaises musicales : tout le monde doit se décaler d'une chaise vers la droite. Celui qui était au bout n'a plus de chaise, alors il court prendre la toute première place à gauche. C'est un <strong>décalage circulaire</strong>.
      </AnalogieCard>

      <InfoCard title="L'ordre de copie est crucial">
        Pour décaler vers la DROITE, on doit absolument <strong>copier en partant de la fin</strong> du tableau (ou écrire unitairement les opérations en remontant). Si l'on copie T[0] dans T[1], puis T[1] dans T[2], on propagerait la même valeur dans tout le tableau !
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Algorithme de décalage droit" step={1}>
        <TableauDiagram values={[5, 1, 2, 3, 4]} name="T decale" color="#34d399" />
        <ArrayShiftVisualizer array={[1, 2, 3, 4, 5]} name="T" direction="right" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="decalage.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Ne pas perdre le dernier élément">
        Sauvegarde toujours le dernier élément <Mono color="#facc15">T[N-1]</Mono> dans une variable (ex: <i>dernier</i>) <strong>avant</strong> d'effectuer le décalage. Une fois le tableau décalé, réinjecte cette valeur dans <Mono color="#facc15">T[0]</Mono>.
      </TipCard>

      <SummaryCard items={[
        'Pour un décalage droit, on copie T[i-1] vers T[i]',
        'Ceci doit se faire par ordre décroissant (ou étape par étape à l\'envers)',
        'On utilise une variable "dernier" pour un décalage circulaire'
      ]} />
    </div>
  );
};

export const MatriceInverseRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        C'est comme tourner la page d'un carnet de notes de bas en haut. La toute dernière ligne devient la première, et l'avant-dernière devient la deuxième. On échange des <strong>lignes entières</strong>.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Inversion verticale d'une matrice" color="#a78bfa">
        La logique principale reste l'inversement miroir, tout comme le tableau 1D. La seule différence : l'élément à échanger n'est plus une simple case, c'est l'ensemble des cases <Mono color="#a78bfa">j</Mono> d'une même ligne <Mono color="#a78bfa">i</Mono>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Inverser les lignes" step={1}>
        <MatrixReverseVisualizer matrix={[[4,4,4],[3,3,3],[2,2,2],[1,1,1]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice_inverse.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Combien de lignes faut-il parcourir ?">
        Comme pour l'inversion d'un tableau classique, la boucle externe sur les lignes ne doit aller que jusqu'à <strong>la moitié de la hauteur</strong> (L/2) ! Si la matrice contient 4 lignes, on inverse la ligne 0 avec la 3, puis la ligne 1 avec la 2, et on s'arrête !
      </WarningCard>

      <SummaryCard items={[
        'La boucle de lignes (boucle externe) s\'arrête à la moitié (ex: 0 à 1 pour 4 lignes)',
        'La boucle des colonnes (boucle interne) parcourt toujours TOUTES les colonnes',
        'Échange classique : temp = M[i, j]; M[i, j] = M[i, j] ...'
      ]} />
    </div>
  );
};

export const MatriceDecalageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un bandit manchot dans un casino : on décale l'ensemble des rouleaux d'un cran. Le principe horizontal est le même que le décalage de tableau, mais il doit être <strong>répété pour chaque ligne</strong> !
      </AnalogieCard>

      <InfoCard title="Décalage horizontal (à droite)">
        Pour décaler les colonnes à droite, on applique simplement l'algorithme "classique" de décalage... à l'intérieur d'une boucle <Mono>POUR i</Mono> qui parcourt l'ensemble des lignes de la matrice.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Décaler d'un cran" step={1}>
        <MatrixShiftVisualizer matrix={[[3,1,2],[6,4,5]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice_decalage.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Le décalage vertical">
        Une variante populaire est de décaler les <strong>lignes</strong> de la matrice vers le bas. Dans ce scénario, on sauvegarde la ligne finale, on décale chaque élément vers le bas (<Mono color="#facc15">M[i, j] = M[i, j]</Mono>), et on réinjecte en ligne 0.
      </TipCard>

      <SummaryCard items={[
        'Boucle externe : on parcourt chaque ligne',
        'À l\'intérieur de chaque ligne, on effectue un décalage de tableau droit standard',
        'Il faut impérativement une variable pour mémoriser le dernier élément de la ligne courante'
      ]} />
    </div>
  );
};

// ─── Generic Fallback ────────────────────────────────────────────────────────

export const GenericRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      {paragraphs.map((p, i) => <P key={i}>{p}</P>)}
      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple">
          <CodeBlock code={lesson.example_code} onTry={tryCode} />
        </LessonSection>
      )}
      {lesson.exercise && <ExerciseBlock text={lesson.exercise} code={lesson.example_code} onTry={tryCode} />}
    </div>
  );
};

// ─── Dispatch map ─────────────────────────────────────────────────────────────

export const LESSON_RENDERERS = {
  // Niveau 1
  intro: IntroRenderer,
  variables: VariablesRenderer,
  syntaxe: SyntaxeRenderer,
  operateurs: OperateursRenderer,
  io: IORenderer,
  constantes: ConstantesRenderer,
  expressions: ExpressionsRenderer,
  chaines: ChainesRenderer,
  exemples: ExemplesRenderer,
  // Niveau 2
  condition_si: ConditionSiRenderer,
  condition_sinon: ConditionSinonRenderer,
  sinon_si: SinonSiRenderer,
  condition_imbrique: ConditionImbriqueeRenderer,
  operateurs_logiques: OperateursLogiquesRenderer,
  selon: SelonRenderer,
  selon_imbrique: SelonImbriqueeRenderer,
  conditions_combinees: ConditionsCombineesRenderer,
  selon_plage: SelonPlageRenderer,
  // Niveau 3
  boucle_intro: BoucleIntroRenderer,
  boucle_pour: BouclePourRenderer,
  boucle_pour_pas: BouclePourPasRenderer,
  boucle_tantque: BoucleTantqueRenderer,
  boucle_repeter: BoucleRepeterRenderer,
  boucle_compteur: BoucleCompteurRenderer,
  boucle_imbrique: BoucleImbriqueeRenderer,
  boucle_recherche: BoucleRechercheRenderer,
  boucle_validation: BoucleValidationRenderer,
  // Niveau 4
  tableau: TableauRenderer,
  tableau_init: TableauInitRenderer,
  tableau_parcours: TableauParcoursRenderer,
  tableau_somme: TableauSommeRenderer,
  tableau_max_min: TableauMaxMinRenderer,
  tableau_recherche: TableauRechercheRenderer,
  tableau_insertion: TableauInsertionRenderer,
  tableau_copie: TableauCopieRenderer,
  tableau_tri: TableauTriRenderer,
  tableau_inverse: TableauInverseRenderer,
  tableau_decalage: TableauDecalageRenderer,
  // Niveau 5
  matrice: MatriceRenderer,
  matrice_init: MatriceInitRenderer,
  matrice_parcours: MatriceParcoursRenderer,
  matrice_somme: MatriceSommeRenderer,
  matrice_diagonale: MatriceDiagonaleRenderer,
  matrice_ligne_col: MatriceLigneColRenderer,
  matrice_max: MatriceMaxRenderer,
  matrice_symetrie: MatriceSymetrieRenderer,
  matrice_transposee: MatriceTransposeeRenderer,
  matrice_inverse: MatriceInverseRenderer,
  matrice_decalage: MatriceDecalageRenderer,
  // Niveau 6
  struct: StructRenderer,
  struct_champs: StructChampsRenderer,
  struct_modification: StructModificationRenderer,
  struct_affichage: StructAffichageRenderer,
  struct_tableau: StructTableauRenderer,
  struct_recherche: StructRechercheRenderer,
  struct_comparaison: StructComparaisonRenderer,
  struct_complexe: StructComplexeRenderer,
  // Exercice
  exercice: ExerciceRenderer,
  challenge: ChallengeRenderer,
};
