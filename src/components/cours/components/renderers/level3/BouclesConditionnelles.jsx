import React from 'react';
import { Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  LoopDiagram,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { LoopExecutionVisualizer, AccumulatorVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// boucle_tantque
export const BoucleTantqueRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un médecin prend des médicaments <strong>tant que</strong> le patient a de la fièvre. Dès que la fièvre tombe, il arrête. Il ne sait pas à l'avance combien de jours ça prendra  c'est une boucle TANTQUE.
      </AnalogieCard>

      <InfoCard title="Boucle TANTQUE  condition avant chaque tour">
        La condition est vérifiée <strong>AVANT</strong> chaque itération. Si elle est fausse dès le départ, la boucle ne s'exécute <em>jamais</em>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Fonctionnement visualisé" step={1}>
        <LoopDiagram type="tantque" initLabel="Init" condLabel="Cond ?" bodyLabel="Corps" updateLabel="Update" />
        <LoopExecutionVisualizer start={1} end={4} bodyLabel="compteur <- compteur + 1" type='tantque' />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="tantque.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="xa Boucle infinie !">
        Si vous oubliez de <strong>modifier la variable de condition</strong> dans le corps, vous créez une boucle infinie ! Le programme ne s'arrêtera jamais. Vérifiez toujours qu'il existe un moyen de sortir.
      </WarningCard>

      <TipCard title="Checklist TANTQUE">
         Initialiser la variable de condition AVANT la boucle.<br />
         Modifier la variable de condition DANS le corps.<br />
         Vérifier que la condition deviendra FAUSSE à un moment.
      </TipCard>

      <SummaryCard items={[
        'TANTQUE condition FAIRE ... FINTANTQUE',
        'Condition vérifiée AVANT chaque tour   possible 0 exécution',
        'Obligatoire : modifier la variable de condition dans le corps',
        'Idçal quand on ne connaît pas le nombre d\'itérations à l\'avance',
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
        Essayer d'ouvrir une porte : tu essaies d'abord, puis tu regardes si c'est ouvert. Tu essaies AU MOINS UNE FOIS avant de vérifier le résultat  c'est une boucle REPETER.
      </AnalogieCard>

      <InfoCard title="Boucle REPETER  condition après le corps">
        La boucle s'exécute <strong>au moins une fois</strong>. La condition est vérifiée <em>après</em> chaque itération. Elle s'arrête quand la condition devient <strong>VRAIE</strong>.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="repeter.bql" onTry={tryCode} />}

      <LessonSection icon={<Hash size={15} />} title="REPETER vs TANTQUE  la différence clé" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#a78bfa" title="TANTQUE">Condition vérifiée <strong>AVANT</strong>   peut s'exécuter <em>0 fois</em> si la condition est fausse dès le départ.</InfoCard>
          <InfoCard color="#34d399" title="REPETER">Condition vérifiée <strong>APRS</strong>   s'exécute <em>toujours au moins 1 fois</em>.</InfoCard>
        </div>
      </LessonSection>

      <WarningCard>
        La logique est inversée : REPETER s'arrête quand la condition devient <strong>VRAIE</strong> (contrairement à TANTQUE qui continue tant que VRAIE).
      </WarningCard>

      <SummaryCard items={[
        "REPETER ... JUSQU'A condition ;",
        'Condition vérifiée APRS le corps   au moins 1 exécution garantie',
        "S'arrête quand la condition = VRAI (logique inverse de TANTQUE)",
        "Idçal pour : redemander une saisie, lancer une action au moins 1 fois",
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

      <InfoCard title="Compteurs et accumulateurs  les piliers des boucles">
        Un <strong>compteur</strong> compte le nombre d'occurrences d'un événement.<br />
        Un <strong>accumulateur</strong> cumule des valeurs (somme, produit, etc.).<br />
        Les deux s'initialisent à une valeur neutre <em>avant</em> la boucle.
      </InfoCard>

      <WhyCard>
        90% des algorithmes de traitement de données utilisent un compteur ou un accumulateur. Moyenne d'un tableau, nombre de notes au-dessus de 10, somme des ventes  tous ces cas suivent ce pattern.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Valeurs neutres d'initialisation" step={1}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[['Somme', '0', 'Ajouter ne change pas 0', '#4ade80'], ['Produit', '1', 'Multiplier ne change pas 1', '#facc15'], ['Max', 'T[0]', 'Commencer avec la 1ère valeur', '#4f8ff0'], ['Compteur', '0', 'Aucun événement compté encore', '#a78bfa']].map(([n, v, d, c]) => (
            <div key={n} style={{ background: `${c}0e`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '0.7rem', flex: 1, minWidth: '100px' }}>
              <div style={{ color: c, fontWeight: 800, marginBottom: '0.2rem' }}>{n}</div>
              <div style={{ fontFamily: 'monospace', color: c, fontSize: '1.1rem', marginBottom: '0.2rem' }}>  {v}</div>
              <div style={{ fontSize: '0.72rem', color: '#475569' }}>{d}</div>
            </div>
          ))}
        </div>
        <AccumulatorVisualizer values={[3, 7, 2, 8, 5]} varName='somme' operation='+' initVal={0} />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  somme, produit, comptage" step={2}>
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
