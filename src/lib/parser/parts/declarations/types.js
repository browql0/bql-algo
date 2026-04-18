import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';

const typeDeclarationMethods = {
  _parseTypeDeclaration() {
    const typeTok = this._advance(); // consomme TYPE
    
    if (!this._check(TokenType.IDENTIFIER)) {
      this._addError(this._makeError(
        'Nom du type attendu après le mot-clé TYPE',
        this._current(),
        { hint: 'Exemple: TYPE Etudiant = ENREGISTREMENT' }
      ));
      this._synchronize(TokenType.FIN);
      return null;
    }
    const nameTok = this._advance(); // consomme le nom
    const typeName = nameTok.value;
    
    if (!this._match(TokenType.EQ)) {
      this._addError(this._makeError(
        'Un "=" est attendu après le nom du type',
        this._current(),
        { hint: `Exemple: TYPE ${typeName} = ENREGISTREMENT` }
      ));
    }
    
    if (!this._match(TokenType.ENREGISTREMENT)) {
      this._addError(this._makeError(
        'Le mot-clé ENREGISTREMENT est attendu après "="',
        this._current(),
        { hint: `Exemple: TYPE ${typeName} = ENREGISTREMENT` }
      ));
    }
    
    // Spec BQL : aucun ';' ne doit apparaître immédiatement après ENREGISTREMENT.
    if (this._check(TokenType.SEMICOLON)) {
      this._addError(this._makeError(
        'Point-virgule interdit juste après ENREGISTREMENT',
        this._current(),
        {
          hint: 'Le mot-clé ENREGISTREMENT ne doit PAS être suivi d\'un ";". ' +
                'Commencez directement les champs sur la ligne suivante.',
          expected: 'nom de champ'
        }
      ));
      this._advance(); // consomme le ';' fautif et récupère
    }
    
    const fields = [];
    
    while (!this._isAtEnd() && !this._check(TokenType.FIN)) {
      this._skipSemicolons();
      if (this._check(TokenType.FIN)) break;
      
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError(
          'Nom du champ attendu',
          this._current(),
          { hint: 'Exemple: nom : CHAINE;' }
        ));
        this._synchronize(TokenType.SEMICOLON, TokenType.FIN);
        continue;
      }
      
      const fieldTok = this._advance();
      if (!this._match(TokenType.COLON)) {
        this._addError(this._makeError(
          'Un ":" est attendu après le nom du champ',
          this._current(),
          { hint: `Exemple: ${fieldTok.value} : ENTIER;` }
        ));
      }
      
      const varType = this._parseTypeName();
      fields.push(new RecordFieldNode(fieldTok.value, varType, fieldTok));
      
      this._expectSemicolon(`le champ '${fieldTok.value}'`);
    }
    
    if (!this._match(TokenType.FIN)) {
      this._addError(this._makeError(
        `Le mot-clé FIN est attendu à la fin de l'enregistrement ${typeName}`,
        this._current(),
        { hint: `Exemple: FIN ${typeName}` }
      ));
    } else {
      // Opt: le nom est répété après le FIN (ex: FIN Etudiant)
      if (this._check(TokenType.IDENTIFIER) && this._current().value === typeName) {
        this._advance();
      }
    }
    
    this._skipSemicolons(); // Le point virgule final optionnel
    return new TypeDeclarationNode(typeName, fields, typeTok);
  },

  _parseTypeName() {
    const tok = this._current();
    switch (tok.type) {
      case TokenType.TYPE_ENTIER:    this._advance(); return 'entier';
      case TokenType.TYPE_REEL:      this._advance(); return 'reel';
      case TokenType.TYPE_CHAINE:    this._advance(); return 'chaine';
      case TokenType.TYPE_CARACTERE: this._advance(); return 'caractere';
      case TokenType.TYPE_BOOLEEN:   this._advance(); return 'booleen';
      case TokenType.IDENTIFIER:     this._advance(); return tok.value; // Type structuré (Enregistrement)
      default:
        this._addError(this._makeError(
          `Type de variable invalide ou manquant : "${tok.value ?? tok.type}"`,
          tok,
          { hint: 'Types valides : ENTIER, REEL, CHAINE, CARACTERE, BOOLEEN, ou un type structuré.' }
        ));
        return null;
    }
  }
};

export default typeDeclarationMethods;
