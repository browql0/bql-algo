/**
 * outputUtils.js
 * 
 * Utilitaires pour la normalisation et la comparaison robuste des sorties
 * dans le système de validation BQL Algo.
 */

/**
 * Normalise une chaîne de caractères pour une comparaison logique brute.
 * - Supprime les espaces au début et à la fin.
 * - Normalise les retours à la ligne (\r\n -> \n).
 * - Remplace les suites d'espaces/tabulations par un seul espace.
 * - Normalise les nombres (ex: "100.0" -> "100", "0.50" -> "0.5").
 * 
 * @param {string} str - La chaîne à normaliser.
 * @returns {string} - La chaîne normalisée.
 */
export function normalizeString(str) {
  if (typeof str !== 'string') return '';

  // 1. Trim et normalisation des retours à la ligne / tous types d'espaces (\s)
  let normalized = str
    .replace(/\r\n/g, '\n')      // \r\n -> \n
    .replace(/\s+/g, ' ')        // tous types d'espaces (inc. insécables) -> un seul espace
    .split('\n')
    .map(line => line.trim())    // trim chaque ligne
    .filter(line => line !== '') // Supprimer les lignes vides pour la comparaison logique
    .join('\n')
    .trim();

  // 2. Normalisation intelligente des nombres
  // Cherche des patterns numériques et les réduit à leur forme minimale
  normalized = normalized.replace(/(\d+)\.(\d+)/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    return num.toString();
  });

  return normalized;
}

/**
 * Compare deux sorties de manière robuste.
 * 
 * @param {string} got - Sortie obtenue.
 * @param {string} expected - Sortie attendue.
 * @returns {object} - { passed: boolean, isAmbiguous: boolean }
 *                     isAmbiguous est vrai si l'égalit? ?choue brutalement 
 *                     mais réussit après normalisation extrême.
 */
export function compareOutputs(got, expected) {
  const g = String(got || '');
  const e = String(expected || '');

  // 1. Comparaison triviale (déjà fait par le trim() actuel dans le code)
  if (g.trim() === e.trim()) return { passed: true, isAmbiguous: false };

  // 2. Comparaison normalisée
  const normGot = normalizeString(g);
  const normExp = normalizeString(e);

  if (normGot === normExp) {
    return { passed: true, isAmbiguous: false };
  }

  // 3. Détection d'ambiguïté visuelle
  // Si les chaînes "semblent" identiques mais different par des caractères invisibles 
  // que normalizeString n'a pas géré (cas rares comme des caractères ZWSP)
  // ou si la différence est juste une question de casse ?(On ne normalise pas la casse par défaut)
  
  // On considère ambigu si visuellement (sans espaces) c'est très proche
  const superNormGot = normGot.replace(/\s/g, '');
  const superNormExp = normExp.replace(/\s/g, '');
  
  const isAmbiguous = superNormGot === superNormExp && normGot !== normExp;

  return { passed: false, isAmbiguous };
}

/**
 * Extrait tous les nombres d'une chaîne.
 * Ex: "Invalide 30 DH" -> [30]
 * Ex: "Résultat: 1200.5" -> [1200.5]
 * @param {string} str
 * @returns {number[]}
 */
export function extractNumbers(str) {
  const matches = String(str || '').match(/[+-]?\d+(?:[.,]\d+)?/g) || [];
  return matches.map(n => parseFloat(n.replace(',', '.')));
}

/**
 * Vérifie si deux chaînes contiennent les mêmes valeurs numériques.
 * Logique : les nombres extraits de `got` doivent tous figurer dans `expected`.
 *
 * @param {string} got
 * @param {string} expected
 * @returns {boolean}
 */
export function numericMatch(got, expected) {
  const numsExp = extractNumbers(expected);
  const numsGot = extractNumbers(got);
  if (numsExp.length === 0) return false; // pas de nombre à comparer
  // Chaque nombre attendu doit se trouver dans les nombres obtenus
  return numsExp.every(n => numsGot.some(g => Math.abs(g - n) < 0.001));
}

/**
 * Retourne des informations de base sur les différences entre deux chaînes (comme la longueur).
 * Utilis? pour enrichir les retours d'erreurs d'ambiguïté.
 *
 * @param {string} got
 * @param {string} expected
 * @returns {object}
 */
export function getStringDiffInfo(got, expected) {
  return {
    gotLength: String(got || '').length,
    expectedLength: String(expected || '').length
  };
}

