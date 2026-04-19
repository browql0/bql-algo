/**
 * Parser.js
 * -----------------------------------------------------------------------------
 * Parser récursif descendant STRICT pour le pseudo-langage algorithmique
 * marocain, avec collecte de plusieurs erreurs et récupération après erreur.
 *
 * Entrée  : Token[]       (produits par Lexer.js)
 * Sortie  : { ast: ProgramNode | null, errors: AlgoSyntaxError[] }
 *
 * Précédence des opérateurs (du plus faible au plus fort) :
 *   OU  ?  ET  ?  NON  ?  Comparaison  ?  +/-  ?  /%  ?  ^  ?  Unaire  ?  Primaire
 *
 * Structure stricte imposée :
 *   ALGORITHMENom;       ? valide (collé)
 *   ALGORITHME_Nom;      ? valide (underscore séparateur)
 *   ALGORITHME Nom;      ? INVALIDE (espace interdit)
 *   VARIABLE  nom : type ;    (exactement 1 symbole)
 *   VARIABLES nom : type ;    (2+ symboles)
 *   DEBUT
 *
 *     instructions
 *   FIN
 *
 * Règles de validation :
 *  - Présence ALGORITHME + nom collé (séparateur : rien ou underscore) + ;
 *  - Bloc VARIABLE(S) optionnel mais strictement valid? si présent
 *    (le ':' après VARIABLE/VARIABLES est INTERDIT)
 *  - DEBUT obligatoire avant le corps
 *  - FIN obligatoire en fin de programme
 *  - ; obligatoire uniquement après déclarations, affectations, ECRIRE et LIRE
 *  - ; interdit/inutile après DEBUT, FIN et fermetures de blocs (FINSI, FINPOUR, ...)
 *  - Stack de blocs pour valider SI/FINSI, TANTQUE/FINTANTQUE, POUR/FINPOUR, REPETER/JUSQUA
 *  - Détection d'instructions hors bloc principal
 * -----------------------------------------------------------------------------
 */

import TokenType from '../lexer/tokenTypes.js';
import AlgoSyntaxError from '../errors/SyntaxError.js';
import programMethods from './parts/program.js';
import declarationMethods from './parts/declarations.js';
import statementMethods from './parts/statements.js';
import expressionMethods from './parts/expressions.js';

// -- Parser --------------------------------------------------------------------
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
     * Au-delà , le parser s'arrête pour éviter un flood d'erreurs en cascade.
     */
    this.MAX_ERRORS = 20;

    /**
     * Clés des erreurs déjà enregistrées (ligne:colonne:message).
     * Permet d'éviter les doublons exacts.
     * @type {Set<string>}
     */
    this._errorKeys = new Set();
  }

  // -- API publique -------------------------------------------------------------

  /**
   * Point d'entrée principal.
   * Ne lève JAMAIS d'exception ? collecte toutes les erreurs.
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

  // -- Helpers de navigation ----------------------------------------------------

  _current()             { return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]; }
  _peek(offset = 1)      { return this.tokens[this.pos + offset] ?? this.tokens[this.tokens.length - 1]; }
  _isAtEnd()             { return this._current().type === TokenType.EOF; }
  _check(type)           { return this._current().type === type; }
  _isSoftKeyword(word)   { return this._check(TokenType.IDENTIFIER) && this._current().value.toUpperCase() === word; }

  /**
   * Retourne le dernier token CONSOMMÉ (position pos - 1).
   * Utilis? pour pointer à la fin d'un token lors des erreurs "manquant".
   * @returns {import('../lexer/Token.js').default|null}
   */
  _previousToken() {
    return this.pos > 0 ?this.tokens[this.pos - 1] : null;
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

  // -- Helpers de ponctuation ---------------------------------------------------

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
    // Pointer à la fin du dernier token consomm? (pas au début du suivant)
    const prev    = this._previousToken();
    const prevVal = String(prev?.value ?? '');
    const errLine = prev?.line ?? this._current().line;
    const errCol  = prev
      ?(prev.column + prevVal.length)   // juste après le dernier token
      : this._current().column;

    this._addError(this._makeError(
      `Point-virgule manquant après ${afterWhat}`,
      { line: errLine, column: 0, value: ';' },
      { hint: `Ajoutez ';' à la fin.`, columnOverride: errCol }
    ));
    return false;
  }

  // -- Fabrique et accumulation d'erreurs --------------------------------------

  /**
   * Enregistre une erreur dans la liste, en appliquant :
   *  1. La limite MAX_ERRORS (flood protection)
   *  2. La déduplication (même ligne + même colonne + même message = doublon)
   *
   * @param {AlgoSyntaxError} error
   * @returns {boolean} true si l'erreur a été ajoutée, false si rejetée
   */
  _addError(error) {
    // -- Flood protection : arrêt à MAX_ERRORS --------------------------------
    if (this.errors.length >= this.MAX_ERRORS) {
      // Ajouter un avertissement unique de saturation si pas déjà présent
      const satKey = 'SATURATED';
      if (!this._errorKeys.has(satKey)) {
        this._errorKeys.add(satKey);
        this.errors.push(this._makeError(
          `Limite de ${this.MAX_ERRORS} erreurs atteinte ? analyse stoppée`,
          this._current(),
          { hint: 'Corrigez les erreurs signalées avant de continuer.' }
        ));
      }
      return false;
    }

    // -- Déduplication (ligne:colonne:message) ---------------------------------
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
      ?`${message} ? Attendu : "${expected}"`
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
   * Exige un token d'un type donn?.
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
   * Exige un token d'un type donn?.
   * Si absent : lève une exception (erreur non récupérable = arrêt du parsing).
   * Utilis? UNIQUEMENT quand ALGORITHME est absent (premier token du fichier).
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

  // -- Récupération d'erreur ----------------------------------------------------

  /**
   * Avance jusqu'au prochain point de synchronisation :
   *   - prochain SEMICOLON (consomm?)
   *   - ou prochain mot-clé de structure stable
   *
   * C'est le cÅ“ur de la stratégie de récupération (error recovery).
   * Après chaque erreur, on synchronise pour continuer l'analyse
   * sans génèrer une cascade d'erreurs parasites.
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

}

Object.assign(
  Parser.prototype,
  programMethods,
  declarationMethods,
  statementMethods,
  expressionMethods,
);

export default Parser;

