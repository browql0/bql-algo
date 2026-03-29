/**
 * LexicalError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Erreur produite par le Lexer quand il rencontre un caractère ou une séquence
 * qu'il ne sait pas tokeniser.
 *
 * Exemples :
 *  - Caractère inconnu : @, $, #
 *  - Chaîne non fermée : "Bonjour
 *  - Caractère non terminé : 'ab
 * ─────────────────────────────────────────────────────────────────────────────
 */

import BaseError    from './BaseError.js';
import { buildHint } from './suggest.js';

class LexicalError extends BaseError {
  /**
   * @param {object} params
   * @param {string} params.message  - Message clair sur ce qui ne va pas
   * @param {number} params.line
   * @param {number} params.column
   * @param {string} [params.value]  - Le caractère / token problématique
   * @param {string} [params.hint]   - Suggestion manuelle (facultatif)
   * @param {string} [params.codeLine]
   */
  constructor({ message, line, column, value = null, hint = null, codeLine = null }) {
    // Tente une suggestion automatique si le value ressemble à un mot
    const autoHint = hint ??
      (value && /^[a-zA-ZÀ-ÿ]+$/.test(value) ? buildHint(value) : null);

    super({
      type: 'lexical',
      message,
      line,
      column,
      value,
      hint: autoHint,
      codeLine,
    });
    this.name = 'LexicalError';
  }
}

export default LexicalError;
