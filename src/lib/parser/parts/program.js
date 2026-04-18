import TokenType from '../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../AST/nodes.js';

const programMethods = {
  _parseProgram() {
    // ── Vérification fatale : ALGORITHME doit être le 1er token ──────────────────
    if (!this._check(TokenType.ALGORITHME)) {
      throw this._makeError(
        'Le programme doit commencer par le mot-clé ALGORITHME',
        this._current(),
        { hint: 'Commencez par : ALGORITHMEMonProgramme; ou ALGORITHME_MonProgramme;' }
      );
    }

    // ── En-tête strict : ALGORITHMENom; ou ALGORITHME_Nom; ───────────────
    const algoToken = this._current();
    const name = this._validateAlgorithmHeader();

    // ── Bloc CONSTANTE(S) (optionnel, doit précéder VARIABLE(S)) ─────────────
    const constants = [];
    while (
      this._check(TokenType.CONSTANTE) ||
      this._check(TokenType.CONSTANTES)
    ) {
      constants.push(...this._parseConstantsSection());
    }

    // ── Bloc TYPES (optionnel) ───────────────────────────────────────────────
    const customTypes = [];
    while (this._check(TokenType.TYPE)) {
      customTypes.push(this._parseTypeDeclaration());
    }

    // ── Bloc VARIABLE(S) (optionnel mais strict) ──────────────────────
    const declarations = [];

    // Détection d'ordre invalide : VARIABLE(S) trouvé APRES une section qui
    // ne serait pas encore arrivée — ici on lui permet de tomber naturellement.
    while (
      this._check(TokenType.VARIABLE) ||
      this._check(TokenType.VARIABLES)
    ) {
      declarations.push(...this._parseVariablesSection());

      // Après un bloc VARIABLE(S), si on tombe sur CONSTANTE(S) → erreur d'ordre
      if (this._check(TokenType.CONSTANTE) || this._check(TokenType.CONSTANTES)) {
        this._addError(this._makeError(
          'Les constantes doivent être déclarées avant les variables',
          this._current(),
          {
            hint: 'Déplacez la section CONSTANTE(S) avant VARIABLE(S).',
            expected: 'VARIABLE ou DEBUT'
          }
        ));
        // Récupération : parser quand même les constantes mal placées
        while (this._check(TokenType.CONSTANTE) || this._check(TokenType.CONSTANTES)) {
          constants.push(...this._parseConstantsSection());
        }
      }
    }

    // ── DEBUT ───────────────────────────────────────────────────────────────
    if (!this._check(TokenType.DEBUT)) {
      this._addError(this._makeError(
        'Le mot-clé DEBUT est obligatoire pour commencer un algorithme',
        this._current(),
        { hint: 'Ajoutez "DEBUT" apres la declarations des variables' }
      ));
      // Try to recover by advancing until we find DEBUT or FIN
      this._synchronize(TokenType.DEBUT, TokenType.FIN);
    }
    
    // Consommer DEBUT si présent
    if (this._check(TokenType.DEBUT)) {
      this._advance();
    }
    this._skipSemicolons();

    // ── Corps du programme ───────────────────────────────────────────────────
    const body = this._parseBlock([TokenType.FIN]);

    // ── FIN ─────────────────────────────────────────────────────────────────
    if (!this._check(TokenType.FIN)) {
      this._addError(this._makeError(
        'Le mot-clé FIN est obligatoire pour terminer le programme',
        this._current(),
        { hint: 'Ajoutez "FIN" à la fin du programme.' }
      ));
    } else {
      this._advance(); // consommer FIN
    }
    this._skipSemicolons();

    return new ProgramNode(name, constants, customTypes, declarations, body, algoToken);
  },

  _consumeTrailingTokens() {
    this._skipSemicolons();
    if (!this._isAtEnd()) {
      const tok = this._current();
      this._addError(this._makeError(
        'Instructions ou tokens inattendus en dehors du bloc principal',
        tok,
        { hint: 'Aucune instruction ne peut apparaître après FIN.' }
      ));
    }
  },

  _validateAlgorithmHeader() {
    const algoToken = this._advance(); // consomme le token ALGORITHME
    const algoLine  = algoToken.line;
    const algoCol   = algoToken.column;

    // Position attendue du premier caractère du nom (collé = juste après les 10 chars)
    let expectedNameCol = algoCol + 10; // 'ALGORITHME' fait exactement 10 caractères

    // ── 1. Vérification de la présence du nom ────────────────────────────────
    if (!this._check(TokenType.IDENTIFIER)) {
      // Pas d'identifiant du tout : soit ';', soit un mot-clé, soit EOF
      this._addError(this._makeError(
        'Nom de l\'algorithme manquant après ALGORITHME',
        algoToken,
        {
          hint: 'Utilisez une des deux formes valides : ALGORITHMEMonProgramme; ou ALGORITHME_MonProgramme;',
          columnOverride: expectedNameCol, // flèche ^ là où le nom devrait commencer
        }
      ));
      // Récupération : sauter le ';' s'il est présent et continuer
      this._skipSemicolons();
      return 'SansNom';
    }

    const nameTok = this._advance(); // consomme IDENTIFIER
    const name    = nameTok.value;

    // ── 2. Vérification que le nom est collé (pas de séparateur) ─────────────
    //
    // Le lexer place le token IDENTIFIER à la colonne exacte où il a commencé.
    // Si algoCol = 1 et name commence à col 11, le nom est collé (valide).
    // Si name commence à col 12, on vérifie si le 11e char est un underscore.
    //
    const lineText = this.sourceLines[algoLine - 1] ?? '';
    const gapChar  = lineText[algoCol + 9]; // char immédiatement après ALGORITHME
    const isUnderscore = gapChar === '_';
    expectedNameCol = algoCol + 10 + (isUnderscore ? 1 : 0);

    if (nameTok.line !== algoLine || nameTok.column !== expectedNameCol) {
      // Déterminer le type de séparateur pour un message précis
      let separatorDesc = 'caractère inconnu';

      if (nameTok.line !== algoLine) {
        separatorDesc = 'saut de ligne';
      } else if (gapChar === ' ' || gapChar === '\t') {
        separatorDesc = 'espace';
      }

      this._addError(this._makeError(
        `Le nom de l'algorithme doit suivre ALGORITHME sans espace (ex: ALGORITHME${name} ou ALGORITHME_${name})`,
        algoToken,
        {
          hint: `Retirez l'${separatorDesc} invalide entre ALGORITHME et le nom. Formes valides : ALGORITHME${name}; ou ALGORITHME_${name};`,
          columnOverride: expectedNameCol, // flèche ^ pointe au début du séparateur
        }
      ));
    }

    // ── 3. Vérification du point-virgule ──────────────────────────────────────
    //
    // La flèche doit pointer à la FIN du nom (col + longueur du nom),
    // là où le ';' devrait se trouver.
    //
    if (this._check(TokenType.SEMICOLON)) {
      this._advance();       // consomme ';'
      this._skipSemicolons(); // saute les ';' consécutifs
    } else {
      const errCol = nameTok.column + name.length; // juste après le dernier char du nom
      this._addError(this._makeError(
        `Point-virgule manquant après l'en-tête de l'algorithme`,
        nameTok,
        {
          hint: `Ajoutez ';' après "${name}". Ex : ALGORITHME${name}; ou ALGORITHME_${name};`,
          columnOverride: errCol,
        }
      ));
    }

    return name;
  }
};

export default programMethods;
