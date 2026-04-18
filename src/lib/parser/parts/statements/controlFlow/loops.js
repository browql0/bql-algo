import TokenType from '../../../../lexer/tokenTypes.js';
import {
  ProgramNode, BlockNode, VarDeclNode, ArrayDeclNode, ConstDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  ArrayAccessNode, MemberAccessNode, BinaryOpNode, UnaryOpNode,
  TypeDeclarationNode, RecordFieldNode,
  AssignNode, ArrayAssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode, SwitchNode, CaseNode, ArrayAllocationNode
} from '../../../AST/nodes.js';

const loopStatementMethods = {
  _parseWhile() {
    const tok = this._advance(); // TANTQUE

    // Parenthèses optionnelles (spec BQL)
    const hasParen = this._match(TokenType.LPAREN);

    let cond = null;
    // Condition obligatoire
    if (this._check(TokenType.FAIRE) || (hasParen && this._check(TokenType.RPAREN))) {
      this._addError(this._makeError(
        'Condition manquante dans la boucle TANTQUE',
        this._current(),
        { hint: 'Écrivez la condition : TANTQUE condition FAIRE  ou  TANTQUE (condition) FAIRE' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    if (hasParen) {
      // Parenthèse fermante requise si ouverte
      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante après la condition du TANTQUE',
          this._current(),
          { hint: 'Ajoutez ")" après la condition.' }
        ));
      } else {
        this._advance(); // consommer ')'
      }
    }

    // FAIRE obligatoire
    if (!this._check(TokenType.FAIRE)) {
      this._addError(this._makeError(
        'Le mot-clé FAIRE est obligatoire après la condition du TANTQUE',
        this._current(),
        { hint: 'Écrivez : TANTQUE condition FAIRE  ou  TANTQUE (condition) FAIRE' }
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
  },

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
    let to = new NumberNode(0, this._current()); // valeur par défaut en cas d'erreur
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
      // Ne pas lire l'expression : le token courant est PAS/FAIRE/FINPOUR
    } else {
      to = this._parseExpression();
    }

    // ── 6. PAS (optionnel) ───────────────────────────────────────────────────
    //   • Absent    → step = null (pas implicite = 1 à l'exécution)
    //   • PAS 0     → ERREUR : interdit (boucle infinie)
    //   • PAS n≠0   → valide (PAS 1 explicite est accepté mais redondant)
    let step = null; // null = PAS absent = pas implicite 1 à l'exécution

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
          } else {
            // PAS valide (PAS 1 explicite est redondant mais accepté)
            step = stepExpr;
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
  },

  _parseDoWhile() {
    const tok = this._advance(); // REPETER
    this._skipSemicolons();

    const body = this._parseBlock([TokenType.JUSQUA]);

    // JUSQUA obligatoire
    if (!this._check(TokenType.JUSQUA)) {
      this._addError(this._makeError(
        'Le bloc REPETER doit se terminer par JUSQUA suivi d\'une condition',
        this._current(),
        { hint: 'Ajoutez "JUSQUA condition" pour fermer le bloc REPETER.' }
      ));
      return new DoWhileNode(body, new BooleanNode(true, tok), tok);
    }
    this._advance(); // consommer JUSQUA

    // Parenthèses optionnelles (spec BQL)
    const hasParen = this._match(TokenType.LPAREN);

    let cond = null;
    // Condition obligatoire
    if (
      (hasParen && this._check(TokenType.RPAREN)) ||
      this._check(TokenType.SEMICOLON) ||
      this._check(TokenType.FIN) ||
      this._isAtEnd()
    ) {
      this._addError(this._makeError(
        'Condition manquante dans la boucle REPETER',
        this._current(),
        { hint: 'Écrivez la condition : JUSQUA condition  ou  JUSQUA (condition)' }
      ));
      cond = new BooleanNode(true, this._current());
    } else {
      cond = this._parseExpression();
    }

    if (hasParen) {
      // Parenthèse fermante requise si ouverte
      if (!this._check(TokenType.RPAREN)) {
        this._addError(this._makeError(
          'Parenthèse fermante manquante après la condition du JUSQUA',
          this._current(),
          { hint: 'Ajoutez ")" après la condition.' }
        ));
      } else {
        this._advance(); // consommer ')'
      }
    }
    this._skipSemicolons();

    return new DoWhileNode(body, cond, tok);
  }
};

export default loopStatementMethods;
