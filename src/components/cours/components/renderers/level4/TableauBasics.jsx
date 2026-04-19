import React from 'react';
import { Info, Layers, Code2 } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  TableauDiagram,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { ArrayTraversalVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

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
        Sans tableau, stocker 100 valeurs = 100 variables. Est-ce que tu écrirais <Mono color="#fb7185">note1, note2, ..., note100</Mono> ? Avec un tableau : <Mono color="#34d399">Tableau notes[100] : ENTIER</Mono>  une ligne.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Représentation visuelle  tableau T[3]" step={1}>
        <TableauDiagram values={[10, 20, 30]} name="T" color="#4f8ff0" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="tableau.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Les indices commencent à 0, pas à 1 !">
        Tableau T[3]   les indices valides sont T[0], T[1], T[2].<br />
        Accéder à T[3] est une <strong>erreur d'indice hors limites</strong>.
      </WarningCard>

      <SummaryCard items={[
        'Tableau Nom[taille] : TYPE   déclare un tableau',
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

      <InfoCard title="Initialisation  bonne pratique obligatoire">
        Toujours initialiser un tableau avant de lire ses valeurs. Une case non initialisée contient une valeur arbitraire (garbage value)  source de bugs difficiles à déboguer.
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
          POUR i ALLANT DE 0 A taille-1 FAIRE<br />
          &nbsp;&nbsp;T[i] {'<-'} 0; // ou -1, "" selon le type<br />
          FINPOUR
        </code>
      </TipCard>

      <SummaryCard items={[
        'Toujours initialiser avant de lire',
        'POUR i ALLANT DE 0 A taille-1 FAIRE T[i] <- valeur_neutre;',
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
      <InfoCard title="Parcours de tableau  POUR + indice">
        La boucle POUR est le partenaire naturel des tableaux. La variable de boucle sert d'indice : <Mono color="#4f8ff0">T[i]</Mono> accède à la case i.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Visualisation du parcours" step={1}>
        <TableauDiagram values={[12, 15, 9, 18]} name="notes" color="#34d399" />
        <ArrayTraversalVisualizer array={[12, 15, 9, 18]} name="notes" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="parcours.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard>Pour un tableau de taille n : <Mono color="#facc15">POUR i ALLANT DE 0 A n-1 FAIRE</Mono>. L'indice max = taille - 1 (jamais taille).</TipCard>

      <SummaryCard items={[
        'POUR i ALLANT DE 0 A n-1   parcourt tous les éléments',
        'T[i] accède à l\'élément à l\'indice i',
        'Parfait pour afficher, modifier ou chercher dans un tableau',
      ]} />
    </div>
  );
};
