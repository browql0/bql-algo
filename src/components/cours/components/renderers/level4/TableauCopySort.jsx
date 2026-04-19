import React from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import {
  ArrayCopyVisualizer,
  BubbleSortVisualizer,
  SortingComplexityVisualizer,
  SelectionSortVisualizer,
  InsertionSortVisualizer,
} from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// tableau_copie
export const TableauCopieRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Photocopier un document : chaque page est copiée une par une. Modifier la photocopie ne change pas l'original. En BQL, copier un tableau = copier chaque case avec une boucle.
      </AnalogieCard>

      <InfoCard title="Copier un tableau  case par case">
        En BQL, on ne peut pas écrire <Mono color="#fb7185">B {'<-'} A</Mono> pour copier un tableau. Il faut recopier chaque élément un par un avec une boucle POUR. Après copie, les deux tableaux sont <em>indépendants</em>.
      </InfoCard>
      <ArrayCopyVisualizer arrayA={[12, 19, 5, 8, 22]} nameA="A" nameB="B" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tab_copie.bql" onTry={tryCode} />}

      <WarningCard title="Pas de copie directe">
        <Mono color="#fb7185">B {'<-'} A</Mono> est INVALIDE pour les tableaux en BQL. Toujours utiliser une boucle.
      </WarningCard>

      <SummaryCard items={[
        'Copier case par case : POUR i ALLANT DE 0 A n-1 FAIRE B[i] <- A[i];',
        'Les deux tableaux sont indépendants après copie',
        'Modifier B ne change pas A et inversement',
      ]} />
    </div>
  );
};

// tableau_tri
export const TableauTriRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Des cartes à jouer en dèsordre. Tu les tries en comparant des paires adjacentes : si la carte de gauche est plus grande que celle de droite, tu les échanges. Tu répètes jusqu'à ce que plus rien ne soit à échanger. C'est le tri à bulles.
      </AnalogieCard>

      <InfoCard title="Tri à bulles  l'algorithme de tri le plus simple">
        Compare des paires d'éléments adjacents et les échange si dans le mauvais ordre. Répèter N fois pour un tableau de taille N garantit le tri.
      </InfoCard>

      <WhyCard>
        Le tri est l'une des opérations les plus fondamentales en informatique. Le tri à bulles n'est pas le plus efficace, mais il est le plus intuitif et le meilleur pour apprendre le principe.
      </WhyCard>

      <StepByStep steps={[
        { label: 'Boucle externe', desc: 'POUR i ALLANT DE 0 A n-2 FAIRE  n-1 passes au total.' },
        { label: 'Boucle interne', desc: 'POUR j ALLANT DE 0 A n-2 FAIRE  compare les pairs adjacents.' },
        { label: 'Comparer', desc: 'SI T[j] > T[j+1] ALORS  est-ce dans le mauvais ordre ?' },
        { label: '0changer', desc: 'temp <- T[j]; T[j] <- T[j+1]; T[j+1] <- temp; (3 lignes obligatoires)' },
      ]} />
      <BubbleSortVisualizer array={[5, 3, 8, 1, 9, 2]} name="T" />
      <SortingComplexityVisualizer algorithm="bubble" />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tri_bulles.bql" onTry={tryCode} />}

      <TipCard title="L'échange nécessite une variable temporaire">
        Pour échanger A et B, il faut temp (<Mono color="#facc15">temp {'<-'} A; A {'<-'} B; B {'<-'} temp</Mono>). Sans temp, l'une des valeurs est perdue !
      </TipCard>

      <SummaryCard items={[
        'Deux boucles imbriquées : externe (passes)  interne (comparaisons)',
        'Comparer T[j] et T[j+1], échanger si T[j] > T[j+1]',
        '0change en 3 étapes : temp <- T[j]; T[j] <- T[j+1]; T[j+1] <- temp;',
        'Après n-1 passes, le tableau est trié en ordre croissant',
      ]} />
    </div>
  );
};

// tri_selection
export const TriSelectionRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine que tu ranges des cartes : tu cherches la plus petite carte dans le tas restant, puis tu la poses a la prochaine place libre. C'est le tri par selection.
      </AnalogieCard>

      <InfoCard title="Tri par selection">
        A chaque passe, on garde l'indice du plus petit element rencontre, puis on l'echange avec le debut de la zone non triee.
      </InfoCard>

      <LessonSection icon={<Layers size={15} />} title="Voir le minimum courant" step={1}>
        <SelectionSortVisualizer array={[29, 10, 14, 37, 13]} name="T" />
        <SortingComplexityVisualizer algorithm="selection" />
      </LessonSection>

      <StepByStep steps={[
        { label: 'Fixer i', desc: 'i marque la premiere case non triee.' },
        { label: 'Chercher min', desc: 'j parcourt le reste du tableau pour trouver le plus petit.' },
        { label: 'Echanger', desc: 'on place le minimum en T[i] avec une variable temporaire.' },
        { label: 'Avancer', desc: 'la zone triee grandit d une case.' },
      ]} />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tri_selection.bql" onTry={tryCode} />}

      <WarningCard title="Erreur frequente">
        Ne confonds pas la <strong>valeur minimale</strong> avec son <strong>indice</strong>. Pour echanger deux cases du tableau, on a besoin de l'indice du minimum.
      </WarningCard>

      <SummaryCard items={[
        'Selection = chercher le minimum de la zone non triee',
        'La zone triee se construit de gauche a droite',
        'L echange final utilise une variable temporaire',
      ]} />
    </div>
  );
};

// tri_insertion
export const TriInsertionRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Quand tu tries des cartes dans ta main, tu prends une nouvelle carte et tu la glisses directement a sa bonne place parmi les cartes deja rangees. C'est le tri par insertion.
      </AnalogieCard>

      <InfoCard title="Tri par insertion">
        La partie gauche du tableau est consideree comme deja triee. On prend une valeur cle, on decale les valeurs plus grandes vers la droite, puis on insere la cle.
      </InfoCard>

      <LessonSection icon={<RefreshCw size={15} />} title="Voir les decalages" step={1}>
        <InsertionSortVisualizer array={[8, 4, 6, 2, 9]} name="T" />
        <SortingComplexityVisualizer algorithm="insertion" />
      </LessonSection>

      <StepByStep steps={[
        { label: 'cle <- T[i]', desc: 'on sauvegardé la valeur a inserer.' },
        { label: 'j <- i - 1', desc: 'on remonte dans la zone deja triee.' },
        { label: 'Decaler', desc: 'tant que T[j] > cle, on pousse T[j] vers la droite.' },
        { label: 'Inserer', desc: 'la cle prend la place liberee.' },
      ]} />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="tri_insertion.bql" onTry={tryCode} />}

      <TipCard title="Pourquoi sauvegarder la cle ?">
        Pendant les decalages, la case d'origine peut etre ecrasee. La variable <Mono color="#facc15">cle</Mono> evite de perdre la valeur a inserer.
      </TipCard>

      <SummaryCard items={[
        'Insertion = placer chaque nouvelle valeur dans une zone deja triee',
        'La boucle TANTQUE decale les valeurs trop grandes',
        'La cle est inseree quand la bonne position est trouvee',
      ]} />
    </div>
  );
};
