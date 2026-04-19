/**
 * suggest.js
 * -----------------------------------------------------------------------------
 * Système de suggestion intelligente par distance de Levenshtein.
 *
 * Compare un mot inconnu à la liste des mots-clés du langage et propose
 * la(les) correspondance(s) la(les) plus proche(s).
 *
 * Ex: "ALOR"  ? "ALORS"
 *     "FINS"  ? "FINSI"
 *     "tantq" ? "TANTQUE"
 * -----------------------------------------------------------------------------
 */

// -- Liste complète des mots-clés du langage ---------------------------------
export const ALL_KEYWORDS = [
  'ALGORITHME', 'VARIABLE', 'VARIABLES', 'DEBUT', 'FIN',
  'SI', 'ALORS', 'SINON', 'SINON SI', 'FINSI',
  'SELON', 'FAIRE',
  'TANTQUE', 'FINTANTQUE',
  'POUR', 'DE', 'A', 'PAS', 'FINPOUR',
  'REPETER', 'JUSQUA',
  'ECRIRE', 'LIRE',
  'ET', 'OU', 'NON',
  'ENTIER', 'REEL', 'CHAINE DE CARACTERE', 'CARACTERE', 'BOOLEEN',
  'VRAI', 'FAUX',
];

// -- Algorithme de Levenshtein ------------------------------------------------

/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 * Complexit? : O(m × n) ? très rapide pour des mots courts.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} Nombre de modifications minimales (insertion/suppression/substitution)
 */
export function levenshtein(a, b) {
  const m  = a.length;
  const n  = b.length;
  // Tableau 2D simplifié en deux rangées
  const dp = Array.from({ length: m + 1 }, (_, i) => i);

  for (let j = 1; j <= n; j++) {
    let prev  = j;
    let prevDiag = j - 1;
    for (let i = 1; i <= m; i++) {
      const temp = dp[i];
      if (a[i - 1] === b[j - 1]) {
        dp[i] = prevDiag;
      } else {
        dp[i] = 1 + Math.min(dp[i - 1], dp[i], prevDiag);
      }
      prevDiag = temp;
    }
    dp[0] = prev;
  }
  return dp[m];
}

// -- Suggestion ---------------------------------------------------------------

/**
 * Retourne les mots-clés les plus proches d'un mot inconnu.
 *
 * @param {string}   word          - Mot à analyser (peut être en minuscules)
 * @param {object}   [options]
 * @param {number}   [options.maxDistance=2]  - Distance max acceptée
 * @param {number}   [options.maxResults=3]   - Nombre max de suggestions
 * @param {string[]} [options.keywords]       - Liste de mots-clés à comparer
 * @returns {string[]} - Liste de suggestions en MAJUSCULES
 */
export function suggest(word, {
  maxDistance = 2,
  maxResults  = 3,
  keywords    = ALL_KEYWORDS,
} = {}) {
  const upper = word.toUpperCase();

  const candidates = keywords
    .map(kw => ({ kw, dist: levenshtein(upper, kw) }))
    .filter(({ dist }) => dist <= maxDistance && dist > 0)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxResults)
    .map(({ kw }) => kw);

  return candidates;
}

/**
 * Retourne une phrase de suggestion prête à l'affichage.
 * ex: "Vouliez-vous écrire ALORS ?"
 *
 * @param {string}   word
 * @param {object}   [options]
 * @returns {string|null}
 */
export function buildHint(word, options) {
  const suggestions = suggest(word, options);
  if (suggestions.length === 0) return null;
  if (suggestions.length === 1) {
    return `Vouliez-vous écrire "${suggestions[0]}" ?`;
  }
  const listed = suggestions.map(s => `"${s}"`).join(', ');
  return `Peut-être : ${listed} ?`;
}

