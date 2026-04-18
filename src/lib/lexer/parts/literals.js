import Token from '../Token.js';
import TokenType from '../tokenTypes.js';

const literalMethods = {
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
  },

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
  },

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
};

export default literalMethods;
