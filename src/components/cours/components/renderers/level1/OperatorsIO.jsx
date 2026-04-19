import React from 'react';
import { Info, Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  FlowDiagram,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { ExpressionVisualizer, VariableStateVisualizer } from '../../../visualizers';
import { Mono, P } from '../../common/LessonRendererShared';

// 4. operateurs
export const OperateursRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Les opérateurs sont les <strong>outils de calcul</strong> d'un programme. Comme en maths avec +, -, *, /,mod mais BQL ajoute des opérateurs de comparaison (est-ce que A est plus grand que B ?) et des opérateurs logiques (ET, OU, NON).
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
        <TipCard title="MOD  Modulo">
          <Mono color="#facc15">7 MOD 2 = 1</Mono>   reste de la division de 7 par 2.<br />
          Astuce : <Mono color="#facc15">n MOD 2 = 0</Mono> signifie "<strong>n est pair</strong>".
        </TipCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Opérateurs de comparaison" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {[['=', 'égal'], ['<>', 'Différent'], ['<', 'Inférieur'], ['>', 'Supérieur'], ['<=', 'Inf. ou égal'], ['>=', 'Sup. ou égal']].map(([op, label]) => (
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
            { highlight: [0,1,2], desc: { text: 'On évalue 7 MOD 2  reste de la division de 7 par 2.', color: '#facc15' } },
            { highlight: [0,1,2], partial: '1', result: '1', desc: { text: '7 MOD 2 = 1 (car 7 = 3 * 2 + 1). Utile pour tester si un nombre est pair !', color: '#34d399' } },
          ]}
        />
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple pratique  calcul et modulo" step={4}>
          <CodeBlock code={lesson.example_code} title="operateurs.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <SummaryCard items={[
        'Arithmétique : +, -, *, /, MOD (modulo = reste)',
        'Comparaison : =, <>, <, >, <=, >= (différent s\'écrit <>)',
        'Logique : ET (les deux), OU (au moins un), NON (inverse)',
        'Priorité : parenthèses   * / MOD   + -   comparaison   NON   ET   OU',
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
          { name: 'age', value: 25, op: '  utilisateur tape 25' },
          { name: 'age', value: 26, op: 'age   age + 1' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="entree_sortie.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Combiner texte et variables dans ECRIRE" step={2}>
        <P>On passe <strong>plusieurs arguments</strong> à ECRIRE en les séparant par des virgules :</P>
        <CodeBlock code={`ALGORITHME_Multi;\nVARIABLES\n  prenom : CHAINE DE CARACTERE;\n  age : ENTIER;\nDEBUT\n  prenom <- "Alice";\n  age <- 25;\n  ECRIRE("Bonjour ", prenom, " ! Tu as ", age, " ans.");\nFIN`} title="multi_args.bql" />
      </LessonSection>

      <WarningCard>
        La variable utilisée dans <Mono color="#fb7185">LIRE(x)</Mono> doit être déclarée AVANT dans VARIABLE(S). Sinon : erreur de variable inconnue.
      </WarningCard>

      <TipCard>
        Toujours ECRIRE une question <em>avant</em> chaque LIRE. L'utilisateur ne sait pas quoi taper sans indication !
      </TipCard>

      <SummaryCard items={[
        'ECRIRE("texte")   affiche dans le terminal',
        'ECRIRE("texte", variable, ...)   combine texte et variables',
        'LIRE(variable)   attend la saisie et la stocke',
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
          <CodeBlock code={`CONSTANTE\n  PI = 3.14159 : REEL;`} title="1 constante" />
          <CodeBlock code={`CONSTANTES\n  TVA = 0.20 : REEL;\n  MAX = 100 : ENTIER;`} title="2+ constantes" />
        </div>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  calculateur de prix TTC" step={2}>
          <VariableStateVisualizer sequence={[
            { name: 'TVA', value: '0.20', op: 'CONSTANTE TVA = 0.20' },
            { name: 'prix_ht', value: 100, op: 'LIRE(prix_ht)' },
            { name: 'taxes', value: 20, op: 'taxes   prix_ht * TVA' },
            { name: 'prix_ttc', value: 120, op: 'prix_ttc   prix_ht + taxes' },
          ]} />
          <CodeBlock code={lesson.example_code} title="constantes.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Ne jamais modifier une constante">
        Tenter <Mono color="#fb7185">PI {'<-'} 3.0</Mono> dans le corps du programme est une erreur. Les constantes sont <em>en lecture seule</em> après déclaration.
      </WarningCard>

      <TipCard title="Convention de nommage">
        Par convention, les constantes sont écrites en <strong>MAJUSCULES</strong> : <Mono color="#facc15">MAX_ESSAIS</Mono>, <Mono color="#facc15">TAUX_CHARGES</Mono>. Pour les distingue visuellement des variables.
      </TipCard>

      <SummaryCard items={[
        'CONSTANTE / CONSTANTES se déclare avant VARIABLE(S)',
        'La valeur est fixée à la déclaration avec =',
        'Impossible de la modifier après déclaration',
        'Convention : noms en MAJUSCULES pour distinguer des variables (optionnel)',
      ]} />
    </div>
  );
};
