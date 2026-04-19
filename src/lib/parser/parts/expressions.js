import TokenType from '../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../AST/nodes.js';

const expressionMethods = {
  _parseExpression() { return this._parseOr(); },

  _parseOr() {
    let left = this._parseAnd();
    while (this._check(TokenType.OU)) {
      const op    = this._advance();
      const right = this._parseAnd();
      left = new BinaryOpNode(left, 'OU', right, op);
    }
    return left;
  },

  _parseAnd() {
    let left = this._parseNot();
    while (this._check(TokenType.ET)) {
      const op    = this._advance();
      const right = this._parseNot();
      left = new BinaryOpNode(left, 'ET', right, op);
    }
    return left;
  },

  _parseNot() {
    if (this._check(TokenType.NON)) {
      const op      = this._advance();
      const operand = this._parseNot();
      return new UnaryOpNode('NON', operand, op);
    }
    return this._parseComparison();
  },

  _parseComparison() {
    let left = this._parseAddSub();
    const CMP = [
      TokenType.EQ, TokenType.NE,
      TokenType.LT, TokenType.LTE,
      TokenType.GT, TokenType.GTE,
    ];
    while (CMP.includes(this._current().type)) {
      const op    = this._advance();
      const right = this._parseAddSub();
      left = new BinaryOpNode(left, op.value, right, op);
    }
    return left;
  },

  _parseAddSub() {
    let left = this._parseMulDivMod();
    while (this._check(TokenType.PLUS) || this._check(TokenType.MINUS)) {
      const op    = this._advance();
      const right = this._parseMulDivMod();
      left = new BinaryOpNode(left, op.value, right, op);
    }
    return left;
  },

  _parseMulDivMod() {
    let left = this._parsePower();
    while (
      this._check(TokenType.MULTIPLY) ||
      this._check(TokenType.DIVIDE)   ||
      this._check(TokenType.MOD)
    ) {
      const op    = this._advance();
      const right = this._parsePower();
      left = new BinaryOpNode(left, op.value, right, op);
    }
    return left;
  },

  _parsePower() {
    let base = this._parseUnary();
    if (this._check(TokenType.POWER)) {
      const op  = this._advance();
      const exp = this._parsePower(); // associativit? droite
      return new BinaryOpNode(base, '^', exp, op);
    }
    return base;
  },

  _parseUnary() {
    if (this._check(TokenType.MINUS)) {
      const op      = this._advance();
      const operand = this._parseUnary();
      return new UnaryOpNode('-', operand, op);
    }
    return this._parsePrimary();
  },

  _parsePrimary() {
    const tok = this._current();

    if (this._check(TokenType.NUMBER)) {
      this._advance();
      return new NumberNode(tok.value, tok);
    }
    if (this._check(TokenType.STRING)) {
      this._advance();
      return new StringNode(tok.value, tok);
    }
    if (this._check(TokenType.CHAR)) {
      this._advance();
      return new CharNode(tok.value, tok);
    }
    if (this._check(TokenType.BOOLEAN)) {
      this._advance();
      return new BooleanNode(tok.value, tok);
    }
    if (this._check(TokenType.TABLEAU)) {
      this._advance(); // consomme TABLEAU
      
      if (!this._check(TokenType.IDENTIFIER)) {
         this._addError(this._makeError(`Nom du tableau manquant après TABLEAU`, this._current(), {hint: `Ne pas utiliser 'Tableau' pour lire un tableau`}));
         const errTok = this._advance();
         return new IdentifierNode('?', errTok);
      }
      const idTok = this._advance();
      
      if (this._match(TokenType.LBRACKET)) {
         this._addError(this._makeError(`Ne pas utiliser le mot-clé 'Tableau' pour lire un tableau`, this._current(), {hint: `Écrivez : ${idTok.value}[...] au lieu de Tableau ${idTok.value}[...]`}));
         
         const indices = [];
         indices.push(this._parseExpression());
         while (this._match(TokenType.COMMA)) {
           indices.push(this._parseExpression());
         }
         
         if (!this._match(TokenType.RBRACKET)) {
           this._addError(this._makeError(
             `Crochet fermant "]" manquant après les indices du tableau '${idTok.value}'`,
             this._current()
           ));
         }

         return new ArrayAccessNode(idTok.value, indices, idTok);
      }
      
      this._addError(this._makeError(`Ne pas utiliser le mot-clé 'Tableau' pour lire un tableau`, this._current()));
      return new IdentifierNode(idTok.value, idTok);
    }

    if (this._check(TokenType.IDENTIFIER)) {
      const idTok = this._advance();
      let node = new IdentifierNode(idTok.value, idTok);
      
      // Si on trouve '[', c'est un accès tableau (Stricte Règle: Autoris? sans mot cl? pour la lecture)
      if (this._match(TokenType.LBRACKET)) {
        const indices = [];
        indices.push(this._parseExpression());

        while (this._match(TokenType.COMMA)) {
          indices.push(this._parseExpression());
        }
        
        if (!this._match(TokenType.RBRACKET)) {
          this._addError(this._makeError(
            `Crochet fermant "]" manquant après les indices du tableau '${idTok.value}'`,
            this._current(),
            { hint: `Ajoutez "]" après les indices. Ex: ${idTok.value}[i, j]` }
          ));
        }

        node = new ArrayAccessNode(idTok.value, indices, idTok);
      }
      
      // Capture syntaxe matrice M[i][j]
      if (this._check(TokenType.LBRACKET)) {
        this._addError(this._makeError(
          `Syntaxe incorrecte pour l'accès matriciel`,
          this._current(),
          { hint: `En BQL, on utilise une seule paire de crochets : écrivez ${idTok.value}[..., ...] au lieu de ${idTok.value}[...][...]` }
        ));
        this._advance();
        while(!this._check(TokenType.RBRACKET) && !this._isAtEnd()) this._advance();
        if (this._check(TokenType.RBRACKET)) this._advance();
      }
      
      // Suite d'accès membres (ex: variable.champ.souschamp)
      while (this._match(TokenType.DOT)) {
        if (!this._check(TokenType.IDENTIFIER)) {
          this._addError(this._makeError(
            'Nom du champ attendu après le point',
            this._current(),
            { hint: 'Ex: variable.champ' }
          ));
          break;
        }
        const propTok = this._advance();
        node = new MemberAccessNode(node, propTok.value, propTok);
      }
      
      return node;
    }
    if (this._check(TokenType.LPAREN)) {
      this._advance();
      const expr = this._parseExpression();
      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante',
          this._current(),
          { hint: 'Ajoutez ")" pour fermer l\'expression.' }
        ));
      } else {
        this._advance();
      }
      return expr;
    }

    // Rien de reconnu
    const err = this._makeError(
      `Expression invalide ou inattendue : "${tok.value ?? tok.type}"`,
      tok,
      { hint: 'Une expression (variable, nombre, chaîne, ou expression entre parenthèses) est attendue à cet endroit.' }
    );
    this._advance(); // Avancer pour éviter une boucle infinie
    throw err;
  }
};

export default expressionMethods;

