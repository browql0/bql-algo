import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const InsertionSortVisualizer = ({ array = [8, 4, 6, 2, 9], name = 'T' }) => {
  const steps = [];
  const arr = [...array];
  const n = arr.length;

  steps.push({
    arr: [...arr],
    i: 1,
    j: -1,
    key: null,
    sortedUntil: 0,
    desc: { text: `${name}[0] est considere comme une zone deja triee.`, color: AV_COLORS.neutral },
    vars: [{ name: 'zone triee', value: '0', color: AV_COLORS.found }],
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    steps.push({
      arr: [...arr],
      i,
      j,
      key,
      sortedUntil: i - 1,
      desc: { text: `On prend ${name}[${i}] = ${key} et on cherche sa place dans la zone triee.`, color: AV_COLORS.temp },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'cle', value: key, color: AV_COLORS.temp }],
    });

    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      steps.push({
        arr: [...arr],
        i,
        j,
        key,
        sortedUntil: i - 1,
        shifting: j + 1,
        desc: { text: `${name}[${j}] = ${arr[j]} est plus grand que la cle ${key}. On le decale vers la droite.`, color: AV_COLORS.compare },
        vars: [{ name: 'j', value: j, color: AV_COLORS.compare }, { name: 'cle', value: key, color: AV_COLORS.temp }],
      });
      j--;
    }

    arr[j + 1] = key;
    steps.push({
      arr: [...arr],
      i,
      j: j + 1,
      key,
      sortedUntil: i,
      inserted: j + 1,
      desc: { text: `On insere la cle ${key} en position ${j + 1}. La zone triee grandit.`, color: AV_COLORS.found },
      vars: [{ name: 'position', value: j + 1, color: AV_COLORS.found }, { name: 'cle', value: key, color: AV_COLORS.temp }],
    });
  }

  steps.push({
    arr: [...arr],
    i: -1,
    j: -1,
    key: null,
    sortedUntil: n - 1,
    done: true,
    desc: { text: 'Tableau trie. Chaque valeur a ete inseree a sa bonne place.', color: AV_COLORS.found },
    vars: [],
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 900);
  const cur = steps[step];

  const getState = (i) => {
    if (i === cur.inserted) return 'found';
    if (i === cur.i) return 'active';
    if (i === cur.j || i === cur.shifting) return 'compare';
    if (i <= cur.sortedUntil || cur.done) return 'sorted';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur - Tri par insertion" icon="I"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      {cur.key !== null && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem', padding: '0.35rem 0.6rem', border: `1px solid ${AV_COLORS.temp}55`, borderRadius: '8px', color: AV_COLORS.temp, background: 'rgba(250,204,21,0.08)', fontSize: '0.78rem', fontWeight: 800 }}>
          cle temporaire = {cur.key}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => (
          <ArrayCell key={i} value={v} index={i} name={name} state={getState(i)} swapAnim={i === cur.shifting ?'avSlideRight 0.3s ease' : undefined} />
        ))}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>
        Zone triee : indices 0 a {Math.max(0, cur.sortedUntil)}
      </div>
    </VisualizerWrapper>
  );
};
