/**
 * BaseError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Classe d'erreur de base pour le pseudo-langage algorithmique marocain.
 *
 * Toutes les erreurs du système héritent de cette classe.
 * Elle centralise les métadonnées nécessaires à un affichage pédagogique.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class BaseError extends Error {
  /**
   * @param {object} params
   * @param {string}      params.type     - Type d'erreur ('lexical'|'syntax'|'runtime')
   * @param {string}      params.message  - Message principal (court et clair)
   * @param {number}      [params.line]   - Numéro de ligne dans le code source
   * @param {number}      [params.column] - Numéro de colonne
   * @param {string}      [params.value]  - Valeur / token ayant causé l'erreur
   * @param {string}      [params.hint]   - Suggestion ou correction possible
   * @param {string}      [params.codeLine] - La ligne complète du code source
   */
  constructor({ type, message, line = 0, column = 0, value = null, hint = null, codeLine = null }) {
    super(message);
    this.name     = 'AlgoError';
    this.type     = type;
    this.message  = message;
    this.line     = line;
    this.column   = column;
    this.value    = value;
    this.hint     = hint;
    this.codeLine = codeLine;
  }

  /**
   * Représentation brute pour debug (console.error).
   * @returns {string}
   */
  toString() {
    return `[${this.name}:${this.type}] L${this.line}:C${this.column} — ${this.message}`;
  }

  /**
   * Sérialisation JSON propre (pour API / frontend).
   * @returns {object}
   */
  toJSON() {
    return {
      name:     this.name,
      type:     this.type,
      message:  this.message,
      line:     this.line,
      column:   this.column,
      value:    this.value,
      hint:     this.hint,
      codeLine: this.codeLine,
    };
  }
}

export default BaseError;
