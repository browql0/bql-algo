/**
 * SyntaxError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Erreur produite par le Parser quand la grammaire n'est pas respectée.
 *
 * Exemples :
 *  - Mot-clé attendu mais absent : ALORS manquant après SI condition
 *  - Token inattendu : FINSI sans SI correspondant
 *  - Expression invalide
 *
 * Note : le nom de classe est AlgoSyntaxError pour éviter le conflit avec le
 * SyntaxError intégré de JavaScript.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import BaseError     from './BaseError.js';
import { buildHint } from './suggest.js';

class AlgoSyntaxError extends BaseError {
  /**
   * @param {object} params
   * @param {string}  params.message
   * @param {number}  params.line
   * @param {number}  params.column
   * @param {string}  [params.value]    - Token trouvé (pour la suggestion)
   * @param {string}  [params.expected] - Ce qui était attendu
   * @param {string}  [params.hint]
   * @param {string}  [params.codeLine]
   */
  constructor({ message, line, column, value = null, expected = null, hint = null, codeLine = null }) {
    // Enrichit le message avec ce qui était attendu
    const fullMessage = expected
      ? `${message} — Attendu : "${expected}"`
      : message;

    // Suggestion automatique sur la valeur trouvée
    const autoHint = hint ??
      (value && /^[a-zA-ZÀ-ÿ_]+$/.test(value) ? buildHint(value) : null);

    super({
      type: 'syntax',
      message: fullMessage,
      line,
      column,
      value,
      hint: autoHint,
      codeLine,
    });
    this.name     = 'SyntaxError';
    this.expected = expected;
  }
}

export default AlgoSyntaxError;
