import React from 'react';
import { AV_COLORS, VisualizerWrapper } from '../../visualizerShared';

function countSortOperations(algorithm, input) {
  const arr = [...input];
  let comparisons = 0;
  let swaps = 0;
  let passes = 0;

  if (algorithm === 'bubble') {
    for (let i = 0; i < arr.length - 1; i++) {
      let changed = false;
      passes++;
      for (let j = 0; j < arr.length - 1 - i; j++) {
        comparisons++;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swaps++;
          changed = true;
        }
      }
      if (!changed) break;
    }
  } else if (algorithm === 'selection') {
    for (let i = 0; i < arr.length - 1; i++) {
      let min = i;
      passes++;
      for (let j = i + 1; j < arr.length; j++) {
        comparisons++;
        if (arr[j] < arr[min]) min = j;
      }
      if (min !== i) {
        [arr[i], arr[min]] = [arr[min], arr[i]];
        swaps++;
      }
    }
  } else {
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      passes++;
      while (j >= 0) {
        comparisons++;
        if (arr[j] <= key) break;
        arr[j + 1] = arr[j];
        swaps++;
        j--;
      }
      arr[j + 1] = key;
    }
  }

  return { comparisons, swaps, passes };
}

export const SortingComplexityVisualizer = ({ algorithm = 'bubble' }) => {
  const labels = {
    bubble: 'Tri a bulles',
    selection: 'Tri par selection',
    insertion: 'Tri par insertion',
  };
  const samples = [
    { label: 'deja trie', values: [1, 2, 3, 4, 5, 6] },
    { label: 'presque trie', values: [1, 2, 4, 3, 5, 6] },
    { label: 'desordre', values: [6, 2, 5, 1, 4, 3] },
  ].map(sample => ({ ...sample, stats: countSortOperations(algorithm, sample.values) }));
  const growth = [5, 10, 20].map(size => {
    const values = Array.from({ length: size }, (_, index) => size - index);
    return { size, ...countSortOperations(algorithm, values) };
  });
  const maxComparisons = Math.max(...samples.map(item => item.stats.comparisons), ...growth.map(item => item.comparisons));

  return (
    <VisualizerWrapper title={`Visualiseur - Cout du ${labels[algorithm]}`} icon="#"
      description={{ text: 'On compare le nombre de comparaisons, deplacements et passes. Moins de barres signifie moins de travail pour le programme.', color: AV_COLORS.active }}
      variables={samples.map(item => ({ name: item.label, value: `${item.stats.comparisons} comparaisons`, color: item.label === 'desordre' ?AV_COLORS.compare : AV_COLORS.found }))}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {samples.map(sample => (
          <div key={sample.label} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.55rem' }}>{sample.label}</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'end', height: 54, marginBottom: '0.7rem' }}>
              {sample.values.map(value => (
                <div key={`${sample.label}-${value}`} style={{ width: 18, height: `${value * 8}px`, background: 'linear-gradient(180deg,#4f8ff0,#34d399)', borderRadius: '4px 4px 0 0' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.76rem', color: '#94a3b8' }}>
              <span>Comparaisons : <strong style={{ color: AV_COLORS.compare }}>{sample.stats.comparisons}</strong></span>
              <span>Deplacements / echanges : <strong style={{ color: AV_COLORS.temp }}>{sample.stats.swaps}</strong></span>
              <span>Passes : <strong style={{ color: AV_COLORS.found }}>{sample.stats.passes}</strong></span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(11,17,32,0.65)', border: '1px solid rgba(79,143,240,0.2)', borderRadius: '8px', padding: '0.9rem' }}>
        <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.7rem' }}>Quand le tableau grandit</div>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          {growth.map(item => (
            <div key={item.size} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 75px', gap: '0.6rem', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>{item.size} valeurs</span>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(6, (item.comparisons / maxComparisons) * 100)}%`, background: 'linear-gradient(90deg,#facc15,#fb7185)', borderRadius: '8px' }} />
              </div>
              <span style={{ color: AV_COLORS.temp, fontFamily: 'monospace' }}>{item.comparisons}</span>
            </div>
          ))}
        </div>
      </div>
    </VisualizerWrapper>
  );
};
