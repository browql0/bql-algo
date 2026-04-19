import React from 'react';
import { Info, Hash, Code2, GitBranch, Play } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  FlowDiagram,
  ExerciseBlock,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { ExpressionVisualizer, BooleanLogicVisualizer } from '../../../visualizers';
import { Mono, P } from '../../common/LessonRendererShared';

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
            { niveau: '', label: 'Parenthèses', ex: '(a + b)', color: '#c084fc', note: 'évalué en premier' },
            { niveau: '', label: '* / MOD', ex: 'a * b', color: '#facc15', note: 'Multiplication, division, modulo' },
            { niveau: '', label: '+ -', ex: 'a + b', color: '#4ade80', note: 'Addition, soustraction' },
            { niveau: '', label: '< > = <> <= >=', ex: 'a > b', color: '#4f8ff0', note: 'Comparaison' },
            { niveau: '', label: 'NON ET OU', ex: 'a ET b', color: '#fb7185', note: 'Logique (évalué en dernier)' },
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
        'Type CHAINE DE CARACTERE   texte entre guillemets doubles',
        'Affectation : nom <- "Alice"',
        'ECRIRE("texte", variable, ...)   combine librement texte et données',
        'Pas de + pour concaténer : utiliser les virgules dans ECRIRE',
      ]} />
    </div>
  );
};

// 9. logique_base
export const LogiqueBaseRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const truthRows = [
    { a: 'VRAI', b: 'VRAI', et: 'VRAI', ou: 'VRAI' },
    { a: 'VRAI', b: 'FAUX', et: 'FAUX', ou: 'VRAI' },
    { a: 'FAUX', b: 'VRAI', et: 'FAUX', ou: 'VRAI' },
    { a: 'FAUX', b: 'FAUX', et: 'FAUX', ou: 'FAUX' },
  ];
  const boolColor = (value) => (value === 'VRAI' ?'#34d399' : '#fb7185');

  return (
    <div>
      <AnalogieCard>
        <strong>ET</strong> et <strong>OU</strong> servent a combiner deux idees vraies ou fausses. Avec ET, tout doit etre vrai. Avec OU, une seule condition vraie suffit.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Deux connecteurs tres utiles" color="#4f8ff0">
        Une valeur <Mono color="#34d399">BOOLEEN</Mono> vaut seulement <Mono color="#34d399">VRAI</Mono> ou <Mono color="#fb7185">FAUX</Mono>. Les operateurs <Mono color="#facc15">ET</Mono> et <Mono color="#a78bfa">OU</Mono> permettent de fabriquer une nouvelle reponse vraie ou fausse.
      </InfoCard>

      <WhyCard>
        Meme avant les conditions, cette logique aide a comprendre comment un programme decide. Plus tard, tu ecriras des conditions comme <Mono color="#facc15">age &gt;= 18 ET inscrit = VRAI</Mono>.
      </WhyCard>

      <LessonSection icon={<Hash size={15} />} title="Table de verite" step={1}>
        <P>Une table de verite montre tous les cas possibles. Lis chaque ligne comme une petite experience.</P>
        <div style={{ overflowX: 'auto', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['A', 'B', 'A ET B', 'A OU B'].map((h) => (
                  <th key={h} style={{ padding: '0.65rem 0.8rem', color: '#93a4bd', textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {truthRows.map((row) => (
                <tr key={`${row.a}-${row.b}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[row.a, row.b, row.et, row.ou].map((value, idx) => (
                    <td key={`${value}-${idx}`} style={{ padding: '0.55rem 0.8rem', color: boolColor(value), textAlign: 'center', fontWeight: idx >= 2 ?800 : 600 }}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LessonSection>

      <LessonSection icon={<GitBranch size={15} />} title="Schemas mentaux" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <P><strong>ET</strong> ressemble a deux portes fermees : il faut passer les deux.</P>
            <FlowDiagram steps={[
              { label: 'condition A', sub: 'doit etre vraie', accent: '#facc15' },
              { label: 'ET', sub: 'controle strict', accent: '#4f8ff0' },
              { label: 'condition B', sub: 'doit etre vraie', accent: '#facc15' },
              { label: 'resultat VRAI', sub: 'si A et B passent', accent: '#34d399' },
            ]} />
          </div>
          <div>
            <P><strong>OU</strong> ressemble a deux chemins possibles : un seul chemin ouvert suffit.</P>
            <FlowDiagram steps={[
              { label: 'condition A', sub: 'peut suffire', accent: '#a78bfa' },
              { label: 'OU', sub: 'choix possible', accent: '#4f8ff0' },
              { label: 'condition B', sub: 'peut suffire', accent: '#a78bfa' },
              { label: 'resultat VRAI', sub: 'si A ou B passe', accent: '#34d399' },
            ]} />
          </div>
        </div>
      </LessonSection>

      <LessonSection icon={<Play size={15} />} title="Voir ET et OU en action" step={3}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <BooleanLogicVisualizer operator="ET" />
          <BooleanLogicVisualizer operator="OU" />
        </div>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple BQL" step={4}>
          <CodeBlock code={lesson.example_code} title="logique_base.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Erreur frequente">
        Ne confonds pas ET et OU. <Mono color="#facc15">ET</Mono> est strict : si une seule partie est fausse, le resultat est faux. <Mono color="#a78bfa">OU</Mono> est plus souple : une seule partie vraie suffit.
      </WarningCard>

      {lesson.exercise && <ExerciseBlock text={lesson.exercise} code={lesson.example_code} onTry={tryCode} />}

      <SummaryCard items={[
        'ET : A ET B est VRAI seulement si A et B sont tous les deux VRAIS',
        'OU : A OU B est VRAI si au moins une des deux conditions est VRAIE',
        'Une table de verite aide a verifier tous les cas',
        'Ces operateurs serviront ensuite dans SI, SINONSI et les validations',
      ]} />
    </div>
  );
};

// 10. exemples
export const ExemplesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Cas pratique complet  Niveau 1">
        Ce programme combine tout le Niveau 1 : constantes, variables, opérateurs, LIRE et ECRIRE. Il calcule un salaire net à partir d'un taux de charges.
      </InfoCard>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="exemple_complet.bql" onTry={tryCode} />}

      <LessonSection icon={<Hash size={15} />} title="Décomposition du programme" step={1}>
        <StepByStep steps={[
          { label: 'Constante', desc: 'TAUX_CHARGES définit le taux fixe à 22%.' },
          { label: 'Variables', desc: 'prenom, salaire_brut, charges, salaire_net pour stocker chaque donnée.' },
          { label: 'LIRE', desc: 'Interagit avec l\'utilisateur pour obtenir ses données.' },
          { label: 'Calcul', desc: 'charges = salaire_brut  0.22, puis soustraction.' },
          { label: 'ECRIRE', desc: 'Affiche le résultat  proprement.' },
        ]} />
      </LessonSection>

      <TipCard title="Entraîne-toi !">
        Modifie ce programme pour calculer autre chose : un IMC (poids / taille²), une conversion euros dollars, ou l'âge dans X années.
      </TipCard>

      <SummaryCard items={[
        'Combiner constantes + variables + calculs + LIRE + ECRIRE',
        'Un programme complet suit un flux logique : entrée   traitement   sortie',
        'Les constantes rendent le code plus maintenable',
      ]} />
    </div>
  );
};
