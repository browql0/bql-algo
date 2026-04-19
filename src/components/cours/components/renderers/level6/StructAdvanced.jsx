import React from 'react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  AnalogieCard,
} from '../../blocks/LessonComponents';
import { Mono } from '../../common/LessonRendererShared';

// struct_tableau
export const StructTableauRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un tableau de bord de classe : chaque ligne est un élève (fiche) et chaque colonne est un attribut (nom, note, mention). En BQL : un tableau d'enregistrements.
      </AnalogieCard>
      <InfoCard title="Tableau d'enregistrements  base de données en mémoire">
        On combine tableau et enregistrement : <Mono>Tableau classe[30] : Eleve</Mono>. Chaque case contient un enregistrement complet. Accès : <Mono>classe[i].champ</Mono>.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tableau_structs.bql" onTry={tryCode} />}
      <TipCard>Pattern ultra-courant en algorithmique : tableau de structs + POUR pour traiter chaque enregistrement.</TipCard>
      <SummaryCard items={['Tableau classe[n] : Eleve   déclarer un tableau de structs', 'classe[i].nom   accèder au champ d\'un élément', 'POUR i ALLANT DE 0 A n-1 FAIRE   traiter tous les enregistrements']} />
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
      <TipCard>On retient l'<strong>indice</strong> du meilleur (pas la valeur isolée). Ainsi, après la recherche, on peut accèder à tous ses champs : <Mono color="#facc15">eleves[meilleur].nom</Mono>, <Mono color="#facc15">eleves[meilleur].note</Mono>.</TipCard>
      <SummaryCard items={['Initialiser meilleur <- 0 (indice du premier)', 'Comparer T[i].champ > T[meilleur].champ', 'Mettre à jour meilleur <- i si nouveau maximum', 'À la fin, T[meilleur] donne accès à tous les champs']} />
    </div>
  );
};

// struct_comparaison
export const StructComparaisonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Comparer deux enregistrements  champ par champ">
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
      <InfoCard title="Plusieurs types liés  vers la modélisation réelle">
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
