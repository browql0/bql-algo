import React from 'react';
import { Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  SummaryCard,
  LessonSection,
  LoopDiagram,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { LoopExecutionVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// boucle_intro
export const BoucleIntroRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine devoir écrire 100 fois "Je ne dois pas arriver en retard" au tableau. À la main : 100 lignes. Avec une boucle : 3 lignes de code. Les boucles sont le copier-coller intelligent d'un programmeur.
      </AnalogieCard>

      <InfoCard title="Les boucles  l'art de la répétition intelligente">
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
        'POUR   nombre de tours connu : POUR i ALLANT DE 1 A n FAIRE',
        'TANTQUE   condition évaluée avant chaque tour',
        'REPETER   exécuté au moins 1 fois, condition vérifiée après',
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
        Un chef qui dit à un cuisinier : <strong>"Prépare 50 assiettes, de la numéro 1 à la numéro 50."</strong> Le cuisinier sait exactement combien d'assiettes il doit préparer  c'est une boucle POUR.
      </AnalogieCard>

      <InfoCard title="Boucle POUR  itérations fixes">
        Utilisée quand on connaît <strong>à l'avance</strong> le nombre d'itérations. La variable de boucle est automatiquement incrémentée de 1 à chaque tour.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement pas-à -pas" step={1}>
        <LoopDiagram type="pour" initLabel="i = début" condLabel="i 0 fin ?" bodyLabel="Corps" updateLabel="i + 1" />
        <LoopExecutionVisualizer start={1} end={5} bodyLabel='ECRIRE(i)' type='pour' />
        <InfoCard color="#c084fc" title="Syntaxe exacte">
          <Mono color="#c084fc">POUR i ALLANT DE début A fin FAIRE ... FINPOUR</Mono><br />
          La variable <Mono>i</Mono> est incrémentée de 1 automatiquement à chaque tour. Pas besoin de <Mono>i {'<-'} i + 1</Mono>.
        </InfoCard>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  afficher 1, 2, 3" step={2}>
          <CodeBlock code={lesson.example_code} title="boucle_pour.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Exemples d'utilisation typiques" step={3}>
        <CodeBlock code={`// Afficher les pairs de 0 à 10\nPOUR i ALLANT DE 0 A 10 FAIRE\n  SI i MOD 2 = 0 ALORS\n    ECRIRE(i);\n  FINSI\nFINPOUR`} title="pairs.bql" />
      </LessonSection>

      <WarningCard>Fermer avec <Mono color="#fb7185">FINPOUR</Mono>. Ne pas oublier <Mono color="#fb7185">FAIRE</Mono> après les bornes.</WarningCard>

      <SummaryCard items={[
        'POUR i ALLANT DE debut A fin FAIRE ... FINPOUR',
        'i est automatiquement incrémenté de 1 à chaque tour',
        'Si debut > fin   la boucle ne s\'exécute pas',
        'Parfait pour parcourir des tableaux ou répèter N fois',
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

      <InfoCard title="POUR avec PAS  incrément personnalisé">
        Par défaut, POUR incrémente de 1. Le mot-clé <Mono color="#4f8ff0">PAS</Mono> permet de définir un incrément différent, positif ou négatif.
      </InfoCard>

      <WhyCard>
        PAS est indispensable pour les patterns numériques courants : multiples, séquences paires/impaires, comptages à rebours, parcours de tableau à l'envers.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Syntaxe avec PAS" step={1}>
        <CodeBlock code={`// Syntaxe\nPOUR i ALLANT DE debut A fin PAS increment FAIRE\n  // instructions\nFINPOUR\n\n// Exemples d'incréments\nPOUR i ALLANT DE 0 A 10 PAS 2 FAIRE  // 0,2,4,6,8,10\nPOUR i ALLANT DE 10 A 0 PAS -1 FAIRE // 10,9,8,7,...,0\nPOUR i ALLANT DE 0 A 100 PAS 10 FAIRE // 0,10,20,...,100`} title="syntaxe_pas.bql" />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  pairs et compte à rebours" step={2}>
          <CodeBlock code={lesson.example_code} title="pour_pas.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="PAS négatif   début > fin">
        Pour un compte à rebours, le début doit être supérieur à la fin : <Mono color="#34d399">POUR i ALLANT DE 5 A 1 PAS -1</Mono>.<br />
        Si tu écris <Mono color="#fb7185">POUR i ALLANT DE 1 A 5 PAS -1</Mono>, la boucle ne s'exécutera jamais.
      </WarningCard>

      <SummaryCard items={[
        'POUR i ALLANT DE debut A fin PAS incrément FAIRE',
        'PAS positif   comptage ascendant (PAS 2 : 0,2,4,6...)',
        'PAS négatif   compte à rebours (PAS -1 : 5,4,3,2,1)',
        'Quand PAS est négatif, debut doit être > fin',
      ]} />
    </div>
  );
};
