/**
 * Lexer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyseur lexical (tokenizer) pour le pseudo-langage algorithmique marocain.
 *
 * Entrée  : chaîne de caractères (code source)
 * Sortie  : tableau de Token  (cf. Token.js / TokenType)
 *
 * Fonctionnalités :
 *  - Mots-clés simples et composés (ex. "SINONSI", "SINON SI", "CHAINE DE CARACTERE")
 *  - Nombres entiers et réels
 *  - Chaînes de caractères entre guillemets doubles
 *  - Caractères entre guillemets simples
 *  - Commentaires sur une ligne (//)
 *  - Opérateur d'affectation <- et ←
 *  - Tous les opérateurs arithmétiques, logiques et de comparaison
 *  - Gestion des retours à la ligne (NEWLINE)
 *  - Position exacte (ligne, colonne) pour chaque token
 *  - Collecte d'erreurs lexicales sans arrêter l'analyse
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Token from './Token.js';
import TokenType from './tokenTypes.js';
import LexicalError from '../errors/LexicalError.js';
import scannerMethods from './parts/scanner.js';
import literalMethods from './parts/literals.js';
import identifierMethods from './parts/identifiers.js';
import operatorMethods from './parts/operators.js';

// ── Classe principale ──────────────────────────────────────────────────────────
class Lexer {
  /**
   * @param {string} source - Code source complet à analyser
   */
  constructor(source) {
    /** @type {string} */ this.source  = source;
    /** @type {number} */ this.pos     = 0;       // position courante dans source
    /** @type {number} */ this.line    = 1;        // ligne courante  (1-indexée)
    /** @type {number} */ this.column  = 1;        // colonne courante (1-indexée)
    /** @type {Token[]}         */ this.tokens = [];
    /** @type {LexicalError[]}  */ this.errors  = [];
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  /**
   * Lance l'analyse et retourne les tokens produits.
   * @returns {{ tokens: Token[], errors: LexicalError[] }}
   */
  tokenize() {
    while (!this.isAtEnd()) {
      this._scanToken();
    }
    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return { tokens: this.tokens, errors: this.errors };
  }

  // ── Navigation dans la source ─────────────────────────────────────────────────

  /** Caractère courant sans avancer. */
  _current() {
    return this.source[this.pos];
  }

  /** Caractère suivant sans avancer (look-ahead de 1). */
  _peek(offset = 1) {
    const idx = this.pos + offset;
    return idx < this.source.length ? this.source[idx] : '\0';
  }

  /** Avance d'un caractère et met à jour ligne/colonne. */
  _advance() {
    const ch = this.source[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  /** Consomme le caractère courant si il correspond à `expected`. */
  _match(expected) {
    if (this.isAtEnd() || this._current() !== expected) return false;
    this._advance();
    return true;
  }

  /** Vrai si on a atteint la fin de la source. */
  isAtEnd() {
    return this.pos >= this.source.length;
  }

  // ── Helpers de classification ──────────────────────────────────────────────────

  _isDigit(ch)     { return ch >= '0' && ch <= '9'; }
  _isAlpha(ch)     { return /[a-zA-ZÀ-ÿ_]/.test(ch); }
  _isAlphaNum(ch)  { return this._isAlpha(ch) || this._isDigit(ch); }
  _isWhitespace(ch){ return ch === ' ' || ch === '\t' || ch === '\r'; }

  // ── Gestion des erreurs ───────────────────────────────────────────────────────

  /**
   * Enregistre une erreur lexicale sans interrompre l'analyse.
   */
  _addError(message, line, column, char) {
    this.errors.push(new LexicalError({
      message,
      line,
      column,
      value: char,
      codeLine: this.source.split('\n')[line - 1] ?? null
    }));
  }
}

Object.assign(
  Lexer.prototype,
  scannerMethods,
  literalMethods,
  identifierMethods,
  operatorMethods,
);

export default Lexer;
