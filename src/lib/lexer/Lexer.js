/**
 * Lexer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyseur lexical (tokenizer) pour le pseudo-langage algorithmique marocain.
 *
 * Entrée  : chaîne de caractères (code source)
 * Sortie  : tableau de Token  (cf. Token.js / TokenType)
 *
 * Fonctionnalités :
 *  - Mots-clés simples et composés (ex. "SINON SI", "CHAINE DE CARACTERE")
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

import Token                                    from './Token.js';
import TokenType                                from './tokenTypes.js';
import { SIMPLE_KEYWORDS, COMPOUND_KEYWORDS, getBooleanValue } from './keywords.js';

import LexicalError                           from '../errors/LexicalError.js';

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

  // ── Scan principal ─────────────────────────────────────────────────────────────

  _scanToken() {
    const ch    = this._current();
    const line  = this.line;
    const col   = this.column;

    // ── Espaces et tabulations (ignorés, pas de token) ──────────────────────
    if (this._isWhitespace(ch)) {
      this._advance();
      return;
    }

    // ── Retour à la ligne ────────────────────────────────────────────────────
    if (ch === '\n') {
      // On ne génère pas de NEWLINE consécutifs
      if (this.tokens.length === 0 ||
          this.tokens[this.tokens.length - 1].type === TokenType.NEWLINE) {
        this._advance();
        return;
      }
      this._advance();
      this.tokens.push(new Token(TokenType.NEWLINE, '\n', line, col));
      return;
    }

    // ── Commentaires sur une ligne (//) ──────────────────────────────────────
    if (ch === '/' && this._peek() === '/') {
      this._skipLineComment();
      return;
    }

    // ── Nombres ──────────────────────────────────────────────────────────────
    if (this._isDigit(ch)) {
      this._readNumber(line, col);
      return;
    }

    // ── Chaînes et caractères ────────────────────────────────────────────────
    if (ch === '"') { this._readString(line, col); return; }
    if (ch === "'") { this._readChar(line, col);   return; }

    // ── Identificateurs et mots-clés ─────────────────────────────────────────
    if (this._isAlpha(ch)) {
      this._readIdentifierOrKeyword(line, col);
      return;
    }

    // ── Opérateur d'affectation unicode ← ───────────────────────────────────
    if (ch === '←') {
      this._advance();
      this.tokens.push(new Token(TokenType.ASSIGN, '←', line, col));
      return;
    }

    // ── Opérateurs et symboles ────────────────────────────────────────────────
    this._readOperatorOrSymbol(line, col);
  }

  // ── Commentaire sur une ligne ─────────────────────────────────────────────────

  _skipLineComment() {
    // Consomme jusqu'à la fin de la ligne (sans consommer le \n)
    while (!this.isAtEnd() && this._current() !== '\n') {
      this._advance();
    }
  }

  // ── Nombres (entiers et réels) ────────────────────────────────────────────────

  _readNumber(line, col) {
    let raw = '';

    while (!this.isAtEnd() && this._isDigit(this._current())) {
      raw += this._advance();
    }

    // Partie décimale ?
    if (!this.isAtEnd() && this._current() === '.' &&
        this._isDigit(this._peek())) {
      raw += this._advance(); // consomme '.'
      while (!this.isAtEnd() && this._isDigit(this._current())) {
        raw += this._advance();
      }
      this.tokens.push(new Token(TokenType.NUMBER, parseFloat(raw), line, col));
    } else {
      this.tokens.push(new Token(TokenType.NUMBER, parseInt(raw, 10), line, col));
    }
  }

  // ── Chaîne de caractères ──────────────────────────────────────────────────────

  _readString(line, col) {
    this._advance(); // consomme le guillemet ouvrant "
    let value = '';
    let closed = false;

    while (!this.isAtEnd()) {
      const ch = this._current();

      if (ch === '\n') break; // chaîne non terminée

      if (ch === '"') {
        this._advance(); // consomme "
        closed = true;
        break;
      }

      // Séquences d'échappement simples
      if (ch === '\\') {
        this._advance();
        const esc = this._advance();
        switch (esc) {
          case 'n':  value += '\n'; break;
          case 't':  value += '\t'; break;
          case '"':  value += '"';  break;
          case '\\': value += '\\'; break;
          default:   value += '\\' + esc;
        }
        continue;
      }

      value += this._advance();
    }

    if (!closed) {
      this._addError(`Chaîne non terminée`, line, col, '"');
    }

    this.tokens.push(new Token(TokenType.STRING, value, line, col));
  }

  // ── Caractère simple ──────────────────────────────────────────────────────────

  _readChar(line, col) {
    this._advance(); // consomme '
    let value = '';

    if (!this.isAtEnd() && this._current() !== "'") {
      // Séquence d'échappement ?
      if (this._current() === '\\') {
        this._advance();
        const esc = this._advance();
        switch (esc) {
          case 'n':  value = '\n'; break;
          case 't':  value = '\t'; break;
          case "'":  value = "'";  break;
          case '\\': value = '\\'; break;
          default:   value = '\\' + esc;
        }
      } else {
        value = this._advance();
      }
    }

    if (this.isAtEnd() || this._current() !== "'") {
      this._addError(`Caractère non terminé ou trop long`, line, col, "'");
    } else {
      this._advance(); // consomme '
    }

    this.tokens.push(new Token(TokenType.CHAR, value, line, col));
  }

  // ── Identificateurs et mots-clés ─────────────────────────────────────────────

  /**
   * Lit un mot (séquence de caractères alphanumériques).
   * Vérifie ensuite si c'est un mot-clé composé, un mot-clé simple,
   * une valeur booléenne ou un identifiant.
   *
   * Règle spéciale ALGORITHME :
   *  Le nom peut être collé directement ou séparé par un underscore :
   *    ALGORITHMECALCULMOYENNE   →  ALGORITHME + IDENTIFIER(CALCULMOYENNE)
   *    ALGORITHME_CALCULMOYENNE  →  ALGORITHME + IDENTIFIER(CALCULMOYENNE)
   * 
   * Règle importante : Les mots-clés ne sont reconnus que s'ils sont en MAJUSCULES.
   * Cela permet d'utiliser des variables en minuscules comme 'a', 'i', 'x', etc.
   * Les mots-clés doivent être écrits en majuscules : DEBUT, FIN, LIRE, ECRIRE, etc.
   */
  _readIdentifierOrKeyword(line, col) {
    // Lit le premier mot (inclut les underscores)
    let firstWord = this._readWord();
    const firstWordUpper = firstWord.toUpperCase();

    // ── Règle spéciale : ALGORITHME collé avec le nom ─────────────────────────
    // Ex: "ALGORITHMECALCULMOYENNE" ou "ALGORITHME_CALCULMOYENNE"
    if (firstWordUpper.startsWith('ALGORITHME') && firstWordUpper.length > 10) {
      const rest = firstWord.slice(10); // tout ce qui suit "ALGORITHME"
      // Ignorer un éventuel underscore séparateur en tête
      const name = rest.startsWith('_') ? rest.slice(1) : rest;
      this.tokens.push(new Token(TokenType.ALGORITHME, 'ALGORITHME', line, col));
      if (name.length > 0) {
        // La colonne du nom commence après ALGORITHME (+ éventuel _)
        const nameCol = col + 10 + (rest.startsWith('_') ? 1 : 0);
        this.tokens.push(new Token(TokenType.IDENTIFIER, name, line, nameCol));
      }
      return;
    }

    // ── Tentative de correspondance avec un mot-clé composé ─────────────────
    // Les mots-clés sont insensibles à la casse, donc on vérifie `firstWordUpper`
    let compound = this._tryMatchCompoundKeyword(firstWordUpper, line, col);
    if (compound) return;

    // ── Mot-clé simple ───────────────────────────────────────────────────────
    if (SIMPLE_KEYWORDS.has(firstWordUpper)) {
      const tokenType = SIMPLE_KEYWORDS.get(firstWordUpper);

      // Cas spécial : VRAI / FAUX → token BOOLEAN avec valeur booléenne
      if (tokenType === TokenType.BOOLEAN) {
        const boolVal = getBooleanValue(firstWordUpper);
        this.tokens.push(new Token(TokenType.BOOLEAN, boolVal, line, col));
      } else {
        this.tokens.push(new Token(tokenType, firstWord, line, col));
      }
      return;
    }

    // ── Identifiant (variable, etc.) ─────────────────────────────────────────
    this.tokens.push(new Token(TokenType.IDENTIFIER, firstWord, line, col));
  }

  /**
   * Lit une séquence de caractères alphanum / underscore (un seul mot).
   * @returns {string}
   */
  _readWord() {
    let word = '';
    while (!this.isAtEnd() && this._isAlphaNum(this._current())) {
      word += this._advance();
    }
    return word;
  }

  /**
   * Essaie de faire correspondre un mot-clé composé en lookahead.
   * Si trouvé, consomme les espaces et les mots supplémentaires,
   * puis émet le token.
   * @param {string} firstWord - Premier mot en MAJUSCULES déjà lu
   * @param {number} line
   * @param {number} col
   * @returns {boolean} true si un mot-clé composé a été trouvé
   */
  _tryMatchCompoundKeyword(firstWord, line, col) {
    for (const compound of COMPOUND_KEYWORDS) {
      if (compound.words[0] !== firstWord) continue;

      // Sauvegarde de la position au cas où on doit reculer
      const savedPos    = this.pos;
      const savedLine   = this.line;
      const savedColumn = this.column;

      let matched = true;

      // Tente de lire les mots suivants
      for (let i = 1; i < compound.words.length; i++) {
        // Saute les espaces
        while (!this.isAtEnd() && this._isWhitespace(this._current())) {
          this._advance();
        }

        if (this.isAtEnd()) { matched = false; break; }

        const nextWord = this._readWord().toUpperCase();
        if (nextWord !== compound.words[i]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        // Construit la valeur affichée (mots joints)
        const displayValue = compound.words.join(' ');
        this.tokens.push(new Token(compound.type, displayValue, line, col));
        return true;
      }

      // Recule si la correspondance a échoué
      this.pos    = savedPos;
      this.line   = savedLine;
      this.column = savedColumn;
    }

    return false;
  }

  // ── Opérateurs et symboles ────────────────────────────────────────────────────

  _readOperatorOrSymbol(line, col) {
    const ch = this._advance();

    switch (ch) {
      // ── Affectation ou inférieur ──────────────────────────────────────────
      case '<':
        if (this._match('-')) {
          this.tokens.push(new Token(TokenType.ASSIGN, '<-', line, col));
        } else if (this._match('=')) {
          this.tokens.push(new Token(TokenType.LTE,   '<=', line, col));
        } else {
          this.tokens.push(new Token(TokenType.LT,    '<',  line, col));
        }
        break;

      // ── Supérieur ─────────────────────────────────────────────────────────
      case '>':
        if (this._match('=')) {
          this.tokens.push(new Token(TokenType.GTE, '>=', line, col));
        } else {
          this.tokens.push(new Token(TokenType.GT,  '>',  line, col));
        }
        break;

      // ── Inégalité ─────────────────────────────────────────────────────────
      case '!':
        if (this._match('=')) {
          this.tokens.push(new Token(TokenType.NE, '!=', line, col));
        } else {
          this._addError(`'!' seul n'est pas valide, utilisez '!='`, line, col, ch);
        }
        break;

      // ── Égalité ───────────────────────────────────────────────────────────
      case '=':
        this.tokens.push(new Token(TokenType.EQ, '=', line, col));
        break;

      // ── Arithmétique ──────────────────────────────────────────────────────
      case '+': this.tokens.push(new Token(TokenType.PLUS,     '+', line, col)); break;
      case '-': this.tokens.push(new Token(TokenType.MINUS,    '-', line, col)); break;
      case '*': this.tokens.push(new Token(TokenType.MULTIPLY, '*', line, col)); break;
      case '/': this.tokens.push(new Token(TokenType.DIVIDE,   '/', line, col)); break;
      case '%': this.tokens.push(new Token(TokenType.MOD,      '%', line, col)); break;
      case '^': this.tokens.push(new Token(TokenType.POWER,    '^', line, col)); break;

      // ── Ponctuation ───────────────────────────────────────────────────────
      case '(': this.tokens.push(new Token(TokenType.LPAREN,    '(', line, col)); break;
      case ')': this.tokens.push(new Token(TokenType.RPAREN,    ')', line, col)); break;
      case '[': this.tokens.push(new Token(TokenType.LBRACKET,  '[', line, col)); break;
      case ']': this.tokens.push(new Token(TokenType.RBRACKET,  ']', line, col)); break;
      case ',': this.tokens.push(new Token(TokenType.COMMA,     ',', line, col)); break;
      case ':': this.tokens.push(new Token(TokenType.COLON,     ':', line, col)); break;
      case ';': this.tokens.push(new Token(TokenType.SEMICOLON, ';', line, col)); break;
      case '.': this.tokens.push(new Token(TokenType.DOT,       '.', line, col)); break;

      // ── Caractère inconnu ─────────────────────────────────────────────────
      default:
        this._addError(`Caractère inattendu`, line, col, ch);
        this.tokens.push(new Token(TokenType.UNKNOWN, ch, line, col));
    }
  }

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

export default Lexer;
