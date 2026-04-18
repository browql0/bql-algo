import TokenType from '../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../AST/nodes.js';

const constantDeclarationMethods = {
  _parseConstantsSection() {
    const keyword      = this._advance(); // CONSTANTE or CONSTANTES
    const keywordValue = keyword.value;   // "CONSTANTES" | "CONSTANTE"
    const isPlural     = keyword.type === TokenType.CONSTANTES;

    // ':' STRICTEMENT INTERDIT après CONSTANTE(S)
    if (this._check(TokenType.COLON)) {
      this._addError(this._makeError(
        `Le caractère ':' est interdit après ${keywordValue}`,
        this._current(),
        {
          hint: `Supprimez le ':' : écrivez simplement "${keywordValue}" suivi des constantes sur les lignes suivantes.`,
          expected: 'déclaration de constante'
        }
      ));
      this._advance(); // consommer et récupérer
    }
    this._skipSemicolons();

    const consts = [];

    // Parser toutes les déclarations jusqu'à TYPE / VARIABLE(S) / DEBUT / FIN / EOF.
    // TYPE is a valid next top-level section after CONSTANTE(S), so it must not
    // be consumed as an invalid constant name.
    while (!this._isAtEnd()) {
      this._skipSemicolons();

      if (
        this._check(TokenType.DEBUT)     ||
        this._check(TokenType.FIN)       ||
        this._check(TokenType.TYPE)      ||
        this._check(TokenType.VARIABLES) ||
        this._check(TokenType.VARIABLE)  ||
        this._check(TokenType.CONSTANTES)||
        this._check(TokenType.CONSTANTE)
      ) break;

      if (this._isAtEnd()) break;

      // Doit commencer par un IDENTIFIER
      if (!this._check(TokenType.IDENTIFIER)) {
        this._addError(this._makeError(
          `Nom de constante invalide : "${this._current().value ?? this._current().type}"`,
          this._current(),
          { hint: 'Une déclaration de constante commence par un identifiant. Ex : Pi = 3.14 : REEL;' }
        ));
        this._advance();
        continue;
      }

      const nameTok = this._advance(); // consommer IDENTIFIER
      const constName = nameTok.value;

      // '=' obligatoire
      if (!this._check(TokenType.EQ)) {
        this._addError(this._makeError(
          `Opérateur '=' manquant après le nom '${constName}'`,
          this._current(),
          { hint: `Syntaxe : ${constName} = Valeur : TYPE;` }
        ));
        this._synchronizeConstantDeclaration();
        continue;
      }
      this._advance(); // consommer '='

      // Valeur : seuls les littéraux sont autorisés (pas d'expressions complexes)
      const valueTok = this._current();
      let valueNode = null;
      let inferredType = null;

      if (this._check(TokenType.NUMBER)) {
        const raw = this._advance().value;
        const isInt = Number.isInteger(raw);
        valueNode    = isInt ? { type: 'NUMBER', value: raw } : { type: 'NUMBER', value: raw };
        inferredType = isInt ? 'entier' : 'reel';
      } else if (this._check(TokenType.STRING)) {
        valueNode    = { type: 'STRING', value: this._advance().value };
        inferredType = 'chaine';
      } else if (this._check(TokenType.CHAR)) {
        valueNode    = { type: 'CHAR',   value: this._advance().value };
        inferredType = 'chaine'; // CHAR compatible chaine
      } else if (this._check(TokenType.BOOLEAN)) {
        valueNode    = { type: 'BOOLEAN', value: this._advance().value };
        inferredType = 'booleen';
      } else if (this._check(TokenType.MINUS)) {
        // Nombre négatif : -3.14, -100
        this._advance(); // consommer '-'
        if (!this._check(TokenType.NUMBER)) {
          this._addError(this._makeError(
            `Valeur invalide après '-' pour la constante '${constName}'`,
            this._current(),
            { hint: 'Seules les valeurs littérales sont autorisées (nombres, chaînes, booléens).' }
          ));
          this._synchronizeConstantDeclaration();
          continue;
        }
        const raw = this._advance().value;
        const negVal = -raw;
        valueNode    = { type: 'NUMBER', value: negVal };
        inferredType = Number.isInteger(negVal) ? 'entier' : 'reel';
      } else {
        this._addError(this._makeError(
          `Valeur invalide pour la constante '${constName}'`,
          this._current(),
          {
            hint: 'Seules les valeurs littérales sont autorisées. Ex : Pi = 3.14 : REEL;',
            expected: 'nombre, chaîne ou booléen'
          }
        ));
        this._synchronizeConstantDeclaration();
        continue;
      }

      // ':' obligatoire avant le type
      if (!this._check(TokenType.COLON)) {
        this._addError(this._makeError(
          `':' manquant après la valeur de la constante '${constName}'`,
          this._current(),
          { hint: `Syntaxe : ${constName} = Valeur : TYPE;` }
        ));
        this._synchronizeConstantDeclaration();
        continue;
      }
      this._advance(); // consommer ':'

      // TYPE obligatoire
      const constType = this._parseTypeName();
      if (!constType) {
        this._synchronizeConstantDeclaration();
        continue;
      }

      // Vérification sémantique type–valeur
      // (REEL est compatible avec des valeurs entières ex: 3 : REEL est OK)
      const typeCompatible = (
        (constType === 'entier'  && inferredType === 'entier') ||
        (constType === 'reel'    && (inferredType === 'reel' || inferredType === 'entier')) ||
        (constType === 'chaine'  && inferredType === 'chaine') ||
        (constType === 'booleen' && inferredType === 'booleen')
      );
      if (!typeCompatible) {
        const typeLabels = { entier: 'ENTIER', reel: 'REEL', chaine: 'CHAINE', booleen: 'BOOLEEN' };
        this._addError(this._makeError(
          `Type incompatible avec la valeur pour la constante '${constName}'`,
          valueTok,
          {
            hint: `La valeur est de type ${typeLabels[inferredType] ?? inferredType}, mais le type déclaré est ${typeLabels[constType] ?? constType}.`,
            expected: typeLabels[inferredType] ?? inferredType
          }
        ));
        // Récupération douce : on stocke quand même la constante avec la valeur
      }

      this._expectSemicolon(`la constante '${constName}'`);
      consts.push(new ConstDeclNode(constName, valueNode, constType, nameTok));
    }

    // ── Validation 1 : au moins une déclaration ─────────────────────────────
    if (consts.length === 0) {
      this._addError(this._makeError(
        `Aucune déclaration après ${keywordValue}`,
        this._current(),
        {
          hint: `Ajoutez au moins une constante. Ex : Pi = 3.14 : REEL;`,
          expected: 'déclaration de constante'
        }
      ));
    } else {
      // ── Validation 2 : CONSTANTE (sing.) vs CONSTANTES (plur.) ────────────
      if (isPlural && consts.length === 1) {
        this._addError(this._makeError(
          `Utiliser CONSTANTE pour une seule constante`,
          keyword,
          {
            hint: `Remplacez CONSTANTES par CONSTANTE : une seule constante a été déclarée.`,
            expected: 'CONSTANTE'
          }
        ));
      } else if (!isPlural && consts.length > 1) {
        this._addError(this._makeError(
          `Utiliser CONSTANTES pour plusieurs constantes`,
          keyword,
          {
            hint: `Remplacez CONSTANTE par CONSTANTES : ${consts.length} constantes ont été déclarées.`,
            expected: 'CONSTANTES'
          }
        ));
      }
    }

    return consts;
  },

  _synchronizeConstantDeclaration() {
    this._synchronize(
      TokenType.SEMICOLON,
      TokenType.TYPE,
      TokenType.VARIABLE,
      TokenType.VARIABLES,
      TokenType.CONSTANTE,
      TokenType.CONSTANTES,
      TokenType.DEBUT,
      TokenType.FIN,
    );
  }
};

export default constantDeclarationMethods;
