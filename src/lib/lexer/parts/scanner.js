import Token from '../Token.js';
import TokenType from '../tokenTypes.js';

const scannerMethods = {
  _scanToken() {
    const ch    = this._current();
    const line  = this.line;
    const col   = this.column;

    // -- Espaces et tabulations (ignorés, pas de token) ----------------------
    if (this._isWhitespace(ch)) {
      this._advance();
      return;
    }

    // -- Retour à la ligne ----------------------------------------------------
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

    // -- Commentaires sur une ligne (//) --------------------------------------
    if (ch === '/' && this._peek() === '/') {
      this._skipLineComment();
      return;
    }

    // -- Nombres --------------------------------------------------------------
    if (this._isDigit(ch)) {
      this._readNumber(line, col);
      return;
    }

    // -- Chaînes et caractères ------------------------------------------------
    if (ch === '"') { this._readString(line, col); return; }
    if (ch === "'") { this._readChar(line, col);   return; }

    // -- Identificateurs et mots-clés -----------------------------------------
    if (this._isAlpha(ch)) {
      this._readIdentifierOrKeyword(line, col);
      return;
    }

    // -- Opérateur d'affectation unicode ? -----------------------------------
    if (ch === '?') {
      this._advance();
      this.tokens.push(new Token(TokenType.ASSIGN, '?', line, col));
      return;
    }

    // -- Opérateurs et symboles ------------------------------------------------
    this._readOperatorOrSymbol(line, col);
  },

  _skipLineComment() {
    // Consomme jusqu'à la fin de la ligne (sans consommer le \n)
    while (!this.isAtEnd() && this._current() !== '\n') {
      this._advance();
    }
  }
};

export default scannerMethods;

