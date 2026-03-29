/**
 * Token.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Représente une unité lexicale (token) produite par le lexer.
 * Chaque token porte :
 *   - type    : constante de TokenType
 *   - value   : la valeur brute lue dans le source
 *   - line    : numéro de ligne (1-indexé)
 *   - column  : numéro de colonne (1-indexé)
 * ─────────────────────────────────────────────────────────────────────────────
 */

class Token {
  /**
   * @param {string} type   - Type du token (cf. TokenType)
   * @param {*}      value  - Valeur du token (string, number, boolean, null…)
   * @param {number} line   - Ligne dans le code source (1-indexé)
   * @param {number} column - Colonne dans le code source (1-indexé)
   */
  constructor(type, value, line, column) {
    this.type   = type;
    this.value  = value;
    this.line   = line;
    this.column = column;
  }

  /**
   * Représentation lisible pour le débogage.
   * @returns {string}
   */
  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, L${this.line}:C${this.column})`;
  }

  /**
   * Sérialisation JSON propre.
   * @returns {object}
   */
  toJSON() {
    return {
      type:   this.type,
      value:  this.value,
      line:   this.line,
      column: this.column,
    };
  }
}

export default Token;
