import Token from '../Token.js';
import TokenType from '../tokenTypes.js';
import { SIMPLE_KEYWORDS, COMPOUND_KEYWORDS, getBooleanValue } from '../keywords.js';

const identifierMethods = {
  _readIdentifierOrKeyword(line, col) {
    // Lit le premier mot (inclut les underscores)
    let firstWord = this._readWord();
    const firstWordUpper = firstWord.toUpperCase();

    // -- Règle spéciale : ALGORITHME collé avec le nom -------------------------
    // Ex: "ALGORITHMECALCULMOYENNE" ou "ALGORITHME_CALCULMOYENNE"
    if (firstWordUpper.startsWith('ALGORITHME') && firstWordUpper.length > 10) {
      const rest = firstWord.slice(10); // tout ce qui suit "ALGORITHME"
      // Ignorer un éventuel underscore séparateur en tête
      const name = rest.startsWith('_') ?rest.slice(1) : rest;
      this.tokens.push(new Token(TokenType.ALGORITHME, 'ALGORITHME', line, col));
      if (name.length > 0) {
        // La colonne du nom commence après ALGORITHME (+ éventuel _)
        const nameCol = col + 10 + (rest.startsWith('_') ?1 : 0);
        this.tokens.push(new Token(TokenType.IDENTIFIER, name, line, nameCol));
      }
      return;
    }

    // -- Tentative de correspondance avec un mot-clé compos? -----------------
    // Les mots-clés sont insensibles à la casse, donc on vérifie `firstWordUpper`
    let compound = this._tryMatchCompoundKeyword(firstWordUpper, line, col);
    if (compound) return;

    // -- Mot-cl? simple -------------------------------------------------------
    if (SIMPLE_KEYWORDS.has(firstWordUpper)) {
      const tokenType = SIMPLE_KEYWORDS.get(firstWordUpper);

      // Cas spécial : VRAI / FAUX ? token BOOLEAN avec valeur booléenne
      if (tokenType === TokenType.BOOLEAN) {
        const boolVal = getBooleanValue(firstWordUpper);
        this.tokens.push(new Token(TokenType.BOOLEAN, boolVal, line, col));
      } else {
        this.tokens.push(new Token(tokenType, firstWord, line, col));
      }
      return;
    }

    // -- Identifiant (variable, etc.) -----------------------------------------
    this.tokens.push(new Token(TokenType.IDENTIFIER, firstWord, line, col));
  },

  _readWord() {
    let word = '';
    while (!this.isAtEnd() && this._isAlphaNum(this._current())) {
      word += this._advance();
    }
    return word;
  },

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

      // Recule si la correspondance a ?chou?
      this.pos    = savedPos;
      this.line   = savedLine;
      this.column = savedColumn;
    }

    return false;
  }
};

export default identifierMethods;

