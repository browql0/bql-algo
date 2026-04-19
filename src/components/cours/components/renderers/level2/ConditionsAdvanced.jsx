import React from 'react';
import { Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
} from '../../blocks/LessonComponents';
import { Mono } from '../../common/LessonRendererShared';

// condition_imbrique
export const ConditionImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Accès à un bâtiment sécurisé : <strong>SI tu as le badge ALORS</strong> (tu entres dans le hall), puis <strong>SI tu as le code ALORS</strong> (tu accèdes au couloir), puis <strong>SI tu as l'empreinte ALORS</strong> (tu entres dans le bureau). Chaque vérification est dans la précédente.
      </AnalogieCard>

      <InfoCard title="Conditions imbriquées">
        Un bloc SI peut contenir d'autres SI à l'intérieur. Chaque SI a son propre FINSI. Cela permet de vérifier des critères <em>hiérarchiques</em>  le deuxième critère n'est évalué que si le premier est vrai.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  accès conditionnel" step={1}>
          <CodeBlock code={lesson.example_code} title="imbrique.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <LessonSection icon={<Hash size={15} />} title="Compter les FINSI" step={2}>
        <InfoCard color="#facc15" title="Règle du 1-pour-1">
          Chaque <Mono color="#facc15">SI</Mono> doit avoir exactement un <Mono color="#facc15">FINSI</Mono>. Si tu as 3 SI imbriqués   3 FINSI. Indente soigneusement pour ne pas perdre le fil.
        </InfoCard>
      </LessonSection>

      <WarningCard title="Attention à l'indentation">
        En BQL, l'indentation n'est pas obligatoire mais elle est <em>vitale pour la lisibilité</em>. Chaque SI imbriqué devrait être indenté d'un niveau supplémentaire.
      </WarningCard>

      <SummaryCard items={[
        'Chaque SI imbriqué a son propre FINSI',
        'N SI imbriqués   N FINSI',
        'Utilise l\'imbrication pour des critères hiérarchiques',
        'Indente soigneusement pour garder le fil',
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
        Admission à une école : <strong>avoir {'>'} 12/20 ET {'<'} 3 absences ET avoir rendu son projet</strong>. Si une condition fail, c'est refusé. Les conditions réelles sont rarement simples  elles combinent plusieurs critères.
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
        Les tranches d'imposition : <strong>010 000   0%</strong>, <strong>10 00125 000   11%</strong>, etc. Ce ne sont pas des valeurs exactes mais des <em>intervalles</em>  SINONSI est la bonne structure.
      </AnalogieCard>

      <InfoCard title="Tester des plages de valeurs">
        Quand les valeurs possibles forment des <em>intervalles continus</em>, SINONSI en cascade est la bonne approche. SELON ne convient que pour des valeurs exactes.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Mention et IMC  deux classifications par plages" step={1}>
          <CodeBlock code={lesson.example_code} title="selon_plage.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Règle d'or  du plus restrictif au plus général">
        Toujours commencer par la condition la plus restrictive. Si tu testes <Mono color="#facc15">{'note >= 10'}</Mono> avant <Mono color="#facc15">{'note >= 16'}</Mono>, une note de 18 sera classée "Passable" au lieu de "Très bien".
      </TipCard>

      <SummaryCard items={[
        'Pour des intervalles, utiliser SINONSI en cascade (pas SELON)',
        'Ordre du plus restrictif au plus général',
        'Le premier bloc VRAI rencontré est exécuté',
        'SINON sans condition = cas "tout le reste"',
      ]} />
    </div>
  );
};
