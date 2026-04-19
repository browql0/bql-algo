import TokenType from '../../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../../AST/nodes.js';

const conditionStatementMethods = {
  _parseIf() {
    const siTok = this._advance(); // SI

    // Parenthèses optionnelles
    const hasParen = this._match(TokenType.LPAREN);

    let cond = null;
    if (this._check(TokenType.ALORS) || (hasParen && this._check(TokenType.RPAREN))) {
      this._addError(this._makeError(
        'Condition manquante dans le SI',
        this._current(),
        { hint: 'Écrivez la condition : SI condition ALORS  ou  SI (condition) ALORS' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    if (hasParen) {
      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante après la condition du SI',
          this._current(),
          { hint: 'Ajoutez ")" après la condition.' }
        ));
      } else {
        this._advance(); // consommer ')'
      }
    }

    if (!this._check(TokenType.ALORS)) {
      this._addError(this._makeError(
        'Le mot-clé ALORS est obligatoire après la condition du SI',
        this._current(),
        { hint: 'Écrivez : SI condition ALORS  ou  SI (condition) ALORS' }
      ));
    } else {
      this._advance(); // consommer ALORS
    }
    this._skipSemicolons();

    const thenBlock = this._parseBlock([
      TokenType.SINON_SI, TokenType.SINON, TokenType.FINSI,
    ]);

    const elseifClauses = [];
    while (this._check(TokenType.SINON_SI)) {
      this._advance();

      // Parenthèses optionnelles (spec BQL)
      const elseifHasParen = this._match(TokenType.LPAREN);

      let elseifCond = null;
      if (this._check(TokenType.ALORS) || (elseifHasParen && this._check(TokenType.RPAREN))) {
        this._addError(this._makeError(
          'Condition manquante dans le SINONSI',
          this._current(),
          { hint: 'Écrivez la condition : SINONSI condition ALORS  ou  SINONSI (condition) ALORS' }
        ));
        elseifCond = new BooleanNode(true, this._current());
      } else {
        elseifCond = this._parseExpression();
      }

      if (elseifHasParen) {
        if (!this._check(TokenType.RPAREN)) {
          this._addError(this._makeError(
            'Parenthèse fermante manquante après la condition du SINONSI',
            this._current(),
            { hint: 'Ajoutez ")" après la condition.' }
          ));
        } else {
          this._advance();
        }
      }

      if (!this._check(TokenType.ALORS)) {
        this._addError(this._makeError(
          'ALORS manquant après la condition de SINONSI',
          this._current(),
          { hint: 'Ajoutez ALORS après la condition.' }
        ));
      } else {
        this._advance();
      }
      this._skipSemicolons();

      const elseifBlock = this._parseBlock([
        TokenType.SINON_SI, TokenType.SINON, TokenType.FINSI,
      ]);
      elseifClauses.push({ condition: elseifCond, block: elseifBlock });
    }

    let elseBlock = null;
    if (this._check(TokenType.SINON)) {
      this._advance();
      this._skipSemicolons();
      
      // On s'assure de s'arrêter à FINSI. 
      // Tout SINON ou SINONSI rencontré lèvera une erreur
      // car ils ne sont pas dans stopTypes.
      elseBlock = this._parseBlock([TokenType.FINSI]);
    }

    if (!this._check(TokenType.FINSI)) {
      this._addError(this._makeError(
        'FINSI manquant : Le bloc SI doit être ferm?',
        this._current(),
        { hint: 'Ajoutez "FINSI" à la fin de la structure conditionnelle.' }
      ));
    } else {
      this._advance(); // consommer FINSI
    }
    this._skipSemicolons();

    return new IfNode(cond, thenBlock, elseifClauses, elseBlock, siTok);
  }
};

export default conditionStatementMethods;

