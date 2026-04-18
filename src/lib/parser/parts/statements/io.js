import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';

const ioStatementMethods = {
  _parsePrint() {
    const tok = this._advance(); // ECRIRE

    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError(
        'Parenthèse ouvrante manquante après ECRIRE',
        this._current(),
        { hint: 'Écrivez : ECRIRE(expression);' }
      ));
      this._synchronize();
      return new PrintNode([], tok);
    }
    this._advance(); // consommer '('

    const args = [];

    // Parse arguments (one or more expressions separated by commas)
    if (!this._check(TokenType.RPAREN) && !this._isAtEnd()) {
      const firstArg = this._parsePrintArgument();
      if (firstArg !== null) args.push(firstArg);

      while (this._match(TokenType.COMMA)) {
        if (this._check(TokenType.RPAREN)) {
          this._addError(this._makeError(
            'Virgule mal placée dans ECRIRE : expression manquante après la virgule',
            this._current(),
            { hint: 'Supprimez la virgule finale ou ajoutez une expression.' }
          ));
          break;
        }
        if (this._isAtEnd()) break;
        const arg = this._parsePrintArgument();
        if (arg !== null) args.push(arg);
      }
    }

    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError(
        'Parenthèse fermante manquante dans ECRIRE',
        this._current(),
        { hint: 'Ajoutez ")" pour fermer l\'appel ECRIRE.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }

    this._expectSemicolon('ECRIRE(...)');
    return new PrintNode(args, tok);
  },

  _parsePrintArgument() {
    // Vérification préventive : si on est pas sur un token valable, on signale
    const tok = this._current();
    const validStartTypes = [
      TokenType.STRING,
      TokenType.NUMBER,
      TokenType.CHAR,
      TokenType.BOOLEAN,
      TokenType.IDENTIFIER,
      TokenType.LPAREN,
      TokenType.MINUS,
      TokenType.NON,
    ];

    if (!validStartTypes.includes(tok.type)) {
      this._addError(this._makeError(
        `Argument invalide dans ECRIRE : "${tok.value ?? tok.type}"`,
        tok,
        { hint: 'ECRIRE attend une expression : variable, nombre, chaîne ou expression.' }
      ));
      return null;
    }

    return this._parseExpression();
  },

  _parseInput() {
    const tok = this._advance(); // LIRE

    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError(
        'Parenthèse ouvrante manquante après LIRE',
        this._current(),
        { hint: 'Écrivez : LIRE(nomVariable); ou LIRE(T[i]);' }
      ));
      this._synchronize();
      return new InputNode('?', tok);
    }
    this._advance(); // consommer '('

    // La cible peut commencer par TABLEAU (strict) ou directement IDENTIFIER
    let hasTableau = false;
    let varTok = null;

    if (this._match(TokenType.TABLEAU)) {
      hasTableau = true;
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError(
          'Nom du tableau manquant après TABLEAU',
          this._current(),
          { hint: 'LIRE attend le nom d\'un tableau : LIRE(Tableau T[i]);' }
        ));
        this._synchronize();
        return new InputNode('?', tok);
      }
      varTok = this._advance();
    } else {
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError(
          'Nom de variable manquant dans LIRE',
          this._current(),
          { hint: 'LIRE attend le nom d\'une variable : LIRE(maVariable); ou LIRE(Tableau T[i]);' }
        ));
        // Récupération : avancer jusqu'à ')' ou ';'
        while (!this._isAtEnd() && !this._check(TokenType.RPAREN) && !this._check(TokenType.SEMICOLON)) {
          this._advance();
        }
        if (this._check(TokenType.RPAREN)) this._advance();
        this._skipSemicolons();
        return new InputNode('?', tok);
      }
      varTok = this._advance();
    }

    // ── Accès Tableau : LIRE(Tableau T[i, j]) ou LIRE(T[i].nom) ──────────────────────────
    let targetNode;
    let hasArrayAccess = false;
    if (this._match(TokenType.LBRACKET)) {
      hasArrayAccess = true;
      
      // Parse des indices
      const indices = [];
      indices.push(this._parseExpression());

      while (this._match(TokenType.COMMA)) {
        indices.push(this._parseExpression());
      }

      if (!this._match(TokenType.RBRACKET)) {
        this._addError(this._makeError(
          `Crochet fermant "]" manquant après les indices dans LIRE`,
          this._current(),
          { hint: `Ajoutez "]" après les indices.` }
        ));
      }

      targetNode = new ArrayAccessNode(varTok.value, indices, varTok);
    }

    // Capture syntaxe incorrecte M[i][j] → erreur pédagogique
    if (this._check(TokenType.LBRACKET)) {
      this._addError(this._makeError(
        `Syntaxe incorrecte pour l'accès matriciel`,
        this._current(),
        { hint: `En BQL, on utilise une seule paire de crochets : écrivez ${varTok.value}[..., ...] au lieu de ${varTok.value}[...][...]` }
      ));
      this._advance();
      while(!this._check(TokenType.RBRACKET) && !this._isAtEnd()) this._advance();
      if (this._check(TokenType.RBRACKET)) this._advance();
    }

    // Fallback variable simple SEULEMENT si aucun accès indexé n'a été parsé
    if (!hasArrayAccess) {
      targetNode = new IdentifierNode(varTok.value, varTok);
    }
    

    // NOUVEAU : Lecture d'un champ d'enregistrement (ex: LIRE(e.nom) ou LIRE(T[i].nom))
    let hasMemberAccess = false;
    while (this._match(TokenType.DOT)) {
      hasMemberAccess = true;
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError(
          'Nom du champ attendu',
          this._current(),
          { hint: 'Ex: LIRE(variable.champ);' }
        ));
        break;
      }
      const propTok = this._advance();
      targetNode = new MemberAccessNode(targetNode, propTok.value, propTok);
    }
    
    // Validation des règles sur le mot-clé 'Tableau'
    if (hasTableau) {
      this._addError(this._makeError(
        `Le mot-clé 'Tableau' est interdit dans LIRE`,
        varTok,
        { hint: `Écrivez simplement : LIRE(${varTok.value}[i]);` }
      ));
    }

    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError(
        'Parenthèse fermante manquante dans LIRE',
        this._current(),
        { hint: 'Ajoutez ")" pour fermer l\'appel LIRE.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }

    this._expectSemicolon('LIRE(...)');
    return new InputNode(targetNode, tok);
  }
};

export default ioStatementMethods;
