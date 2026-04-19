import React from 'react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  AnalogieCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import {
  ArraySumVisualizer,
  ArrayMaxMinVisualizer,
  ArraySearchVisualizer,
} from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

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
        { label: 'Parcourir', desc: 'POUR i ALLANT DE 0 A n-1 FAIRE' },
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
        'Calculer la moyenne APRS la boucle : moyenne <- somme / n',
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
        { label: 'Parcourir', desc: 'POUR i ALLANT DE 1 A n-1 FAIRE (commencer à 1, on a déjà traité 0)' },
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
        'Après la boucle : SI indice <> -1   trouvé, SINON   absent',
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

      <TipCard>Pour remplir un tableau avec des valeurs calculées, utilise la variable de boucle i dans la formule : <Mono color="#facc15">T[i] {'<-'} (i + 1) * 3</Mono>   3, 6, 9, 12, 15.</TipCard>

      <SummaryCard items={[
        'T[i] <- valeur modifie l\'élément à l\'indice i',
        'Remplissage programmatique : POUR i ALLANT DE 0 A n-1 FAIRE T[i] <- formule(i);',
        'L\'indice doit être dans les bornes [0, taille-1]',
      ]} />
    </div>
  );
};
