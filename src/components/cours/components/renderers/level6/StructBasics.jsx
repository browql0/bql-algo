import React from 'react';
import { Code2 } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { RecordVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// struct
export const StructRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une fiche de contact : elle rassemble le nom, le prénom, le téléphone et l'email  des types différents pour une seule personne. En BQL, un enregistrement c'est ça : plusieurs variables de types différents sous un même nom.
      </AnalogieCard>

      <InfoCard title="TYPE ENREGISTREMENT  regrouper des données hétérogènes">
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

      <TipCard>Accès aux champs : <Mono color="#facc15">e.nom</Mono>, <Mono color="#facc15">e.age</Mono>. La notation pointée est obligatoire  <Mono color="#fb7185">nom</Mono> seul n'existe pas.</TipCard>

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
      <TipCard>On peut affecter un champ à partir d'une condition : <Mono color="#facc15">e.admis {'<-'} (e.note {'>='} 10)</Mono> n'est pas valide en BQL basique  utilisez un SI.</TipCard>
      <SummaryCard items={['e.note >= 10   comparer un champ', 'e.admis <- VRAI   modifier un champ booléen', 'ECRIRE(e.nom, " : ", e.note)   afficher plusieurs champs']} />
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
      <SummaryCard items={['c.solde <- c.solde + 500.0   modifier avec calcul', 'c.transactions <- c.transactions + 1   compteur', 'Les champs d\'un enregistrement sont muables']} />
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
