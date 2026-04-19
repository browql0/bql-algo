import React from 'react';
import { Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { Mono } from '../../common/LessonRendererShared';

// boucle_imbrique
export const BoucleImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une horloge : l'aiguille des minutes fait un tour complet (60 secondes) pour chaque chiffre de l'aiguille des heures. Pour 12 heures   12 tours  60 minutes = 720 tours des minutes. C'est N  M itérations.
      </AnalogieCard>

      <InfoCard title="Boucles imbriquées  boucle dans une boucle">
        On place une boucle à l'intérieur d'une autre. La boucle <em>interne</em> s'exécute <strong>complètement</strong> à chaque tour de la boucle externe.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  table de multiplication partielle" step={1}>
          <CodeBlock code={lesson.example_code} title="boucles_imbriquees.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Comptage des itérations" step={2}>
        <InfoCard color="#4f8ff0" title="N * M itérations">
          Pour une boucle externe de taille N et interne de taille M :<br />
          <Mono color="#4f8ff0">Total = N * M itérations</Mono><br />
          Ex: externe 3 tours * interne 4 tours = 12 appels au corps interne.
        </InfoCard>
      </LessonSection>

      <TipCard>
        Utilise <Mono color="#facc15">i</Mono> pour la boucle externe, <Mono color="#facc15">j</Mono> pour l'interne. Ne jamais réutiliser le même nom dans les deux boucles !
      </TipCard>

      <SummaryCard items={[
        'La boucle interne s\'exécute entièrement par tour de la boucle externe',
        'N * M itérations totales POUR boucles ALLANT DE taille N et M',
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

      <InfoCard title="Recherche séquentielle  algorithme fondamental">
        La recherche séquentielle parcourt une séquence <em>élément par élément</em> jusqu'à trouver la valeur cherchée ou atteindre la fin.
      </InfoCard>

      <WhyCard>
        C'est l'algorithme de recherche le plus simple. Pas besoin que les données soient triées. Compris une fois, il s'applique à des tableaux, des listes, des fichiers...
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Pattern de recherche avec booléen" step={1}>
        <StepByStep steps={[
          { label: 'Initialiser', desc: 'trouve <- FAUX avant la boucle.' },
          { label: 'Parcourir', desc: 'POUR i ALLANT DE 1 A n FAIRE pour tester chaque valeur.' },
          { label: 'Tester', desc: 'SI valeur[i] = cible ALORS trouve <- VRAI' },
          { label: 'Résultat', desc: 'Après la boucle, SI trouve ALORS   trouvé, SINON   absent.' },
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
        'Vérifier trouve après la boucle pour connaêtre le résultat',
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

      <InfoCard title="Validation de saisie  pattern essentiel">
        On utilise une boucle TANTQUE pour redemander une saisie tant qu'elle est invalide. C'est un pattern fondamental pour les applications robustes qui ne plantent pas sur une mauvaise entrée.
      </InfoCard>

      <StepByStep steps={[
        { label: 'Première saisie', desc: 'LIRE(variable) avant la boucle pour obtenir une première valeur.' },
        { label: 'Condition de validation', desc: 'TANTQUE la valeur est INVALIDE FAIRE (ex: < 0 OU > 20).' },
        { label: 'Message d\'erreur', desc: 'ECRIRE("Valeur invalide !") pour guider l\'utilisateur.' },
        { label: 'Re-saisie', desc: 'LIRE(variable) à nouveau dans la boucle.' },
        { label: 'Valeur validée', desc: 'À la sortie de la boucle, la valeur est garantie valide.' },
      ]} />

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  validation de note et d'âge" step={1}>
          <CodeBlock code={lesson.example_code} title="validation.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Toujours LIRE avant la boucle">
        Il faut faire un premier LIRE <em>avant</em> la boucle TANTQUE, sinon la variable est non-initialisée quand la condition est vérifiée pour la première fois.
      </TipCard>

      <SummaryCard items={[
        'LIRE une première fois avant la boucle',
        'TANTQUE valeur_invalide FAIRE   redemander',
        'À la sortie, la valeur est garantie valide',
        'Pattern essentiel pour des applications robustes',
      ]} />
    </div>
  );
};
