import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';
import AlgoSyntaxError from '../../../errors/SyntaxError.js';

const blockStatementMethods = {
  _parseBlock(stopTypes) {
    const statements = [];

    while (
      !stopTypes.includes(this._current().type) &&
      !this._isAtEnd()
    ) {
      // ── Flood protection : arrêt si trop d'erreurs ────────────────────────
      if (this.isSaturated()) break;

      this._skipSemicolons();
      if (stopTypes.includes(this._current().type) || this._isAtEnd()) break;

      try {
        const stmt = this._parseStatement(stopTypes);
        if (stmt !== null && stmt !== undefined) {
          statements.push(stmt);
        }
        this._skipSemicolons();
      } catch (err) {
        // Erreur récupérable : on l'enregistre et on synchronise
        if (err instanceof AlgoSyntaxError) {
          this._addError(err);
        } else {
          // Erreur d'implémentation JS interne (ReferenceError, TypeError, etc.)
          throw err;
        }
        // Synchronisation : avancer jusqu'au prochain point stable
        this._synchronize(...stopTypes);
      }
    }

    return new BlockNode(statements);
  },

  _parseStatement(_stopTypes = []) {
    const tok = this._current();

    switch (tok.type) {
      case TokenType.IDENTIFIER: return this._parseAssignment();
      case TokenType.TABLEAU:    return this._parseArrayStatement();
      case TokenType.SI:         return this._parseIf();
      case TokenType.TANTQUE:    return this._parseWhile();
      case TokenType.POUR:       return this._parseFor();
      case TokenType.REPETER:    return this._parseDoWhile();
      case TokenType.ECRIRE:     return this._parsePrint();
      case TokenType.LIRE:       return this._parseInput();
      case TokenType.SELON:      return this._parseSwitch();

      // FINSI/FINTANTQUE/FINPOUR orphelins (sans ouverture correspondante) ou mal placés
      case TokenType.FINSI:
      case TokenType.FINTANTQUE:
      case TokenType.FINPOUR:
      case TokenType.FINSELON:
      case TokenType.SINON:
      case TokenType.SINON_SI:
      case TokenType.CAS:
      case TokenType.AUTRE:
      case TokenType.FIN:
      case TokenType.JUSQUA:
      case TokenType.ALORS:
      case TokenType.FAIRE:
      case TokenType.ALLANT:
      case TokenType.ALLANT_DE:
      default: {
        let hint = 'Vérifiez l\'orthographe et la structure de votre programme.';
        if (tok.type === TokenType.SINON || tok.type === TokenType.SINON_SI) {
          hint = 'Un mot-clé SINON ou SINONSI est mal placé. "SINON" ne peut pas être suivi d\'un "SINONSI".';
        } else if (tok.type === TokenType.FINSI) {
          hint = 'FINSI orphelin, aucun bloc SI ne correspond.';
        } else if (tok.type === TokenType.FINPOUR) {
          hint = 'FINPOUR orphelin, aucun bloc POUR ne correspond.';
        } else if (tok.type === TokenType.CAS || tok.type === TokenType.AUTRE) {
          hint = 'CAS ou AUTRE inattendu hors d\'un bloc SELON.';
        } else if (tok.type === TokenType.FINSELON) {
          hint = 'FINSELON orphelin, aucun bloc SELON ne correspond.';
        } else if (tok.type === TokenType.ALLANT || tok.type === TokenType.ALLANT_DE) {
          hint = '"ALLANT DE" inattendu : utilisez la syntaxe POUR i ALLANT DE debut A fin FAIRE.';
        }
        const err = this._makeError(
          `Instruction ou mot-clé inattendu : "${tok.value ?? tok.type}"`,
          tok,
          { hint }
        );
        this._advance(); // consume the bad token to avoid infinite loop
        throw err;
      }
    }
  }
};

export default blockStatementMethods;
