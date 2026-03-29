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
 *   VARIABLES:
 *     nom : type ;
 *     ...
 *   DEBUT
 *     instructions (chacune terminée par ;)
 *   FIN
 *
 * Règles de validation :
 *  - Présence ALGORITHME + nom + ;
 *  - Bloc VARIABLES: optionnel mais strictement validé si présent
 *  - DEBUT obligatoire avant le corps
 *  - FIN obligatoire en fin de programme
 *  - ; obligatoire après chaque instruction
 *  - Stack de blocs pour valider SI/FINSI, TANTQUE/FINTANTQUE, POUR/FINPOUR, REPETER/JUSQUA
 *  - Détection d'instructions hors bloc principal
 * ─────────────────────────────────────────────────────────────────────────────
 */

import TokenType from '../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  BinaryOpNode, UnaryOpNode,
  AssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode,
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
    // ── Vérification fatale : ALGORITHME doit être le 1er token ──────────
    if (!this._check(TokenType.ALGORITHME)) {
      throw this._makeError(
        'Le programme doit commencer par le mot-clé ALGORITHME',
        this._current(),
        { hint: 'Commencez par : ALGORITHMEMonProgramme;' }
      );
    }

    // ── En-tête strict : ALGORITHMENom; ────────────────────────────────
    const algoToken = this._current(); // sauvegarde avant avancement
    const name = this._validateAlgorithmHeader();

    // ── Bloc VARIABLES (optionnel mais strict) ──────────────────────────────
    const declarations = [];
    while (
      this._check(TokenType.VARIABLE) ||
      this._check(TokenType.VARIABLES)
    ) {
      declarations.push(...this._parseVarBlock());
    }

    // ── DEBUT ───────────────────────────────────────────────────────────────
    if (!this._check(TokenType.DEBUT)) {
      this.errors.push(this._makeError(
        'Le mot-clé DEBUT est obligatoire pour commencer le bloc principal',
        this._current(),
        { hint: 'Ajoutez "DEBUT" avant les instructions du programme.' }
      ));
      // Tente de s'avancer jusqu'à DEBUT pour récupérer
      while (!this._isAtEnd() && !this._check(TokenType.DEBUT) && !this._check(TokenType.FIN)) {
        this._advance();
      }
    }
    const debutToken = this._match(TokenType.DEBUT) ? null : null; // déjà vérifié ci-dessus
    if (this._check(TokenType.DEBUT)) this._advance(); // consommer DEBUT si encore là
    this._skipSemicolons();

    // ── Corps du programme ───────────────────────────────────────────────────
    const body = this._parseBlock([TokenType.FIN]);

    // ── FIN ─────────────────────────────────────────────────────────────────
    if (!this._check(TokenType.FIN)) {
      this.errors.push(this._makeError(
        'Le mot-clé FIN est obligatoire pour terminer le programme',
        this._current(),
        { hint: 'Ajoutez "FIN" à la fin du programme.' }
      ));
    } else {
      this._advance(); // consommer FIN
    }
    this._skipSemicolons();

    return new ProgramNode(name, declarations, body, algoToken);
  }

  /** Consomme les tokens résiduels après FIN et signale les erreurs. */
  _consumeTrailingTokens() {
    this._skipSemicolons();
    if (!this._isAtEnd()) {
      const tok = this._current();
      this.errors.push(this._makeError(
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
    const expectedNameCol = algoCol + 10; // 'ALGORITHME' fait exactement 10 caractères

    // ── 1. Vérification de la présence du nom ────────────────────────────────
    if (!this._check(TokenType.IDENTIFIER)) {
      // Pas d'identifiant du tout : soit ';', soit un mot-clé, soit EOF
      this.errors.push(this._makeError(
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
    // Si name commence à col 12+, il y a un espace ou un caractère intermédiaire.
    //
    if (nameTok.line !== algoLine || nameTok.column !== expectedNameCol) {
      // Déterminer le type de séparateur pour un message précis
      let separatorDesc = 'caractère inconnu';

      if (nameTok.line !== algoLine) {
        // Le nom est sur une ligne différente
        separatorDesc = 'saut de ligne';
      } else {
        // Inspecter le caractère source situé juste après "ALGORITHME"
        // Colonnes 1-indexées → index 0-indexé = algoCol - 1
        // Position après ALGORITHME = (algoCol - 1) + 10 = algoCol + 9
        const lineText   = this.sourceLines[algoLine - 1] ?? '';
        const gapChar    = lineText[algoCol + 9]; // char immédiatement après ALGORITHME
        if (gapChar === '_') {
          separatorDesc = 'underscore (_)';
        } else if (gapChar === ' ' || gapChar === '\t') {
          separatorDesc = 'espace';
        }
      }

      this.errors.push(this._makeError(
        `Le nom de l'algorithme doit être collé à ALGORITHME sans ${separatorDesc} (ex: ALGORITHME${name})`,
        algoToken,
        {
          hint: `Retirez le ${separatorDesc} entre ALGORITHME et le nom. Écrivez : ALGORITHME${name};`,
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
      this.errors.push(this._makeError(
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

  // ── Déclarations de variables ─────────────────────────────────────────────────

  /**
   * varBlock → (VARIABLE|VARIABLES) : décl+
   * décl     → nom : type ;
   */
  _parseVarBlock() {
    const keyword = this._advance(); // VARIABLE ou VARIABLES

    // ':' obligatoire après VARIABLES
    if (!this._check(TokenType.COLON)) {
      this.errors.push(this._makeError(
        `Deux-points manquant après ${keyword.value}`,
        this._current(),
        { hint: `Écrivez "${keyword.value}:" suivi des déclarations.` }
      ));
      // Tenter de récupérer
      this._synchronize(TokenType.DEBUT, TokenType.IDENTIFIER);
    } else {
      this._advance(); // consommer ':'
    }
    this._skipSemicolons();

    const decls = [];

    while (this._check(TokenType.IDENTIFIER)) {
      const nameTok = this._advance();
      const name    = nameTok.value;

      // ':' entre nom et type
      if (!this._check(TokenType.COLON)) {
        this.errors.push(this._makeError(
          `Deux-points manquant après le nom de variable '${name}'`,
          this._current(),
          { hint: `Écrivez : ${name} : TYPE;  (ex: ${name} : ENTIER;)` }
        ));
        this._synchronize(TokenType.IDENTIFIER, TokenType.DEBUT);
        continue;
      }
      this._advance(); // consommer ':'

      // Type de la variable
      const varType = this._parseTypeName();
      if (!varType) {
        // L'erreur a déjà été enregistrée dans _parseTypeName
        this._synchronize(TokenType.IDENTIFIER, TokenType.DEBUT);
        continue;
      }

      // ';' obligatoire après chaque déclaration
      this._expectSemicolon(`la déclaration de la variable '${name}'`);
      this._skipSemicolons();

      decls.push(new VarDeclNode([name], varType, nameTok));
    }

    return decls;
  }

  /**
   * Consomme un nom de type et retourne la chaîne normalisée.
   * En cas d'erreur, enregistre et retourne null.
   */
  _parseTypeName() {
    const tok = this._current();
    switch (tok.type) {
      case TokenType.TYPE_ENTIER:    this._advance(); return 'entier';
      case TokenType.TYPE_REEL:      this._advance(); return 'reel';
      case TokenType.TYPE_CHAINE:    this._advance(); return 'chaine';
      case TokenType.TYPE_CARACTERE: this._advance(); return 'caractere';
      case TokenType.TYPE_BOOLEEN:   this._advance(); return 'booleen';
      default:
        this._addError(this._makeError(
          `Type de variable invalide ou manquant : "${tok.value ?? tok.type}"`,
          tok,
          { hint: 'Types valides : ENTIER, REEL, CHAINE DE CARACTERE, CARACTERE, BOOLEEN' }
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
          this._addError(this._makeError(
            'Instruction invalide',
            this._current(),
            { hint: err?.message }
          ));
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
      case TokenType.SI:         return this._parseIf();
      case TokenType.TANTQUE:    return this._parseWhile();
      case TokenType.POUR:       return this._parseFor();
      case TokenType.REPETER:    return this._parseDoWhile();
      case TokenType.ECRIRE:     return this._parsePrint();
      case TokenType.LIRE:       return this._parseInput();

      // Mots-clés de fermeture → gérés par le parent, pas une instruction
      case TokenType.FINSI:
      case TokenType.FINTANTQUE:
      case TokenType.FINPOUR:
      case TokenType.SINON:
      case TokenType.SINON_SI:
      case TokenType.FIN:
      case TokenType.JUSQUA:
      case TokenType.ALORS:
      case TokenType.FAIRE:
        return null;

      // FINSI/FINTANTQUE/FINPOUR orphelins (sans ouverture correspondante)
      default: {
        const err = this._makeError(
          `Instruction ou mot-clé inattendu : "${tok.value ?? tok.type}"`,
          tok,
          { hint: 'Vérifiez l\'orthographe et la structure de votre programme.' }
        );
        this._advance(); // consume the bad token to avoid infinite loop
        throw err;
      }
    }
  }

  // ── Affectation ──────────────────────────────────────────────────────────────

  /** ident <- expr ; */
  _parseAssignment() {
    const nameTok = this._advance(); // IDENTIFIER

    if (!this._check(TokenType.ASSIGN)) {
      this.errors.push(this._makeError(
        `Opérateur d'affectation manquant après '${nameTok.value}'`,
        this._current(),
        { hint: `Utilisez "<-" pour affecter une valeur : ${nameTok.value} <- valeur;` }
      ));
      this._synchronize();
      return null;
    }
    this._advance(); // consommer <-

    const value = this._parseExpression();
    this._expectSemicolon(`l'affectation de '${nameTok.value}'`);

    return new AssignNode(nameTok.value, value, nameTok);
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

    // Condition obligatoire
    if (this._check(TokenType.ALORS)) {
      this.errors.push(this._makeError(
        'Condition manquante après SI',
        this._current(),
        { hint: 'Écrivez : SI <condition> ALORS' }
      ));
    }
    const cond = this._parseExpression();

    // ALORS obligatoire
    if (!this._check(TokenType.ALORS)) {
      this.errors.push(this._makeError(
        'Le mot-clé ALORS est obligatoire après la condition du SI',
        this._current(),
        { hint: 'Écrivez : SI <condition> ALORS' }
      ));
    } else {
      this._advance(); // consommer ALORS
    }
    this._skipSemicolons();

    const thenBlock = this._parseBlock([
      TokenType.SINON_SI, TokenType.SINON, TokenType.FINSI,
    ]);

    // SINON SI clauses
    const elseifClauses = [];
    while (this._check(TokenType.SINON_SI)) {
      this._advance();
      if (this._check(TokenType.ALORS)) {
        this.errors.push(this._makeError(
          'Condition manquante après SINON SI',
          this._current(),
          { hint: 'Écrivez : SINON SI <condition> ALORS' }
        ));
      }
      const elseifCond = this._parseExpression();
      if (!this._check(TokenType.ALORS)) {
        this.errors.push(this._makeError(
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

    // SINON
    let elseBlock = null;
    if (this._check(TokenType.SINON)) {
      this._advance();
      this._skipSemicolons();
      elseBlock = this._parseBlock([TokenType.FINSI]);
    }

    // FINSI obligatoire
    if (!this._check(TokenType.FINSI)) {
      this.errors.push(this._makeError(
        'Le bloc SI doit se terminer par FINSI',
        this._current(),
        { hint: 'Ajoutez "FINSI" pour fermer le bloc SI.' }
      ));
    } else {
      this._advance(); // consommer FINSI
    }
    this._skipSemicolons();

    return new IfNode(cond, thenBlock, elseifClauses, elseBlock, siTok);
  }

  // ── Boucle TANTQUE ───────────────────────────────────────────────────────────

  /** TANTQUE cond FAIRE bloc FINTANTQUE */
  _parseWhile() {
    const tok = this._advance(); // TANTQUE

    if (this._check(TokenType.FAIRE)) {
      this.errors.push(this._makeError(
        'Condition manquante après TANTQUE',
        this._current(),
        { hint: 'Écrivez : TANTQUE <condition> FAIRE' }
      ));
    }
    const cond = this._parseExpression();

    // FAIRE obligatoire
    if (!this._check(TokenType.FAIRE)) {
      this.errors.push(this._makeError(
        'Le mot-clé FAIRE est obligatoire dans une boucle TANTQUE',
        this._current(),
        { hint: 'Écrivez : TANTQUE <condition> FAIRE' }
      ));
    } else {
      this._advance();
    }
    this._skipSemicolons();

    const body = this._parseBlock([TokenType.FINTANTQUE]);

    // FINTANTQUE obligatoire
    if (!this._check(TokenType.FINTANTQUE)) {
      this.errors.push(this._makeError(
        'La boucle TANTQUE doit se terminer par FINTANTQUE',
        this._current(),
        { hint: 'Ajoutez "FINTANTQUE" pour fermer la boucle.' }
      ));
    } else {
      this._advance();
    }
    this._skipSemicolons();

    return new WhileNode(cond, body, tok);
  }

  // ── Boucle POUR ──────────────────────────────────────────────────────────────

  /** POUR ident DE expr A expr PAS expr bloc FINPOUR */
  _parseFor() {
    const tok = this._advance(); // POUR

    // Variable de boucle
    if (!this._check(TokenType.IDENTIFIER)) {
      this.errors.push(this._makeError(
        'Variable de boucle manquante après POUR',
        this._current(),
        { hint: 'Écrivez : POUR i DE 1 A 10 PAS 1' }
      ));
      this._synchronize(TokenType.FINPOUR, TokenType.FIN);
      return new ForNode('i', new NumberNode(1, tok), new NumberNode(1, tok), new NumberNode(1, tok), new BlockNode([]), tok);
    }
    const varTok = this._advance();

    // DE obligatoire
    if (!this._check(TokenType.DE)) {
      this.errors.push(this._makeError(
        'Le mot-clé DE est obligatoire dans une boucle POUR',
        this._current(),
        { hint: `Écrivez : POUR ${varTok.value} DE <début> A <fin> PAS <pas>` }
      ));
    } else {
      this._advance();
    }

    // Borne de départ
    if (this._check(TokenType.A) || this._check(TokenType.PAS) || this._check(TokenType.FINPOUR)) {
      this.errors.push(this._makeError(
        'Borne de départ manquante dans la boucle POUR',
        this._current(),
        { hint: 'Précisez la valeur de début après DE.' }
      ));
    }
    const from = this._parseExpression();

    // A obligatoire
    if (!this._check(TokenType.A)) {
      this.errors.push(this._makeError(
        'Le mot-clé A est obligatoire dans la boucle POUR',
        this._current(),
        { hint: `Écrivez : POUR ${varTok.value} DE <début> A <fin> PAS <pas>` }
      ));
    } else {
      this._advance();
    }

    // Borne de fin
    if (this._check(TokenType.PAS) || this._check(TokenType.FINPOUR)) {
      this.errors.push(this._makeError(
        'Borne de fin manquante dans la boucle POUR',
        this._current(),
        { hint: 'Précisez la valeur de fin après A.' }
      ));
    }
    const to = this._parseExpression();

    // PAS obligatoire
    if (!this._check(TokenType.PAS)) {
      this.errors.push(this._makeError(
        'Le mot-clé PAS est obligatoire dans la boucle POUR',
        this._current(),
        { hint: `Écrivez : POUR ${varTok.value} DE <début> A <fin> PAS 1` }
      ));
    } else {
      this._advance();
    }

    // Valeur du pas
    if (this._check(TokenType.FINPOUR) || this._isAtEnd()) {
      this.errors.push(this._makeError(
        'Valeur du pas manquante dans la boucle POUR',
        this._current(),
        { hint: 'Précisez la valeur du pas après PAS (ex: PAS 1).' }
      ));
    }
    const step = this._parseExpression();
    this._skipSemicolons();

    const body = this._parseBlock([TokenType.FINPOUR]);

    // FINPOUR obligatoire
    if (!this._check(TokenType.FINPOUR)) {
      this.errors.push(this._makeError(
        'La boucle POUR doit se terminer par FINPOUR',
        this._current(),
        { hint: 'Ajoutez "FINPOUR" pour fermer la boucle.' }
      ));
    } else {
      this._advance();
    }
    this._skipSemicolons();

    return new ForNode(varTok.value, from, to, step, body, tok);
  }

  // ── Boucle REPETER ───────────────────────────────────────────────────────────

  /** REPETER bloc JUSQUA cond ; */
  _parseDoWhile() {
    const tok = this._advance(); // REPETER
    this._skipSemicolons();

    const body = this._parseBlock([TokenType.JUSQUA]);

    // JUSQUA obligatoire
    if (!this._check(TokenType.JUSQUA)) {
      this.errors.push(this._makeError(
        'Le bloc REPETER doit se terminer par JUSQUA suivi d\'une condition',
        this._current(),
        { hint: 'Ajoutez "JUSQUA <condition>" pour fermer le bloc REPETER.' }
      ));
      return new DoWhileNode(body, new BooleanNode(true, tok), tok);
    }
    this._advance(); // consommer JUSQUA

    // Condition obligatoire après JUSQUA
    if (
      this._isAtEnd() ||
      this._check(TokenType.SEMICOLON) ||
      this._check(TokenType.FIN)
    ) {
      this.errors.push(this._makeError(
        'Condition manquante après JUSQUA',
        this._current(),
        { hint: 'Écrivez : JUSQUA <condition>' }
      ));
      this._skipSemicolons();
      return new DoWhileNode(body, new BooleanNode(true, tok), tok);
    }

    // Condition — avec ou sans parenthèses
    let cond;
    if (this._check(TokenType.LPAREN)) {
      this._advance();
      cond = this._parseExpression();
      if (!this._check(TokenType.RPAREN)) {
        this.errors.push(this._makeError(
          'Parenthèse fermante manquante après la condition de JUSQUA',
          this._current(),
          { hint: 'Ajoutez ")" pour fermer la condition.' }
        ));
      } else {
        this._advance();
      }
    } else {
      cond = this._parseExpression();
    }
    this._skipSemicolons();

    return new DoWhileNode(body, cond, tok);
  }

  // ── Entrée / Sortie ──────────────────────────────────────────────────────────

  /** ECRIRE ( expr, expr, … ) ; */
  _parsePrint() {
    const tok = this._advance(); // ECRIRE

    if (!this._check(TokenType.LPAREN)) {
      this.errors.push(this._makeError(
        'Parenthèse ouvrante manquante après ECRIRE',
        this._current(),
        { hint: 'Écrivez : ECRIRE(expression);' }
      ));
      this._synchronize();
      return new PrintNode([], tok);
    }
    this._advance(); // consommer '('

    const args = [];
    if (!this._check(TokenType.RPAREN)) {
      args.push(this._parseExpression());
      while (this._match(TokenType.COMMA)) {
        if (this._check(TokenType.RPAREN)) {
          this.errors.push(this._makeError(
            'Virgule mal placée dans ECRIRE : expression manquante après la virgule',
            this._current(),
            { hint: 'Supprimez la virgule finale ou ajoutez une expression.' }
          ));
          break;
        }
        args.push(this._parseExpression());
      }
    }

    if (!this._check(TokenType.RPAREN)) {
      this.errors.push(this._makeError(
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

  /** LIRE ( ident ) ; */
  _parseInput() {
    const tok = this._advance(); // LIRE

    if (!this._check(TokenType.LPAREN)) {
      this.errors.push(this._makeError(
        'Parenthèse ouvrante manquante après LIRE',
        this._current(),
        { hint: 'Écrivez : LIRE(nom_variable);' }
      ));
      this._synchronize();
      return new InputNode('?', tok);
    }
    this._advance(); // consommer '('

    if (!this._check(TokenType.IDENTIFIER)) {
      this.errors.push(this._makeError(
        'Nom de variable manquant dans LIRE',
        this._current(),
        { hint: 'LIRE attend le nom d\'une variable : LIRE(maVariable);' }
      ));
      this._synchronize();
      return new InputNode('?', tok);
    }
    const varTok = this._advance();

    if (!this._check(TokenType.RPAREN)) {
      this.errors.push(this._makeError(
        'Parenthèse fermante manquante dans LIRE',
        this._current(),
        { hint: 'Ajoutez ")" pour fermer l\'appel LIRE.' }
      ));
    } else {
      this._advance(); // consommer ')'
    }

    this._expectSemicolon('LIRE(...)');
    return new InputNode(varTok.value, tok);
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
    if (this._check(TokenType.IDENTIFIER)) {
      this._advance();
      return new IdentifierNode(tok.value, tok);
    }
    if (this._check(TokenType.LPAREN)) {
      this._advance();
      const expr = this._parseExpression();
      if (!this._check(TokenType.RPAREN)) {
        this.errors.push(this._makeError(
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
