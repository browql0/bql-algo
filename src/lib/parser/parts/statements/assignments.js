import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';

const assignmentStatementMethods = {
  _parseArrayStatement() {
    const declTok = this._advance(); // consomme TABLEAU
    
    if (!this._check(TokenType.IDENTIFIER)) {
      this._addError(this._makeError(
        `Nom du tableau manquant après TABLEAU`,
        this._current(),
        { hint: `Écrivez : Tableau nom[taille] <- valeur; ou Tableau nom[taille];` }
      ));
      this._synchronize(TokenType.SEMICOLON);
      return null;
    }
    const nameTok = this._advance();
    
    if (!this._check(TokenType.LBRACKET)) {
      this._addError(this._makeError(
        `Crochet ouvrant "[" manquant après le nom du tableau "${nameTok.value}"`,
        this._current(),
        { hint: `Définissez les indices entre crochets : Tableau ${nameTok.value}[...];` }
      ));
    } else {
      this._advance(); // '['
    }
    
    let sizes = [];
    if (this._check(TokenType.RBRACKET) || this._check(TokenType.COLON) || this._check(TokenType.COMMA)) {
      this._addError(this._makeError(
        `Indices du tableau manquants pour '${nameTok.value}'`,
        this._current(),
        { hint: `Vous devez définir les indices. Ex: Tableau ${nameTok.value}[10];` }
      ));
      sizes.push(new NumberNode(0, this._current()));
      if (this._check(TokenType.COMMA)) {
         this._advance(); // consume comma
         sizes.push(new NumberNode(0, this._current()));
      }
    } else {
      sizes.push(this._parseExpression());
      while (this._match(TokenType.COMMA)) {
        if (this._check(TokenType.RBRACKET) || this._check(TokenType.COLON)) {
          this._addError(this._makeError(`Dimension manquante après la virgule`, this._current(), { hint: `Exemple : Tableau ${nameTok.value}[3,4];` }));
          sizes.push(new NumberNode(0, this._current()));
          break;
        }
        sizes.push(this._parseExpression());
      }
    }
    
    if (sizes.length > 2) {
      this._addError(this._makeError(`Trop de dimensions pour le tableau '${nameTok.value}'`, this._current(), { hint: `Le langage supporte uniquement 1 ou 2 dimensions.` }));
    }

    if (!this._check(TokenType.RBRACKET)) {
      this._addError(this._makeError(
        `Crochet fermant "]" manquant après les indices`,
        this._current(),
        { hint: `Fermez les crochets : Tableau ${nameTok.value}[...];` }
      ));
    } else {
      this._advance(); // ']'
    }
    
    // Le point de bifurcation : Allocation vs Affectation
    if (this._check(TokenType.ASSIGN)) {
      // Affectation : Tableau T[i] <- valeur;
      this._addError(this._makeError(
        `Le mot-clé 'Tableau' est interdit pour affecter une valeur à une case (ou un tableau entier)`,
        this._current(),
        { hint: `Utilisez la syntaxe '${nameTok.value}[...] <- valeur;' sans le mot-clé 'Tableau'.` }
      ));
      this._advance(); // consomme <-
      this._parseExpression();
      this._expectSemicolon(`l'affectation invalide de 'Tableau ${nameTok.value}[...]'`);
      return null;
    } else {
      // Allocation : Tableau T[n];
      if (this._check(TokenType.COLON)) {
        this._addError(this._makeError(
          `déclaration complète interdite après DEBUT`,
          this._current(),
          { hint: `Retirez ': TYPE'. Après DEBUT, seule l'allocation 'Tableau ${nameTok.value}[...];' est autorisée.` }
        ));
        this._advance(); // `:`
        this._parseTypeName();
      }
      this._expectSemicolon(`l'allocation du tableau '${nameTok.value}'`);
      return new ArrayAllocationNode(nameTok.value, sizes, declTok);
    }
  },

  _parseAssignment() {
    const nameTok = this._advance(); // IDENTIFIER
    let target = new IdentifierNode(nameTok.value, nameTok);
    
    let hasArrayAccess = false;

    // 1. Accès au tableau optionnel (sans mot-clé Tableau, car on accède potentiellement à un champ d'une case d'un tableau d'enregistrements)
    if (this._match(TokenType.LBRACKET)) {
      hasArrayAccess = true;
      let sizes = [];
      if (this._check(TokenType.RBRACKET)) {
         sizes.push(new NumberNode(0, this._current()));
      } else {
         sizes.push(this._parseExpression());
         while (this._match(TokenType.COMMA)) {
           sizes.push(this._parseExpression());
         }
      }
      if (!this._check(TokenType.RBRACKET)) {
        this._addError(this._makeError(`Crochet fermant manquant`, this._current()));
      } else {
        this._advance();
      }
      target = new ArrayAccessNode(nameTok.value, sizes, nameTok);
    }

    // 1b. Catch de l'erreur classique M[i][j] au lieu de M[i, j]
    if (this._check(TokenType.LBRACKET)) {
      this._addError(this._makeError(
        `Syntaxe incorrecte pour l'accès matriciel`,
        this._current(),
        { hint: `En BQL, on utilise une seule paire de crochets : écrivez ${nameTok.value}[..., ...] au lieu de ${nameTok.value}[...][...]` }
      ));
      this._advance(); // Consume '['
      while(!this._check(TokenType.RBRACKET) && !this._check(TokenType.SEMICOLON) && !this._isAtEnd()) {
        this._advance();
      }
      if (this._check(TokenType.RBRACKET)) this._advance();
    }

    // 2. Accès membre (ex: .nom)
    let hasMemberAccess = false;
    while (this._match(TokenType.DOT)) {
      hasMemberAccess = true;
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError('Nom du champ attendu après le point', this._current(), { hint: 'Ex: variable.champ' }));
        this._synchronize(TokenType.ASSIGN, TokenType.SEMICOLON);
        return null;
      }
      const propTok = this._advance();
      target = new MemberAccessNode(target, propTok.value, propTok);
    }

    // 3. Validation de la règle stricte supprimée : On accepte l'assignation normale

    // 4. Affectation
    if (!this._check(TokenType.ASSIGN)) {
      this._addError(this._makeError(
        `Opérateur d'affectation manquant`,
        this._current(),
        { hint: `Utilisez "<-" pour affecter une valeur.` }
      ));
      this._synchronize();
      return null;
    }
    this._advance(); // consommer <-

    const value = this._parseExpression();
    this._expectSemicolon(`l'affectation`);

    return new AssignNode(target, value, nameTok);
  }
};

export default assignmentStatementMethods;
