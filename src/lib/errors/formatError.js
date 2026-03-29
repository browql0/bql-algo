/**
 * formatError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Formatte une erreur en message lisible et pédagogique pour l'étudiant.
 *
 * Format de sortie (texte brut, compatible terminal et React) :
 *
 *   ❌ Erreur syntaxique — ligne 3, colonne 12
 *
 *   3 │ SI x > 5 ALOR
 *                    ^
 *
 *   Mot-clé invalide : "ALOR"
 *   ✔️  Vouliez-vous écrire "ALORS" ?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Labels par type d'erreur ───────────────────────────────────────────────────
const TYPE_LABELS = {
  lexical:  'Erreur lexicale',
  syntax:   'Erreur syntaxique',
  semantic: 'Erreur sémantique',
  runtime:  'Erreur d\'exécution',
};

// ── formatError ───────────────────────────────────────────────────────────────

/**
 * Formate une erreur en message lisible.
 *
 * @param {import('./BaseError.js').default} error  - Instance de BaseError (ou dérivé)
 * @param {string}  [sourceCode]  - Code source complet (pour extraire la ligne)
 * @param {object}  [options]
 * @param {boolean} [options.emoji=true]  - Afficher les emojis ❌ ✔️
 * @param {boolean} [options.color=false] - Ajouter des codes ANSI (pour terminal)
 * @returns {string}
 */
export function formatError(error, sourceCode = '', { emoji = true, color = false } = {}) {
  const lines = [];

  // ── En-tête ─────────────────────────────────────────────────────────────────
  const label    = TYPE_LABELS[error.type] ?? 'Erreur';
  const position = error.line > 0
    ? ` — ligne ${error.line}, colonne ${error.column}`
    : '';
  const prefix   = emoji ? '❌ ' : '';

  lines.push(prefix + label + position);
  lines.push('');

  // ── Ligne du code source ─────────────────────────────────────────────────────
  const codeLine = error.codeLine ?? _extractLine(sourceCode, error.line);

  if (codeLine !== null) {
    const lineNum   = String(error.line).padStart(3);
    const indicator = `${lineNum} │ `;
    lines.push(indicator + codeLine);

    // Flèche ^ pointant vers la colonne
    if (error.column > 0) {
      const indent = ' '.repeat(indicator.length + Math.max(0, error.column - 1));
      lines.push(indent + '^');
    }
    lines.push('');
  }

  // ── Message principal ────────────────────────────────────────────────────────
  if (error.value !== null && error.value !== undefined) {
    lines.push(`${error.message} : "${error.value}"`);
  } else {
    lines.push(error.message);
  }

  // ── Suggestion / hint ────────────────────────────────────────────────────────
  if (error.hint) {
    const hintPrefix = emoji ? '✔️  ' : '→  ';
    lines.push(hintPrefix + error.hint);
  }

  return lines.join('\n');
}

// ── formatErrors (tableau) ────────────────────────────────────────────────────

/**
 * Formate un tableau d'erreurs en un seul bloc de texte.
 *
 * @param {Array}  errors
 * @param {string} [sourceCode]
 * @param {object} [options]
 * @returns {string}
 */
export function formatErrors(errors, sourceCode = '', options = {}) {
  if (!errors || errors.length === 0) return '';
  return errors
    .map(e => formatError(e, sourceCode, options))
    .join('\n' + '─'.repeat(48) + '\n');
}

// ── Pour React : format structuré ─────────────────────────────────────────────

/**
 * Retourne un objet structuré prêt pour le rendu React.
 *
 * @param {import('./BaseError.js').default} error
 * @param {string} [sourceCode]
 * @returns {{
 *   label: string,
 *   position: string,
 *   codeLine: string|null,
 *   arrow: string|null,
 *   message: string,
 *   hint: string|null,
 *   type: string,
 * }}
 */
export function formatErrorReact(error, sourceCode = '') {
  const label    = TYPE_LABELS[error.type] ?? 'Erreur';
  const position = error.line > 0 ? `Ligne ${error.line}, colonne ${error.column}` : '';
  const codeLine = error.codeLine ?? _extractLine(sourceCode, error.line);
  const arrow    = (codeLine !== null && error.column > 0)
    ? ' '.repeat(Math.max(0, error.column - 1)) + '^'
    : null;
  const message  = (error.value !== null && error.value !== undefined)
    ? `${error.message} : "${error.value}"`
    : error.message;

  return {
    // Champs pour le rendu React
    label,
    position,
    codeLine,
    arrow,
    message,
    hint:   error.hint  ?? null,
    type:   error.type,

    // Champs numériques pour le tri dans ErrorPanel (sans recalcul)
    line:   error.line   ?? 0,
    column: error.column ?? 0,
  };
}

// ── Helper interne ────────────────────────────────────────────────────────────

/**
 * Extrait la ligne numéro `lineNumber` (1-indexée) du code source.
 * @param {string} source
 * @param {number} lineNumber
 * @returns {string|null}
 */
function _extractLine(source, lineNumber) {
  if (!source || lineNumber <= 0) return null;
  const lines = source.split('\n');
  return lines[lineNumber - 1] ?? null;
}
