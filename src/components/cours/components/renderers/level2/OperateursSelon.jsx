import React from 'react';
import { Code2, Hash, GitBranch } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { BooleanLogicVisualizer, SelonComparisonVisualizer } from '../../../visualizers';
import { Mono, TeacherRubricPanel } from '../../common/LessonRendererShared';

// operateurs_logiques
export const OperateursLogiquesRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Pour accèder à un avion : tu dois AVOIR ton passeport <strong>ET</strong> ton billet <strong>ET</strong> être là à l'heure. Si UNE condition manque, tu ne montes pas. Avec OU : une salle accepte les étudiants <strong>OU</strong> les enseignants (un seul suffit).
      </AnalogieCard>

      <InfoCard title="ET, OU, NON  les connecteurs logiques">
        Les opérateurs logiques combinent des conditions pour former des expressions booléennes complexes.
      </InfoCard>

      <LessonSection icon={<Hash size={15} />} title="Tables de vérité" step={1}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { op: 'ET', rows: [['VRAI', 'VRAI', '#34d399', 'VRAI'], ['VRAI', 'FAUX', '#fb7185', 'FAUX'], ['FAUX', 'VRAI', '#fb7185', 'FAUX'], ['FAUX', 'FAUX', '#fb7185', 'FAUX']] },
            { op: 'OU', rows: [['VRAI', 'VRAI', '#34d399', 'VRAI'], ['VRAI', 'FAUX', '#34d399', 'VRAI'], ['FAUX', 'VRAI', '#34d399', 'VRAI'], ['FAUX', 'FAUX', '#fb7185', 'FAUX']] },
          ].map(({ op, rows }) => (
            <div key={op} style={{ flex: 1, minWidth: '200px', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#4f8ff0', fontSize: '0.85rem' }}>{op}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['A', 'B', 'A ' + op + ' B'].map(h => <th key={h} style={{ padding: '0.4rem 0.8rem', color: '#475569', fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([a, b, c, r], i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.35rem 0.8rem', color: a === 'VRAI' ?'#34d399' : '#fb7185', fontFamily: 'monospace', textAlign: 'center' }}>{a}</td>
                      <td style={{ padding: '0.35rem 0.8rem', color: b === 'VRAI' ?'#34d399' : '#fb7185', fontFamily: 'monospace', textAlign: 'center' }}>{b}</td>
                      <td style={{ padding: '0.35rem 0.8rem', color: c, fontFamily: 'monospace', textAlign: 'center', fontWeight: 700 }}>{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <InfoCard color="#fb7185" title="NON  inversion" style={{ marginTop: '1rem' }}>
          <Mono color="#fb7185">NON VRAI = FAUX</Mono> &nbsp; | &nbsp; <Mono color="#34d399">NON FAUX = VRAI</Mono><br />
          Utile pour écrire des conditions négatives : <Mono color="#fb7185">SI NON inscrit ALORS ECRIRE("Inscrivez-vous !");</Mono>
        </InfoCard>
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Expérimenter avec les portes logiques" step={1.5}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
          <BooleanLogicVisualizer operator="ET" />
          <BooleanLogicVisualizer operator="OU" />
        </div>
      </LessonSection>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple complet" step={2}>
          <CodeBlock code={lesson.example_code} title="op_logiques.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <WarningCard title="Priorité des opérateurs logiques">
        L'ordre d'évaluation : <Mono color="#fb7185">NON</Mono> en premier, puis <Mono color="#facc15">ET</Mono>, puis <Mono color="#a78bfa">OU</Mono>. Utilise des parenthèses pour lever toute ambiguïté : <Mono color="#34d399">(A OU B) ET C</Mono>.
      </WarningCard>

      <SummaryCard items={[
        'ET : les DEUX conditions doivent être VRAIES',
        'OU : au moins UNE condition suffit',
        'NON : inverse la valeur booléenne',
        'Priorité : NON > ET > OU  utiliser les parenthèses !',
      ]} />
    </div>
  );
};

// selon
export const SelonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un menu de restaurant : <strong>SELON le numéro de commande</strong>, le serveur apporte CAS 1 une entrée, CAS 2 un plat, CAS 3 un dessert. Si le numéro n'existe pas   AUTRE : "Ce plat n'est pas disponible."
      </AnalogieCard>

      <InfoCard title="SELON  sélection multiple">
        <strong>SELON</strong> évalue une variable et exécute le <strong>CAS</strong> correspondant à sa valeur exacte. <strong>AUTRE</strong> est le cas par défaut. C'est l'équivalent du <em>switch</em> en Python/JS.
      </InfoCard>

      <WhyCard>
        Quand on a 5, 10, 15 valeurs possibles à tester, utiliser SINONSI devient vite illisible. SELON est plus propre, plus lisible, et indique clairement qu'on teste une seule variable contre plusieurs valeurs exactes.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure SELON" step={1}>
        <CodeBlock code={`SELON variable FAIRE\n  CAS valeur1:\n    // instructions\n  CAS valeur2:\n    // instructions\n  AUTRE:\n    // cas par défaut\nFINSELON`} title="structure_selon.bql" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="selon.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<GitBranch size={15} />} title="SELON vs SI/SINON  quand utiliser quoi ?" step={2}>
        <SelonComparisonVisualizer />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#4f8ff0" title="Utilisez SELON">
            Quand vous testez une variable contre des <strong>valeurs exactes</strong> (1, 2, 3, "rouge", "bleu"...)
          </InfoCard>
          <InfoCard color="#a78bfa" title="Utilisez SI/SINONSI">
            Quand vous testez des <strong>plages ou intervalles</strong> ({">"} 10, {"<="} 18, entre 5 et 10...)
          </InfoCard>
        </div>
      </LessonSection>

      <WarningCard>
        Le bloc SELON se ferme avec <Mono color="#fb7185">FINSELON</Mono> (pas FINSI). Et chaque CAS se termine par des deux-points <Mono color="#fb7185">:</Mono>.
      </WarningCard>

      <SummaryCard items={[
        'SELON variable FAIRE ... FINSELON',
        'CAS valeur:   branche pour une valeur exacte',
        'AUTRE:   branche par défaut (si aucun CAS ne correspond)',
        'Préférer SELON quand on teste une variable contre des valeurs exactes',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};

// selon_imbrique
export const SelonImbriqueeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="SELON imbriqué  deux niveaux de sélection">
        Un CAS peut contenir d'autres conditions à l'intérieur. Utile pour des logiques à deux niveaux (catégorie + sous-catégorie, type + niveau...).
      </InfoCard>
      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple  catégorie + niveau" step={1}>
          <CodeBlock code={lesson.example_code} title="selon_imbrique.bql" onTry={tryCode} />
        </LessonSection>
      )}
      <TipCard>Dans un CAS, utilisez des SI/SINON normaux plutôt qu'un SELON imbriqué si cela suffit. Gardez SELON pour les sélections sur valeurs exactes.</TipCard>
      <SummaryCard items={[
        'Un CAS peut contenir des SI/SINON',
        'Fermer avec FINSI (SI internes) et FINSELON (SELON externe)',
        'Garder une indentation claire pour ne pas se perdre',
      ]} />
    </div>
  );
};
