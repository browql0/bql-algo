/**
 * Parser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parser récursif descendant STRICT pour le pseudo-langage algorithmique
 * marocain, avec collecte de plusieurs erreurs et récupération après erreur.
 *
 * Entrée  : Token[]       (produits par Lexer.js)
 * Sortie  : { ast: ProgramNode | null, errors: AlgoSyntaxError[] }
 *
 * Précédence des opérateurs (du plus faible au plus fort) :
 *   OU  →  ET  →  NON  →  Comparaison  →  +/-  →  /%  →  ^  →  Unaire  →  Primaire
 *
 * Structure stricte imposée :
 *   ALGORITHME nom ;
 *   VARIABLES
 *     nom : type ;
 *     ...
 *   DEBUT
 * 
 *     instructions (chacune terminée par ;)
 *   FIN
 *
 * Règles de validation :
 *  - Présence ALGORITHME + nom + ;
 *  - Bloc VARIABLES optionnel mais strictement validé si présent (le ':' après VARIABLES est INTERDIT)
 *  - DEBUT obligatoire avant le corps
 *  - FIN obligatoire en fin de programme
 *  - ; obligatoire après chaque instruction
 *  - Stack de blocs pour valider SI/FINSI, TANTQUE/FINTANTQUE, POUR/FINPOUR, REPETER/JUSQUA
 *  - Détection d'instructions hors bloc principal
 * ─────────────────────────────────────────────────────────────────────────────
 */

import TokenType from '../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from './AST/nodes.js';
import AlgoSyntaxError from '../errors/SyntaxError.js';

// ── Parser ────────────────────────────────────────────────────────────────────
class Parser {
  /**
   * @param {import('../lexer/Token.js').default[]} tokens   - Tokens du lexer
   * @param {string}                                [source] - Code source brut (pour codeLine)
   */
  constructor(tokens, source = '') {
    this.source = source;
    this.sourceLines = source.split('\n');

    // On filtre les NEWLINE et UNKNOWN pour simplifier le parsing.
    this.tokens = tokens.filter(
      t => t.type !== TokenType.NEWLINE && t.type !== TokenType.UNKNOWN
    );
    this.pos = 0;
       
    /** @type {AlgoSyntaxError[]} Toutes les erreurs collectées, sans doublons */
    this.errors = [];

    /**
     * Limite maximale d'erreurs collectées par passage.
     * Au-delà, le parser s'arrête pour éviter un flood d'erreurs en cascade.
     */
    this.MAX_ERRORS = 20;

    /**
     * Clés des erreurs déjà enregistrées (ligne:colonne:message).
     * Permet d'éviter les doublons exacts.
     * @type {Set<string>}
     */
    this._errorKeys = new Set();
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  /**
   * Point d'entrée principal.
   * Ne lève JAMAIS d'exception — collecte toutes les erreurs.
   * @returns {{ ast: ProgramNode|null, errors: AlgoSyntaxError[] }}
   */
  parse() {
    let ast = null;
    try {
      ast = this._parseProgram();
      // Vérifier qu'il ne reste rien après FIN (sauf EOF)
      this._consumeTrailingTokens();
    } catch (fatalErr) {
      // Seule _validateAlgorithmHeader (ALGORITHME absent) peut encore thrower
      if (fatalErr instanceof AlgoSyntaxError) {
        this._addError(fatalErr);
      } else {
        this._addError(this._makeError(
          'Erreur d\'analyse inattendue',
          this._current(),
          { hint: fatalErr?.message }
        ));
      }
    }
    // Tri final par ligne puis colonne pour un affichage naturel
    this.errors.sort((a, b) => (a.line - b.line) || (a.column - b.column));
    return { ast, errors: this.errors };
  }

  /**
   * Alias public de _synchronize().
   * Avance jusqu'au prochain point stable pour continuer l'analyse après une erreur.
   * @param {...string} extraStopTypes - TokenType supplémentaires comme points d'arrêt
   */
  sync(...extraStopTypes) {
    this._synchronize(...extraStopTypes);
  }

  /**
   * Indique si le parser a atteint la limite maximale d'erreurs.
   * Au-delà de MAX_ERRORS, inutile de continuer l'analyse.
   * @returns {boolean}
   */
  isSaturated() {
    return this.errors.length >= this.MAX_ERRORS;
  }

  // ── Helpers de navigation ────────────────────────────────────────────────────

  _current()             { return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]; }
  _peek(offset = 1)      { return this.tokens[this.pos + offset] ?? this.tokens[this.tokens.length - 1]; }
  _isAtEnd()             { return this._current().type === TokenType.EOF; }
  _check(type)           { return this._current().type === type; }
  _isSoftKeyword(word)   { return this._check(TokenType.IDENTIFIER) && this._current().value.toUpperCase() === word; }

  /**
   * Retourne le dernier token CONSOMMÉ (position pos - 1).
   * Utilisé pour pointer à la fin d'un token lors des erreurs "manquant".
   * @returns {import('../lexer/Token.js').default|null}
   */
  _previousToken() {
    return this.pos > 0 ? this.tokens[this.pos - 1] : null;
  }

  _advance() {
    const tok = this.tokens[this.pos];
    if (tok.type !== TokenType.EOF) this.pos++;
    return tok;
  }

  _match(...types) {
    for (const t of types) {
      if (this._check(t)) { this._advance(); return true; }
    }
    return false;
  }

  // ── Helpers de ponctuation ───────────────────────────────────────────────────

  /** Saute tous les SEMICOLON consécutifs. */
  _skipSemicolons() {
    while (this._check(TokenType.SEMICOLON)) this._advance();
  }

  /**
   * Exige un SEMICOLON. Si absent, ajoute une erreur et continue.
   * La flèche ^ pointe à la FIN du token précédent (où le ';' devrait être),
   * pas au début du token suivant.
   * @param {string} afterWhat - Description de ce qui précède le ';'
   */
  _expectSemicolon(afterWhat) {
    if (this._check(TokenType.SEMICOLON)) {
      this._advance();
      this._skipSemicolons();
      return true;
    }
    // Pointer à la fin du dernier token consommé (pas au début du suivant)
    const prev    = this._previousToken();
    const errLine = prev?.line   ?? this._current().line;
    const prevVal = String(prev?.value ?? '');
    const errCol  = prev
      ? (prev.column + prevVal.length)   // juste après le dernier token
      : this._current().column;

    this._addError(this._makeError(
      `Point-virgule manquant après ${afterWhat}`,
      { line: errLine, column: 0, value: ';' },
      { hint: `Ajoutez ';' à la fin.`, columnOverride: errCol }
    ));
    return false;
  }

  // ── Fabrique et accumulation d'erreurs ──────────────────────────────────────

  /**
   * Enregistre une erreur dans la liste, en appliquant :
   *  1. La limite MAX_ERRORS (flood protection)
   *  2. La déduplication (même ligne + même colonne + même message = doublon)
   *
   * @param {AlgoSyntaxError} error
   * @returns {boolean} true si l'erreur a été ajoutée, false si rejetée
   */
  _addError(error) {
    // ── Flood protection : arrêt à MAX_ERRORS ────────────────────────────────
    if (this.errors.length >= this.MAX_ERRORS) {
      // Ajouter un avertissement unique de saturation si pas déjà présent
      const satKey = 'SATURATED';
      if (!this._errorKeys.has(satKey)) {
        this._errorKeys.add(satKey);
        this.errors.push(this._makeError(
          `Limite de ${this.MAX_ERRORS} erreurs atteinte — analyse stoppée`,
          this._current(),
          { hint: 'Corrigez les erreurs signalées avant de continuer.' }
        ));
      }
      return false;
    }

    // ── Déduplication (ligne:colonne:message) ─────────────────────────────────
    const key = `${error.line}:${error.column}:${error.message}`;
    if (this._errorKeys.has(key)) return false;
    this._errorKeys.add(key);

    this.errors.push(error);
    return true;
  }

  /**
   * Crée un AlgoSyntaxError enrichi avec la ligne de code source.
   *
   * @param {string} message
   * @param {object} tok           - Token de référence (pour line, column, value)
   * @param {object} [opts]
   * @param {string} [opts.expected]     - Ce qui était attendu
   * @param {string} [opts.hint]         - Suggestion pédagogique
   * @param {number} [opts.columnOverride] - Remplace tok.column pour la flèche ^
   */
  _makeError(message, tok, { expected = null, hint = null, columnOverride = null } = {}) {
    const line     = tok?.line   ?? 0;
    const column   = columnOverride !== null ? columnOverride : (tok?.column ?? 0);
    const value    = tok ? (tok.value ?? tok.type) : null;
    const codeLine = (line > 0 && line <= this.sourceLines.length)
      ? this.sourceLines[line - 1]
      : null;

    const fullMsg = expected
      ? `${message} — Attendu : "${expected}"`
      : message;

    return new AlgoSyntaxError({
      message: fullMsg,
      line,
      column,
      value,
      hint,
      codeLine,
      expected,
    });
  }

  /**
   * Exige un token d'un type donné.
   * Si absent : enregistre l'erreur et retourne null (récupération douce).
   */
  _expect(type, friendlyName, hintMessage = null) {
    if (this._check(type)) return this._advance();
    const tok = this._current();
    this._addError(this._makeError(
      `"${friendlyName}" attendu`,
      tok,
      {
        expected: friendlyName,
        hint: hintMessage ?? `Ajoutez "${friendlyName}" à cet endroit.`,
      }
    ));
    return null;
  }

  /**
   * Exige un token d'un type donné.
   * Si absent : lève une exception (erreur non récupérable = arrêt du parsing).
   * Utilisé UNIQUEMENT quand ALGORITHME est absent (premier token du fichier).
   */
  _expectFatal(type, friendlyName, hintMessage = null) {
    if (this._check(type)) return this._advance();
    const tok = this._current();
    throw this._makeError(
      `"${friendlyName}" attendu`,
      tok,
      {
        expected: friendlyName,
        hint: hintMessage ?? `Ajoutez "${friendlyName}" à cet endroit.`,
      }
    );
  }

  // ── Récupération d'erreur ────────────────────────────────────────────────────

  /**
   * Avance jusqu'au prochain point de synchronisation :
   *   - prochain SEMICOLON (consommé)
   *   - ou prochain mot-clé de structure stable
   *
   * C'est le cœur de la stratégie de récupération (error recovery).
   * Après chaque erreur, on synchronise pour continuer l'analyse
   * sans générer une cascade d'erreurs parasites.
   *
   * Points d'arrêt fixes :
   *   ;  SI  POUR  TANTQUE  REPETER  ECRIRE  LIRE
   *   FIN  FINSI  FINPOUR  FINTANTQUE  JUSQUA  EOF
   */
  _synchronize(...extraStopTypes) {
    const STOP = new Set([
      TokenType.SEMICOLON,
      TokenType.DEBUT, TokenType.FIN,
      TokenType.FINSI, TokenType.FINTANTQUE, TokenType.FINPOUR, TokenType.JUSQUA,
      TokenType.SI, TokenType.TANTQUE, TokenType.POUR, TokenType.REPETER,
      TokenType.ECRIRE, TokenType.LIRE,
      TokenType.EOF,
      ...extraStopTypes,
    ]);
    while (!STOP.has(this._current().type)) {
      this._advance();
    }
    if (this._check(TokenType.SEMICOLON)) this._advance();
  }

  // ── Programme ───────────────────────────────────────────────────────────────

  /**
   * programme → ALGORITHMENom; (VARIABLES: décl*)? DEBUT bloc FIN
   *
   * Règle stricte : le nom doit être collé DIRECTEMENT après ALGORITHME,
   * sans espace, underscore ou autre séparateur.
   * Valide  : ALGORITHMEMonProgramme;
   * Invalide : ALGORITHME MonProgramme;  ← espace interdit
   *            ALGORITHME_MonProgramme;  ← underscore interdit
   *            ALGORITHME;              ← nom manquant
   */
  _parseProgram() {
    // ── Vérification fatale : ALGORITHME doit être le 1er token ──────────────────
    if (!this._check(TokenType.ALGORITHME)) {
      throw this._makeError(
        'Le programme doit commencer par le mot-clé ALGORITHME',
        this._current(),
        { hint: 'Commencez par : ALGORITHMEMonProgramme;' }
      );
    }

    // ── En-tête strict : ALGORITHMENom; ──────────────────────────────────
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
        'Le mot-clé DEBUT est obligatoire pour commencer le bloc principal',
        this._current(),
        { hint: 'Ajoutez "DEBUT" avant les instructions du programme.' }
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
  }

  /** Consomme les tokens résiduels après FIN et signale les erreurs. */
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
  }

  // ── Validation de l'en-tête ALGORITHME ──────────────────────────────────────

  /**
   * Valide et consomme l'en-tête : ALGORITHMENom;
   *
   * Règle stricte (format collé obligatoire) :
   *   ✅  ALGORITHMEMonProgramme;    — valide
   *   ❌  ALGORITHME MonProgramme;   — espace interdit
   *   ❌  ALGORITHME_MonProgramme;   — underscore interdit
   *   ❌  ALGORITHME;               — nom manquant
   *
   * Détection du type de séparateur grâce à la colonne du token IDENTIFIER
   * par rapport à la colonne du token ALGORITHME + longueur de "ALGORITHME" (10).
   *
   * @returns {string} Nom de l'algorithme (ou 'SansNom' si absent)
   */
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
          hint: 'Collez le nom immédiatement après ALGORITHME. Ex : ALGORITHMEMonProgramme;',
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
        `Le nom de l'algorithme doit être collé à ALGORITHME (ex: ALGORITHME${name} ou ALGORITHME_${name})`,
        algoToken,
        {
          hint: `Retirez l'${separatorDesc} invalide entre ALGORITHME et le nom. Écrivez : ALGORITHME_${name};`,
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
        `Point-virgule manquant après l'en-tête de l'algorithme (ALGORITHME${name})`,
        nameTok,
        {
          hint: `Ajoutez ';' après "${name}". Ex : ALGORITHME${name};`,
          columnOverride: errCol,
        }
      ));
    }

    return name;
  }

  // ── Section TYPES ──────────────────────────────────────────────────────

  /**
   * Parse la déclaration d'un enregistrement :
   * TYPE Nom = ENREGISTREMENT
   *    champ : TYPE;
   * FIN Nom
   */
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
    
    this._skipSemicolons(); // Tolérer un ';' après ENREGISTREMENT bien que non standard
    
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
  }

  // ── Section CONSTANTE(S) ───────────────────────────────────────────────

  /**
   * Parse le bloc CONSTANTE decl / CONSTANTES decl+
   * decl → IDENTIFIER = Valeur : TYPE ;
   *
   * Règles strictes :
   *  - ":" interdit après CONSTANTE(S) (comme pour VARIABLE(S)).
   *  - Au moins une déclaration obligatoire.
   *  - CONSTANTE  (singulier) → exactement 1 constante.
   *  - CONSTANTES (pluriel)  → 2+ constantes.
   *  - Valeur oblig : NomConst = Valeur : TYPE;
   *  - « = » est l'opérateur d'affectation des constantes (pas « <- »).
   *  - Vérification type–valeur (entier compat. avec ENTIER, etc.).
   *  - Seuls les littéraux (nombre, chaîne, booléen) sont autorisés.
   *
   * @returns {ConstDeclNode[]}
   */
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

    // Parser toutes les déclarations jusqu'à DEBUT / FIN / VARIABLE(S) / CONSTANTE(S) / EOF
    while (!this._isAtEnd()) {
      this._skipSemicolons();

      if (
        this._check(TokenType.DEBUT)     ||
        this._check(TokenType.FIN)       ||
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
        this._synchronize(TokenType.SEMICOLON);
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
          this._synchronize(TokenType.SEMICOLON);
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
        this._synchronize(TokenType.SEMICOLON);
        continue;
      }

      // ':' obligatoire avant le type
      if (!this._check(TokenType.COLON)) {
        this._addError(this._makeError(
          `':' manquant après la valeur de la constante '${constName}'`,
          this._current(),
          { hint: `Syntaxe : ${constName} = Valeur : TYPE;` }
        ));
        this._synchronize(TokenType.SEMICOLON);
        continue;
      }
      this._advance(); // consommer ':'

      // TYPE obligatoire
      const constType = this._parseTypeName();
      if (!constType) {
        this._synchronize(TokenType.SEMICOLON);
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
  }

  // ── Déclarations de variables ───────────────────────────────────────────────────

  /**
   * Parse le bloc VARIABLE decl / VARIABLES decl+
   * decl → IDENTIFIER : TYPE ;
   *
   * Règles strictes :
   *  - Le caractère ":" est STRICTEMENT INTERDIT après VARIABLE(S).
   *    → "VARIABLES :" génère une erreur explicite.
   *  - Au moins une déclaration doit suivre VARIABLE(S).
   *    → sans déclaration → erreur.
   *  - VARIABLE  (singulier) → exactement 1 symbole déclaré.
   *    → 2+ symboles → "Utiliser VARIABLES pour plusieurs variables".
   *  - VARIABLES (pluriel)  → 2 symboles ou plus.
   *    → 1 symbole → "Utiliser VARIABLE pour une seule variable".
   *  - Les tableaux comptent pour 1 symbole chacun.
   *  - Les listes virgulées (a, b : ENTIER) comptent chaque nom.
   *
   * S'arrête proprement quand on rencontre DEBUT, FIN, ou EOF.
   * Ne génère PAS d'erreurs parasites sur les tokens de structure.
   *
   * @returns {VarDeclNode[]}
   */
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
  }

  /**
   * @deprecated Use _parseVariablesSection() instead
   */
  _parseVarBlock() {
    return this._parseVariablesSection();
  }

  /**
   * Consomme un nom de type et retourne la chaîne normalisée.
   * Accepte les types natifs et les identifiants (pour les types structurés).
   */
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

  // ── Bloc d'instructions ──────────────────────────────────────────────────────

  /**
   * Analyse une suite d'instructions jusqu'à rencontrer l'un des stopTypes.
   *
   * Comportement de compilateur réel :
   *  - Collecte TOUTES les erreurs en un seul passage
   *  - Après chaque erreur : synchronise sur le prochain point stable
   *  - S'arrête proprement si isSaturated() (limite MAX_ERRORS atteinte)
   *
   * @param {string[]} stopTypes - TokenType qui terminent le bloc
   * @returns {BlockNode}
   */
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
  }

  // ── Instructions ─────────────────────────────────────────────────────────────

  _parseStatement(stopTypes = []) {
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
          hint = 'Un mot-clé SINON ou SINON SI est mal placé. "SINON" ne peut être suivi d\'un "SINON SI".';
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


  // ── Affectation ──────────────────────────────────────────────────────────────
  
  /** Tableau Nom[taille] : TYPE;  OU Tableau Nom[] : TYPE; */
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

  /**
   * Allocation de taille : Tableau Nom[taille];
   * Affectation matricielle : Tableau Nom[i] <- valeur;
   */
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
  }

  // ── Affectation ──────────────────────────────────────────────────────────────

  /** ident <- expr ; ou e1.nom <- expr ; ou groupe[i].nom <- expr ; */
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

  // ── Condition SI ─────────────────────────────────────────────────────────────

  /**
   * SI cond ALORS bloc
   *   (SINON SI cond ALORS bloc)*
   *   (SINON bloc)?
   * FINSI
   */
  _parseIf() {
    const siTok = this._advance(); // SI

    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError(
        'Parenthèse ouvrante manquante après SI',
        this._current(),
        { hint: 'Écrivez : SI (condition) ALORS' }
      ));
    } else {
      this._advance(); // consommer '('
    }

    let cond = null;
    if (this._check(TokenType.RPAREN) || this._check(TokenType.ALORS)) {
      this._addError(this._makeError(
        'Condition manquante dans le SI',
        this._current(),
        { hint: 'Écrivez la condition entre les parenthèses : SI (condition) ALORS' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError(
        'Parenthèse fermante manquante après la condition du SI',
        this._current(),
        { hint: 'Ajoutez ")" après la condition.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }

    if (!this._check(TokenType.ALORS)) {
      this._addError(this._makeError(
        'Le mot-clé ALORS est obligatoire après la condition du SI',
        this._current(),
        { hint: 'Écrivez : SI (condition) ALORS' }
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
      
      if (!this._check(TokenType.LPAREN)) {
        this._addError(this._makeError(
          'Parenthèse ouvrante manquante après SINON SI',
          this._current(),
          { hint: 'Écrivez : SINON SI (condition) ALORS' }
        ));
      } else {
        this._advance();
      }

      let elseifCond = null;
      if (this._check(TokenType.RPAREN) || this._check(TokenType.ALORS)) {
        this._addError(this._makeError(
          'Condition manquante dans le SINON SI',
          this._current(),
          { hint: 'Écrivez la condition entre les parenthèses : SINON SI (condition) ALORS' }
        ));
        elseifCond = new BooleanNode(true, this._current());
      } else {
        elseifCond = this._parseExpression();
      }

      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante après la condition du SINON SI',
          this._current(),
          { hint: 'Ajoutez ")" après la condition.' }
        ));
      } else {
        this._advance();
      }

      if (!this._check(TokenType.ALORS)) {
        this._addError(this._makeError(
          'ALORS manquant après la condition de SINON SI',
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
      // Tout SINON ou SINON SI rencontré lèvera une erreur 
      // car ils ne sont pas dans stopTypes.
      elseBlock = this._parseBlock([TokenType.FINSI]);
    }

    if (!this._check(TokenType.FINSI)) {
      this._addError(this._makeError(
        'FINSI manquant : Le bloc SI doit être fermé',
        this._current(),
        { hint: 'Ajoutez "FINSI" à la fin de la structure conditionnelle.' }
      ));
    } else {
      this._advance(); // consommer FINSI
    }
    this._skipSemicolons();

    return new IfNode(cond, thenBlock, elseifClauses, elseBlock, siTok);
  }

  // ── Structure SELON ──────────────────────────────────────────────────────────

  /**
   * SELON ( expression ) FAIRE
   *   CAS expression : bloc
   *   (AUTRE : bloc)?
   * FINSELON
   */
  _parseSwitch() {
    const selonTok = this._advance(); // consommer SELON

    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError('Parenthèse ouvrante manquante après SELON', this._current(), { hint: 'Écrivez : SELON (expression) FAIRE' }));
    } else {
      this._advance(); // consommer '('
    }

    let expression = null;
    if (this._check(TokenType.RPAREN) || this._check(TokenType.FAIRE)) {
      this._addError(this._makeError('Expression manquante dans SELON', this._current(), { hint: 'Écrivez l\'expression entre les parenthèses : SELON (expression) FAIRE' }));
    } else {
      expression = this._parseExpression();
    }

    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError('Parenthèse fermante manquante après l\'expression du SELON', this._current(), { hint: 'Ajoutez ")" après l\'expression.' }));
    } else {
      this._advance(); // consommer ')'
    }

    if (!this._check(TokenType.FAIRE)) {
      this._addError(this._makeError('Le mot-clé FAIRE est obligatoire après SELON(...)', this._current(), { hint: 'Écrivez : SELON (expression) FAIRE' }));
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

  // ── Boucle TANTQUE ───────────────────────────────────────────────────────────

  /** TANTQUE ( cond ) FAIRE bloc FINTANTQUE */
  _parseWhile() {
    const tok = this._advance(); // TANTQUE

    // Parenthèse ouvrante obligatoire
    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError(
        'Parenthèse ouvrante manquante après TANTQUE',
        this._current(),
        { hint: 'Écrivez : TANTQUE (condition) FAIRE' }
      ));
    } else {
      this._advance(); // consommer '('
    }

    let cond = null;
    // Condition obligatoire
    if (this._check(TokenType.RPAREN) || this._check(TokenType.FAIRE)) {
      this._addError(this._makeError(
        'Condition manquante dans la boucle TANTQUE',
        this._current(),
        { hint: 'Écrivez la condition entre les parenthèses : TANTQUE (condition) FAIRE' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    // Parenthèse fermante obligatoire
    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError(
        'Parenthèse fermante manquante après la condition du TANTQUE',
        this._current(),
        { hint: 'Ajoutez ")" après la condition.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }

    // FAIRE obligatoire
    if (!this._check(TokenType.FAIRE)) {
      this._addError(this._makeError(
        'Le mot-clé FAIRE est obligatoire après la condition du TANTQUE',
        this._current(),
        { hint: 'Écrivez : TANTQUE (condition) FAIRE' }
      ));
    } else {
      this._advance(); // consommer FAIRE
    }
    this._skipSemicolons();

    // Block
    const body = this._parseBlock([TokenType.FINTANTQUE]);

    // FINTANTQUE obligatoire
    if (!this._check(TokenType.FINTANTQUE)) {
      this._addError(this._makeError(
        'La boucle TANTQUE doit se terminer par FINTANTQUE',
        this._current(),
        { hint: 'Ajoutez "FINTANTQUE" pour fermer la boucle.' }
      ));
    } else {
      this._advance(); // consommer FINTANTQUE
    }
    this._skipSemicolons();

    return new WhileNode(cond, body, tok);
  }

  // ── Boucle POUR ──────────────────────────────────────────────────────────────

  /**
   * POUR ident ALLANT DE expr A expr [PAS expr] FAIRE bloc FINPOUR
   *
   * Syntaxe complète :
   *   POUR i ALLANT DE debut A fin FAIRE           ← pas implicite = 1
   *   POUR i ALLANT DE debut A fin PAS valeur FAIRE ← pas explicite ≠ 0 et ≠ 1
   *
   * Règles du PAS :
   *   - Absent    → pas implicite de 1 (step = null dans l'AST)
   *   - PAS 1     → ERREUR : inutile, doit être omis
   *   - PAS 0     → ERREUR : boucle infinie
   *   - PAS n≠0,1 → valide (ex: PAS 2, PAS -1, PAS 5)
   */
  _parseFor() {
    const tok = this._advance(); // consommer POUR
    const v = tok.value ?? 'POUR';

    // ── 1. Variable de boucle (identifiant valide) ────────────────────────────
    if (!this._check(TokenType.IDENTIFIER)) {
      this._addError(this._makeError(
        'Variable de boucle manquante après POUR',
        this._current(),
        { hint: 'Écrivez : POUR i ALLANT DE debut A fin FAIRE' }
      ));
      this._synchronize(TokenType.FINPOUR, TokenType.FIN);
      return new ForNode('i', new NumberNode(1, tok), new NumberNode(1, tok), null, new BlockNode([]), tok);
    }
    const varTok = this._advance(); // consommer IDENTIFIER
    const varName = varTok.value;

    // ── 2. ALLANT DE obligatoire ──────────────────────────────────────────────
    if (this._check(TokenType.ALLANT_DE)) {
      // Forme correcte : "ALLANT DE" tokenisé en un seul token composé
      this._advance(); // consommer ALLANT_DE
    } else if (this._isSoftKeyword('DE')) {
      // "DE" seul sans "ALLANT" → erreur, "ALLANT" manquant
      this._addError(this._makeError(
        `"ALLANT" manquant avant "DE" dans la boucle POUR`,
        this._current(),
        { hint: `Écrivez : POUR ${varName} ALLANT DE debut A fin FAIRE` }
      ));
      this._advance(); // consommer DE quand même pour continuer le parsing
    } else if (this._check(TokenType.ALLANT)) {
      // "ALLANT" seul sans "DE" → erreur, "DE" manquant
      this._addError(this._makeError(
        `"DE" manquant après "ALLANT" dans la boucle POUR`,
        this._current(),
        { hint: `Écrivez : POUR ${varName} ALLANT DE debut A fin FAIRE` }
      ));
      this._advance(); // consommer ALLANT
    } else {
      // Ni "ALLANT DE", ni "DE", ni "ALLANT" → structure complètement incorrecte
      this._addError(this._makeError(
        `"ALLANT DE" manquant dans la boucle POUR`,
        this._current(),
        { hint: `Écrivez : POUR ${varName} ALLANT DE debut A fin FAIRE` }
      ));
      // Chercher A ou FAIRE pour récupérer partiellement
      // A est un soft-keyword : IDENTIFIER avec valeur 'A'
      while (
        !this._isAtEnd() &&
        !this._isSoftKeyword('A') &&
        !this._check(TokenType.FAIRE) &&
        !this._check(TokenType.FINPOUR) &&
        !this._check(TokenType.FIN)
      ) {
        this._advance();
      }
    }

    // ── 3. Borne de départ ───────────────────────────────────────────────────
    // A et PAS sont des soft-keywords : IDENTIFIER avec valeur 'A' / 'PAS'
    if (
      this._isSoftKeyword('A') ||
      this._isSoftKeyword('PAS') ||
      this._check(TokenType.FAIRE) ||
      this._check(TokenType.FINPOUR)
    ) {
      this._addError(this._makeError(
        `Borne de départ manquante après "ALLANT DE" dans la boucle POUR`,
        this._current(),
        { hint: `Précisez la valeur de début. Ex : POUR ${varName} ALLANT DE 1 A 10 FAIRE` }
      ));
    }
    const from = this._parseExpression();

    // ── 4. A obligatoire ─────────────────────────────────────────────────────
    // A est un soft-keyword : IDENTIFIER avec valeur 'A'
    if (!this._isSoftKeyword('A')) {
      this._addError(this._makeError(
        `"A" manquant dans la boucle POUR (après la borne de départ)`,
        this._current(),
        { hint: `Écrivez : POUR ${varName} ALLANT DE debut A fin FAIRE` }
      ));
    } else {
      this._advance(); // consommer A
    }

    // ── 5. Borne de fin ──────────────────────────────────────────────────────
    // PAS est un soft-keyword : IDENTIFIER avec valeur 'PAS'
    if (
      this._isSoftKeyword('PAS') ||
      this._check(TokenType.FAIRE) ||
      this._check(TokenType.FINPOUR)
    ) {
      this._addError(this._makeError(
        `Borne de fin manquante après "A" dans la boucle POUR`,
        this._current(),
        { hint: `Précisez la valeur de fin. Ex : POUR ${varName} ALLANT DE 1 A 10 FAIRE` }
      ));
    }
    const to = this._parseExpression();

    // ── 6. PAS (optionnel) ───────────────────────────────────────────────────
    //   • Absent    → step = null (pas implicite = 1 à l'exécution)
    //   • PAS 1     → ERREUR : interdit (inutile)
    //   • PAS 0     → ERREUR : interdit (boucle infinie)
    //   • PAS n≠0,1 → valide
    let step = null; // null = PAS absent = pas implicite de 1

    // PAS est un soft-keyword : IDENTIFIER avec valeur 'PAS'
    if (this._isSoftKeyword('PAS')) {
      const pasTok = this._advance(); // consommer PAS

      // Vérifier qu'une valeur suit PAS
      if (
        this._check(TokenType.FAIRE) ||
        this._check(TokenType.FINPOUR) ||
        this._isAtEnd()
      ) {
        this._addError(this._makeError(
          `Valeur manquante après "PAS" dans la boucle POUR`,
          this._current(),
          { hint: `Précisez la valeur du pas. Ex : PAS 2, PAS -1` }
        ));
        // step reste null pour récupération gracieuse
      } else {
        // Analyser la valeur du pas (peut être négatif : PAS -1)
        const stepExpr = this._parseExpression();

        // ── Validation statique du pas (seulement si c'est un nombre littéral) ──
        //    Pour les variables ou expressions dynamiques on ne peut pas valider
        //    statiquement → on laissera l'interpréteur vérifier à l'exécution.
        const isNumberLiteral = stepExpr.type === 'NUMBER';
        const isNegLiteral = (
          stepExpr.type === 'UNARY_OP' &&
          stepExpr.operator === '-' &&
          stepExpr.operand?.type === 'NUMBER'
        );

        if (isNumberLiteral || isNegLiteral) {
          const rawVal = isNegLiteral
            ? -(stepExpr.operand.value)
            : stepExpr.value;

          if (rawVal === 0) {
            this._addError(this._makeError(
              `PAS 0 interdit : le pas d'une boucle POUR ne peut pas être nul (boucle infinie)`,
              pasTok,
              { hint: `Utilisez un pas non nul, ex : PAS 2 ou PAS -1` }
            ));
          } else if (rawVal === 1) {
            this._addError(this._makeError(
              `PAS 1 interdit : le pas de 1 est implicite, n'écrivez pas "PAS 1"`,
              pasTok,
              { hint: `Supprimez "PAS 1". Ex : POUR ${varName} ALLANT DE 1 A 10 FAIRE` }
            ));
          } else {
            step = stepExpr; // pas valide, on l'utilise
          }
        } else {
          // Pas dynamique (variable ou expression) : on l'accepte pour l'AST,
          // l'interpréteur sera responsable de la validation à l'exécution.
          step = stepExpr;
        }
      }
    }

    // ── 7. FAIRE obligatoire ─────────────────────────────────────────────────
    if (!this._check(TokenType.FAIRE)) {
      this._addError(this._makeError(
        `"FAIRE" manquant dans la boucle POUR (après la borne de fin${step !== null ? ' et le pas' : ''})`,
        this._current(),
        { hint: `Écrivez : POUR ${varName} ALLANT DE debut A fin FAIRE` }
      ));
    } else {
      this._advance(); // consommer FAIRE
    }
    this._skipSemicolons();

    // ── 8. Corps de la boucle ────────────────────────────────────────────────
    const body = this._parseBlock([TokenType.FINPOUR]);

    // ── 9. FINPOUR obligatoire ───────────────────────────────────────────────
    if (!this._check(TokenType.FINPOUR)) {
      this._addError(this._makeError(
        `La boucle POUR doit se terminer par FINPOUR`,
        this._current(),
        { hint: `Ajoutez "FINPOUR" pour fermer la boucle.` }
      ));
    } else {
      this._advance(); // consommer FINPOUR
    }
    this._skipSemicolons();

    return new ForNode(varName, from, to, step, body, tok);
  }


  // ── Boucle REPETER ───────────────────────────────────────────────────────────

  /** REPETER bloc JUSQUA ( cond ) */
  _parseDoWhile() {
    const tok = this._advance(); // REPETER
    this._skipSemicolons();

    const body = this._parseBlock([TokenType.JUSQUA]);

    // JUSQUA obligatoire
    if (!this._check(TokenType.JUSQUA)) {
      this._addError(this._makeError(
        'Le bloc REPETER doit se terminer par JUSQUA suivi d\'une condition',
        this._current(),
        { hint: 'Ajoutez "JUSQUA (condition)" pour fermer le bloc REPETER.' }
      ));
      return new DoWhileNode(body, new BooleanNode(true, tok), tok);
    }
    this._advance(); // consommer JUSQUA

    // Parenthèse ouvrante obligatoire
    if (!this._check(TokenType.LPAREN)) {
      this._addError(this._makeError(
        'Parenthèse ouvrante manquante après JUSQUA',
        this._current(),
        { hint: 'Écrivez : JUSQUA (condition)' }
      ));
    } else {
      this._advance(); // consommer '('
    }

    let cond = null;
    // Condition obligatoire
    if (
      this._check(TokenType.RPAREN) ||
      this._check(TokenType.SEMICOLON) ||
      this._check(TokenType.FIN) ||
      this._isAtEnd()
    ) {
      this._addError(this._makeError(
        'Condition manquante dans la boucle REPETER',
        this._current(),
        { hint: 'Écrivez la condition entre les parenthèses : JUSQUA (condition)' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    // Parenthèse fermante obligatoire
    if (!this._check(TokenType.RPAREN)) {
      this._addError(this._makeError(
        'Parenthèse fermante manquante après la condition du JUSQUA',
        this._current(),
        { hint: 'Ajoutez ")" après la condition.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }
    this._skipSemicolons();

    return new DoWhileNode(body, cond, tok);
  }

  // ── Entrée / Sortie ──────────────────────────────────────────────────────────

  /**
   * ECRIRE ( expr, expr, … ) ;
   *
   * Accepte n'importe quelle expression comme argument :
   *   ECRIRE("bonjour");
   *   ECRIRE(a);
   *   ECRIRE(42);
   *   ECRIRE("valeur :", a, "\n");
   */
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
  }

  /**
   * Parse un seul argument de ECRIRE.
   * Un argument peut être :
   *  - une chaîne STRING
   *  - un nombre NUMBER
   *  - un booléen BOOLEAN
   *  - un identifiant IDENTIFIER
   *  - n'importe quelle expression valide
   *
   * @returns {object|null} nœud AST ou null si invalide
   */
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
  }

  /**
   * LIRE ( cible ) ;
   *
   * Accepte :
   *   LIRE(nomVariable);    → variable simple
   *   LIRE(T[i]);           → accès tableau 1D
   *
   * La cible est parsée comme un nœud AST (IdentifierNode ou ArrayAccessNode).
   */
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
    } else {
      // Variable simple
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Expressions — Précédence croissante (du plus faible au plus fort)
  // ═══════════════════════════════════════════════════════════════════════════

  _parseExpression() { return this._parseOr(); }

  _parseOr() {
    let left = this._parseAnd();
    while (this._check(TokenType.OU)) {
      const op    = this._advance();
      const right = this._parseAnd();
      left = new BinaryOpNode(left, 'OU', right, op);
    }
    return left;
  }

  _parseAnd() {
    let left = this._parseNot();
    while (this._check(TokenType.ET)) {
      const op    = this._advance();
      const right = this._parseNot();
      left = new BinaryOpNode(left, 'ET', right, op);
    }
    return left;
  }

  _parseNot() {
    if (this._check(TokenType.NON)) {
      const op      = this._advance();
      const operand = this._parseNot();
      return new UnaryOpNode('NON', operand, op);
    }
    return this._parseComparison();
  }

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
  }

  _parseAddSub() {
    let left = this._parseMulDivMod();
    while (this._check(TokenType.PLUS) || this._check(TokenType.MINUS)) {
      const op    = this._advance();
      const right = this._parseMulDivMod();
      left = new BinaryOpNode(left, op.value, right, op);
    }
    return left;
  }

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
  }

  _parsePower() {
    let base = this._parseUnary();
    if (this._check(TokenType.POWER)) {
      const op  = this._advance();
      const exp = this._parsePower(); // associativité droite
      return new BinaryOpNode(base, '^', exp, op);
    }
    return base;
  }

  _parseUnary() {
    if (this._check(TokenType.MINUS)) {
      const op      = this._advance();
      const operand = this._parseUnary();
      return new UnaryOpNode('-', operand, op);
    }
    return this._parsePrimary();
  }

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
      const tableauTok = this._advance(); // consomme TABLEAU
      
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
      
      // Si on trouve '[', c'est un accès tableau (Stricte Règle: Autorisé sans mot clé pour la lecture)
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
}

export default Parser;
