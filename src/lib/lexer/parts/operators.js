import Token from '../Token.js';
import TokenType from '../tokenTypes.js';

const operatorMethods = {
  _readOperatorOrSymbol(line, col) {
    const ch = this._advance();

    switch (ch) {
      // ── Affectation ou inférieur ──────────────────────────────────────────
      case '<':
        if (this._match('-')) {
          this.tokens.push(new Token(TokenType.ASSIGN, '<-', line, col));
        } else if (this._match('=')) {
          this.tokens.push(new Token(TokenType.LTE,    '<=', line, col));
        } else if (this._match('>')) {
          this.tokens.push(new Token(TokenType.NE,     '<>', line, col));
        } else {
          this.tokens.push(new Token(TokenType.LT,     '<',  line, col));
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

      // ── Inégalité <> (syntaxe BQL) ──
      // Le cas '<' est déjà géré ci-dessus, mais '<>' est consommé plus tôt.
      // Voir le case '<' modifié ci-dessous.

      // ── Égalité ───────────────────────────────────────────────────────────
      case '=':
        this.tokens.push(new Token(TokenType.EQ, '=', line, col));
        break;

      // ── Arithmétique ──────────────────────────────────────────────────────
      case '+': this.tokens.push(new Token(TokenType.PLUS,     '+', line, col)); break;
      case '-':
        if (this._match('>')) {
          this._addError(`Opérateur "->" non supporté`, line, col, '->');
          this.tokens.push(new Token(TokenType.UNKNOWN, '->', line, col));
        } else {
          this.tokens.push(new Token(TokenType.MINUS, '-', line, col));
        }
        break;
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
};

export default operatorMethods;
