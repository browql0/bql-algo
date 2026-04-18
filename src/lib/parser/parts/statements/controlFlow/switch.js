import TokenType from '../../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../../AST/nodes.js';

const switchStatementMethods = {
  _parseSwitch() {
    const selonTok = this._advance(); // consommer SELON

    // Parenthèses optionnelles (spec BQL)
    const hasParen = this._match(TokenType.LPAREN);

    let expression = null;
    if (this._check(TokenType.FAIRE) || (hasParen && this._check(TokenType.RPAREN))) {
      this._addError(this._makeError(
        'Expression manquante dans SELON',
        this._current(),
        { hint: 'Écrivez l\'expression : SELON expression FAIRE  ou  SELON (expression) FAIRE' }
      ));
    } else {
      expression = this._parseExpression();
    }

    if (hasParen) {
      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante après l\'expression du SELON',
          this._current(),
          { hint: 'Ajoutez ")" après l\'expression.' }
        ));
      } else {
        this._advance(); // consommer ')'
      }
    }

    if (!this._check(TokenType.FAIRE)) {
      this._addError(this._makeError(
        'Le mot-clé FAIRE est obligatoire après SELON',
        this._current(),
        { hint: 'Écrivez : SELON expression FAIRE  ou  SELON (expression) FAIRE' }
      ));
    } else {
      this._advance(); // consommer FAIRE
    }
    this._skipSemicolons();

    const cases = [];
    let defaultBlock = null;

    if (!this._check(TokenType.CAS)) {
       this._addError(this._makeError('Aucun CAS trouvé dans le bloc SELON', this._current(), { hint: 'Un bloc SELON doit contenir au moins un CAS.' }));
    }

    while (this._check(TokenType.CAS)) {
      const casTok = this._advance(); // consommer CAS

      let value = null;
      if (this._check(TokenType.COLON) || this._check(TokenType.CAS) || this._check(TokenType.AUTRE) || this._check(TokenType.FINSELON)) {
         this._addError(this._makeError('Valeur manquante après CAS', this._current(), { hint: 'Écrivez : CAS <valeur> :' }));
      } else {
         try {
             value = this._parsePrimary(); 
             // Validation strict littérale
             const validLiteral = ['NUMBER', 'STRING', 'CHAR', 'BOOLEAN'].includes(value.type);
             if (!validLiteral) {
                 this._addError(this._makeError('La valeur d\'un CAS doit être un littéral (nombre, chaîne, caractère, booléen)', this._current(), { hint: 'Utilisez une valeur directe comme 1, "test", VRAI.' }));
             }
         } catch(e) {
             value = new StringNode('?', this._current());
         }
      }

      if (!this._check(TokenType.COLON)) {
        this._addError(this._makeError('Deux-points manquant après la valeur du CAS', this._current(), { hint: 'Ajoutez ":" après la valeur.' }));
      } else {
        this._advance(); // consommer ':'
      }
      this._skipSemicolons();

      const body = this._parseBlock([TokenType.CAS, TokenType.AUTRE, TokenType.FINSELON]);
      cases.push(new CaseNode(value, body, casTok));
    }

    if (this._check(TokenType.AUTRE)) {
      this._advance(); // consommer AUTRE

      if (!this._check(TokenType.COLON)) {
        this._addError(this._makeError('Deux-points manquant après AUTRE', this._current(), { hint: 'Ajoutez ":" après AUTRE.' }));
      } else {
        this._advance(); // consommer ':'
      }
      this._skipSemicolons();

      defaultBlock = this._parseBlock([TokenType.FINSELON]);

      if (this._check(TokenType.CAS)) {
         this._addError(this._makeError('CAS interdit après AUTRE', this._current(), { hint: 'Le bloc AUTRE doit être le dernier bloc d\'un SELON.' }));
         while(this._check(TokenType.CAS) || this._check(TokenType.AUTRE)) {
             this._addError(this._makeError('Bloc invalide ignoré', this._advance()));
             this._skipSemicolons();
             this._parseBlock([TokenType.FINSELON]);
         }
      }
    }

    if (!this._check(TokenType.FINSELON)) {
      this._addError(this._makeError('FINSELON manquant : Le bloc SELON doit être fermé', this._current(), { hint: 'Ajoutez "FINSELON" à la fin de la structure.' }));
      this._synchronize();
    } else {
      this._advance(); // consommer FINSELON
    }
    this._skipSemicolons();

    return new SwitchNode(expression, cases, defaultBlock, selonTok);
  }
};

export default switchStatementMethods;
