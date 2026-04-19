import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const SelectionSortVisualizer = ({ array = [29, 10, 14, 37, 13], name = 'T' }) => {
  const steps = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    arr: [...arr],
    i: -1,
    j: -1,
    minIdx: -1,
    sortedUntil: -1,
    desc: { text: 'Tableau initial. Le tri par selection cherche le minimum de la zone non triee.', color: AV_COLORS.neutral },
    vars: [],
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({
      arr: [...arr],
      i,
      j: i,
      minIdx,
      sortedUntil: i - 1,
      desc: { text: `On commence une nouvelle passe : le minimum provisoire est ${name}[${i}] = ${arr[i]}.`, color: AV_COLORS.temp },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'min', value: minIdx, color: AV_COLORS.temp }],
    });

    for (let j = i + 1; j < n; j++) {
      const foundNewMin = arr[j] < arr[minIdx];
      steps.push({
        arr: [...arr],
        i,
        j,
        minIdx,
        sortedUntil: i - 1,
        desc: foundNewMin
          ?{ text: `${name}[${j}] = ${arr[j]} est plus petit que ${name}[${minIdx}] = ${arr[minIdx]}. Nouveau minimum.`, color: AV_COLORS.compare }
          : { text: `${name}[${j}] = ${arr[j]} n'est pas plus petit que le minimum courant (${arr[minIdx]}).`, color: AV_COLORS.active },
        vars: [
          { name: 'i', value: i, color: AV_COLORS.active },
          { name: 'j', value: j, color: AV_COLORS.compare },
          { name: 'min', value: foundNewMin ?j : minIdx, color: AV_COLORS.temp },
        ],
      });
      if (foundNewMin) minIdx = j;
    }

    if (minIdx !== i) {
      const tmp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = tmp;
      steps.push({
        arr: [...arr],
        i,
        j: minIdx,
        minIdx: i,
        sortedUntil: i,
        swapping: true,
        desc: { text: `On echange le minimum avec ${name}[${i}]. La case ${i} est maintenant triee.`, color: AV_COLORS.found },
        vars: [{ name: 'min place', value: arr[i], color: AV_COLORS.found, changed: true }],
      });
    } else {
      steps.push({
        arr: [...arr],
        i,
        j: i,
        minIdx: i,
        sortedUntil: i,
        desc: { text: `Le minimum etait deja a la position ${i}. La case est validee.`, color: AV_COLORS.found },
        vars: [{ name: `${name}[${i}]`, value: arr[i], color: AV_COLORS.found }],
      });
    }
  }

  steps.push({
    arr: [...arr],
    i: -1,
    j: -1,
    minIdx: -1,
    sortedUntil: n - 1,
    done: true,
    desc: { text: 'Tableau trie. La zone triee a grandi de gauche a droite.', color: AV_COLORS.found },
    vars: [],
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 900);
  const cur = steps[step];

  const getState = (i) => {
    if (i <= cur.sortedUntil || cur.done) return 'sorted';
    if (i === cur.minIdx) return 'temp';
    if (i === cur.i) return 'active';
    if (i === cur.j) return 'compare';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur : Tri par selection" icon="S"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => (
          <ArrayCell key={i} value={v} index={i} name={name} state={getState(i)} swapAnim={cur.swapping && (i === cur.i || i === cur.j) ?'avSwapUp 0.3s ease' : undefined} />
        ))}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>
        Zone triee : {cur.sortedUntil >= 0 ?`indices 0 a ${cur.sortedUntil}` : 'aucune pour le moment'}
      </div>
    </VisualizerWrapper>
  );
};
