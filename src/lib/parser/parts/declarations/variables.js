import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';

const variableDeclarationMethods = {
  _parseVariablesSection() {
    const keyword      = this._advance(); // VARIABLES or VARIABLE
    const keywordValue = keyword.value;   // "VARIABLES" | "VARIABLE"
    const isPlural     = keyword.type === TokenType.VARIABLES; // true = VARIABLES

    // ':' est STRICTEMENT INTERDIT après VARIABLES / VARIABLE
    if (this._check(TokenType.COLON)) {
      this._addError(this._makeError(
        `Le caractère ':' est interdit après ${keywordValue}`,
        this._current(),
        {
          hint: `Supprimez le ':' : écrivez simplement "${keywordValue}" suivi des déclarations sur les lignes suivantes.`,
          expected: 'déclaration de variable'
        }
      ));
      this._advance(); // consommer le ':' et continuer (récupération douce)
    }
    this._skipSemicolons();

    const decls = [];

    // Parse declarations until we encounter DEBUT, FIN, VARIABLES, VARIABLE or EOF
    while (!this._isAtEnd()) {
      // Skip any semicolons between declarations
      this._skipSemicolons();

      // Stop conditions: structural keywords that end the VARIABLES block
      if (
        this._check(TokenType.DEBUT)     ||
        this._check(TokenType.FIN)       ||
        this._check(TokenType.VARIABLES) ||
        this._check(TokenType.VARIABLE)  ||
        this._check(TokenType.CONSTANTES)||
        this._check(TokenType.CONSTANTE)
      ) {
        break;
      }

      // Stop at EOF
      if (this._isAtEnd()) break;

      // A valid declaration MUST start with TABLEAU or IDENTIFIER
      if (!this._check(TokenType.IDENTIFIER) && !this._check(TokenType.TABLEAU)) {
        const tok = this._current();
        const isTypeKeyword = [
          TokenType.TYPE_ENTIER, TokenType.TYPE_REEL,
          TokenType.TYPE_CHAINE, TokenType.TYPE_CARACTERE,
          TokenType.TYPE_BOOLEEN,
        ].includes(tok.type);

        if (isTypeKeyword) {
          this._addError(this._makeError(
            `Nom de variable manquant avant le type "${tok.value ?? tok.type}"`,
            tok,
            { hint: `Une déclaration doit suivre le format : nom : TYPE; (ou Tableau nom[taille] : TYPE;)` }
          ));
          this._advance();
          continue;
        }

        this._addError(this._makeError(
          `Déclaration invalide : "${tok.value ?? tok.type}"`,
          tok,
          { hint: `Une déclaration commence par un identifiant ou le mot-clé TABLEAU.` }
        ));
        this._advance();
        continue;
      }

      if (this._check(TokenType.TABLEAU)) {
        const arrDecl = this._parseArrayDecl();
        if (arrDecl) decls.push(arrDecl);
      } else {
        // NORMAL VARIABLE DECLARATION
        const nameTok = this._advance(); // consume IDENTIFIER
        const names = [nameTok.value];

        // Allow multiple variables separated by commas
        while (this._match(TokenType.COMMA)) {
          if (!this._check(TokenType.IDENTIFIER)) {
            this._addError(this._makeError(
              `Nom de variable attendu après la virgule`,
              this._current(),
              { hint: `Écrivez plusieurs variables séparées par des virgules (ex: a, b : ENTIER;)` }
            ));
            break; 
          }
          names.push(this._advance().value);
        }

        if (!this._check(TokenType.COLON)) {
          this._addError(this._makeError(
            `Deux-points manquant après le(s) nom(s) de variable(s) '${names.join(', ')}'`,
            this._current(),
            { hint: `Écrivez : ${names.join(', ')} : TYPE;  (ex: ${names[0]} : ENTIER;)` }
          ));
          this._synchronize(TokenType.SEMICOLON);
          continue;
        }
        this._advance(); 

        const varType = this._parseTypeName();
        if (!varType) {
          this._synchronize(TokenType.SEMICOLON);
          continue;
        }

        this._expectSemicolon(`la déclaration de '${names.join(', ')}'`);
        decls.push(new VarDeclNode(names, varType, nameTok));
      }
    }

    // ── Validation 1 : au moins une déclaration est obligatoire ──────────────
    if (decls.length === 0) {
      this._addError(this._makeError(
        `Aucune déclaration après ${keywordValue}`,
        this._current(),
        {
          hint: `Ajoutez au moins une déclaration de variable. Ex : x : ENTIER;`,
          expected: 'déclaration de variable'
        }
      ));
    } else {
      // ── Validation 2 : VARIABLE (sing.) vs VARIABLES (plur.) ───────────────
      // Compter le nombre total de symboles déclarés :
      //   - VarDeclNode  → node.names.length  (ex : "x, y" → 2)
      //   - ArrayDeclNode → 1               (ex : "Tableau T[5]" → 1)
      let totalSymbols = 0;
      for (const node of decls) {
        if (Array.isArray(node.names)) {
          totalSymbols += node.names.length;  // VarDeclNode
        } else {
          totalSymbols += 1;                  // ArrayDeclNode (name = string)
        }
      }

      if (isPlural && totalSymbols === 1) {
        // VARIABLES utilisé pour une seule variable → erreur
        this._addError(this._makeError(
          `Utiliser VARIABLE pour une seule variable`,
          keyword,
          {
            hint: `Remplacez VARIABLES par VARIABLE : une seule variable a été déclarée.`,
            expected: 'VARIABLE'
          }
        ));
      } else if (!isPlural && totalSymbols > 1) {
        // VARIABLE utilisé pour plusieurs variables → erreur
        this._addError(this._makeError(
          `Utiliser VARIABLES pour plusieurs variables`,
          keyword,
          {
            hint: `Remplacez VARIABLE par VARIABLES : ${totalSymbols} variables ont été déclarées.`,
            expected: 'VARIABLES'
          }
        ));
      }
    }

    return decls;
  },

  _parseVarBlock() {
    return this._parseVariablesSection();
  },

  _parseArrayDecl() {
    const declTok = this._advance(); // consomme TABLEAU
    
    if (!this._check(TokenType.IDENTIFIER)) {
      this._addError(this._makeError(
        `Nom du tableau manquant après TABLEAU`,
        this._current(),
        { hint: `Écrivez : Tableau nom[taille] : TYPE; (ou Tableau nom[] : TYPE;)` }
      ));
      this._synchronize(TokenType.SEMICOLON);
      return null;
    }
    const nameTok = this._advance();
    
    if (!this._check(TokenType.LBRACKET)) {
      this._addError(this._makeError(
        `Crochet ouvrant "[" manquant après le nom du tableau "${nameTok.value}"`,
        this._current(),
        { hint: `Définissez la forme entre crochets : Tableau ${nameTok.value}[...] : TYPE;` }
      ));
    } else {
      this._advance(); // '['
    }
    
    let sizes = [];

    // Tableaux dynamiques vides : Tableau T[] ou Tableau M[,]
    if (this._check(TokenType.RBRACKET)) {
      sizes.push(null); // 1D dynamique struct
    } else if (this._check(TokenType.COMMA)) {
      this._advance(); // ','
      sizes.push(null);
      sizes.push(null); // 2D dynamique struct
      if (!this._check(TokenType.RBRACKET)) {
        this._addError(this._makeError(`Format invalide pour tableau vide 2D`, this._current(), { hint: `Écrivez : Tableau ${nameTok.value}[,] : TYPE;` }));
      }
    } else if (this._check(TokenType.COLON)) {
      this._addError(this._makeError(
        `Taille du tableau ou crochets vides manquants`,
        this._current(),
        { hint: `Indiquez la taille (ex: [10]) ou des crochets vides (ex: []).` }
      ));
      sizes.push(null);
    } else {
      // Tableaux statiques renseignés : Tableau T[n] ou T[n,m]
      sizes.push(this._parseExpression());
      while (this._match(TokenType.COMMA)) {
        if (this._check(TokenType.RBRACKET) || this._check(TokenType.COLON)) {
          this._addError(this._makeError(`Dimension manquante après la virgule`, this._current(), { hint: `Exemple : Tableau ${nameTok.value}[3,4] : TYPE;` }));
          sizes.push(null);
          break;
        }
        sizes.push(this._parseExpression());
      }
    }
    
    if (sizes.length > 2) {
      this._addError(this._makeError(`Trop de dimensions pour le tableau '${nameTok.value}'`, this._current(), { hint: `Le langage supporte uniquement 1 ou 2 dimensions (ex: Tableau T[3,4]).` }));
    }

    if (!this._check(TokenType.RBRACKET)) {
      this._addError(this._makeError(
        `Crochet fermant "]" manquant après les tailles du tableau`,
        this._current(),
        { hint: `Fermez les crochets : Tableau ${nameTok.value}[...] : TYPE;` }
      ));
    } else {
      this._advance(); // ']'
    }
    
    if (!this._check(TokenType.COLON)) {
      this._addError(this._makeError(
        `Deux-points manquant après la définition du tableau`,
        this._current(),
        { hint: `Écrivez : Tableau ${nameTok.value}[...] : TYPE;` }
      ));
      this._synchronize(TokenType.SEMICOLON);
      return null;
    }
    this._advance(); // ':'
    
    const varType = this._parseTypeName();
    if (!varType) {
      this._synchronize(TokenType.SEMICOLON);
      return null;
    }
    
    this._expectSemicolon(`la déclaration du tableau '${nameTok.value}'`);
    return new ArrayDeclNode(nameTok.value, sizes, varType, declTok);
  }
};

export default variableDeclarationMethods;
