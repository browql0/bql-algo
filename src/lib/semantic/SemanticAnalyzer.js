/**
 * SemanticAnalyzer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyseur sémantique pour le pseudo-langage algorithmique marocain.
 *
 * Entrée  : ProgramNode (racine de l'AST produit par Parser.js)
 * Sortie  : { errors: AlgoSemanticError[] }
 *
 * Vérifications effectuées :
 *  1. Toutes les variables utilisées ont été déclarées
 *  2. Aucune variable n'est redéclarée dans le même scope
 *  3. Compatibilité de types dans les affectations
 *  4. Variable de boucle POUR référencée dans le corps
 *  5. Variable lue avant toute initialisation (best-effort)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AlgoSemanticError from '../errors/SemanticError.js';
import { NodeType }      from '../parser/AST/nodes.js';

// ── Compatibilité de types ────────────────────────────────────────────────────
// type_cible → types_source_acceptés (valeurs littérales de nœuds)
const TYPE_COMPAT = {
  entier:    ['entier', 'reel'],
  reel:      ['entier', 'reel'],
  chaine:    ['chaine', 'caractere'],
  caractere: ['caractere', 'chaine'],
  booleen:   ['booleen'],
};

// ── Inférence de type à partir d'un nœud littéral ────────────────────────────
function inferNodeType(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return Number.isInteger(node.value) ? 'entier' : 'reel';
    case NodeType.STRING:    return 'chaine';
    case NodeType.CHAR:      return 'caractere';
    case NodeType.BOOLEAN:   return 'booleen';
    default:                 return null; // inconnu (expression composite)
  }
}

// ── Classe principale ─────────────────────────────────────────────────────────
class SemanticAnalyzer {
  /**
   * @param {string} sourceCode - Code source brut (pour enrichir les erreurs)
   */
  constructor(sourceCode = '') {
    this.sourceCode = sourceCode;
    this.sourceLines = sourceCode.split('\n');

    /** @type {AlgoSemanticError[]} */
    this.errors = [];

    /**
     * Table des symboles : Map<name, { type, line, initialized }>
     */
    this.symbols = new Map();
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  /**
   * Lance l'analyse sémantique de l'AST.
   * @param {import('../parser/AST/nodes.js').ProgramNode} ast
   * @returns {{ errors: AlgoSemanticError[], symbols: Map }}
   */
  analyze(ast) {
    if (!ast) return { errors: this.errors, symbols: this.symbols };

    // 1. Enregistrer toutes les déclarations de variables
    this._processDeclarations(ast.declarations);

    // 2. Analyser le corps du programme
    if (ast.body) {
      this._analyzeBlock(ast.body);
    }

    return { errors: this.errors, symbols: this.symbols };
  }

  // ── Traitement des déclarations ───────────────────────────────────────────────

  _processDeclarations(declarations) {
    for (const decl of declarations) {
      for (const name of decl.names) {
        if (this.symbols.has(name)) {
          this._addError({
            message: `La variable '${name}' est déjà déclarée`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ne peut être déclarée qu'une seule fois dans le bloc VARIABLES.`,
          });
        } else {
          this.symbols.set(name, {
            type: decl.varType,
            line: decl.line,
            initialized: false, // sera mis à true lors de l'affectation
          });
        }
      }
    }
  }

  // ── Analyse d'un bloc d'instructions ─────────────────────────────────────────

  _analyzeBlock(block) {
    if (!block || !block.statements) return;
    for (const stmt of block.statements) {
      this._analyzeStatement(stmt);
    }
  }

  // ── Analyse d'une instruction ─────────────────────────────────────────────────

  _analyzeStatement(node) {
    if (!node) return;
    switch (node.type) {
      case NodeType.ASSIGN:    return this._analyzeAssign(node);
      case NodeType.IF:        return this._analyzeIf(node);
      case NodeType.WHILE:     return this._analyzeWhile(node);
      case NodeType.FOR:       return this._analyzeFor(node);
      case NodeType.DO_WHILE:  return this._analyzeDoWhile(node);
      case NodeType.PRINT:     return this._analyzePrint(node);
      case NodeType.INPUT:     return this._analyzeInput(node);
      case NodeType.VAR_DECL:  return this._processDeclarations([node]);
      default: break;
    }
  }

  // ── Affectation ───────────────────────────────────────────────────────────────

  _analyzeAssign(node) {
    const name = node.name;
    const entry = this.symbols.get(name);

    if (!entry) {
      this._addError({
        message: `La variable '${name}' n'est pas déclarée`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT : ${name} : ENTIER;`,
      });
    } else {
      // Vérification de compatibilité de type (si on peut inférer)
      const inferredType = this._inferExprType(node.value);
      if (inferredType && !this._isTypeCompatible(entry.type, inferredType)) {
        this._addError({
          message: `Type incompatible : impossible d'affecter une valeur de type ${inferredType.toUpperCase()} à la variable '${name}' déclarée comme ${entry.type.toUpperCase()}`,
          line: node.line,
          column: node.column,
          value: name,
          hint: `La variable '${name}' est de type ${entry.type.toUpperCase()}. Vérifiez que l'expression est du bon type.`,
        });
      }
      // Marquer comme initialisée
      entry.initialized = true;
    }

    // Analyser l'expression de droite pour détecter les variables non déclarées
    this._analyzeExpr(node.value);
  }

  // ── Condition SI ──────────────────────────────────────────────────────────────

  _analyzeIf(node) {
    this._analyzeExpr(node.condition);
    this._analyzeBlock(node.thenBlock);
    for (const clause of (node.elseifClauses ?? [])) {
      this._analyzeExpr(clause.condition);
      this._analyzeBlock(clause.block);
    }
    if (node.elseBlock) {
      this._analyzeBlock(node.elseBlock);
    }
  }

  // ── Boucle TANTQUE ────────────────────────────────────────────────────────────

  _analyzeWhile(node) {
    this._analyzeExpr(node.condition);
    this._analyzeBlock(node.body);
  }

  // ── Boucle POUR ───────────────────────────────────────────────────────────────

  _analyzeFor(node) {
    const varName = node.variable;

    // La variable de boucle doit être déclarée (ou sera créée implicitement)
    if (!this.symbols.has(varName)) {
      this._addError({
        message: `La variable de boucle '${varName}' n'est pas déclarée`,
        line: node.line,
        column: node.column,
        value: varName,
        hint: `Déclarez '${varName}' dans le bloc VARIABLES : ${varName} : ENTIER;`,
      });
    } else {
      // Marquer comme initialisée (la boucle POUR l'initialise)
      this.symbols.get(varName).initialized = true;
    }

    this._analyzeExpr(node.from);
    this._analyzeExpr(node.to);
    this._analyzeExpr(node.step);
    this._analyzeBlock(node.body);
  }

  // ── Boucle REPETER ────────────────────────────────────────────────────────────

  _analyzeDoWhile(node) {
    this._analyzeBlock(node.body);
    this._analyzeExpr(node.condition);
  }

  // ── ECRIRE ────────────────────────────────────────────────────────────────────

  _analyzePrint(node) {
    for (const arg of (node.args ?? [])) {
      this._analyzeExpr(arg);
    }
  }

  // ── LIRE ──────────────────────────────────────────────────────────────────────

  _analyzeInput(node) {
    const name = node.variable;
    if (!this.symbols.has(name)) {
      this._addError({
        message: `La variable '${name}' n'est pas déclarée`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT.`,
      });
    } else {
      // LIRE initialise la variable
      this.symbols.get(name).initialized = true;
    }
  }

  // ── Analyse des expressions ───────────────────────────────────────────────────

  _analyzeExpr(node) {
    if (!node) return;

    switch (node.type) {
      case NodeType.IDENTIFIER: {
        const name = node.name;
        if (!this.symbols.has(name)) {
          this._addError({
            message: `La variable '${name}' n'est pas déclarée`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT : ${name} : ENTIER;`,
          });
        } else if (!this.symbols.get(name).initialized) {
          this._addError({
            message: `La variable '${name}' est utilisée avant d'avoir reçu une valeur`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Initialisez '${name}' avec une affectation ou LIRE avant de l'utiliser.`,
          });
        }
        break;
      }

      case NodeType.BINARY_OP:
        this._analyzeExpr(node.left);
        this._analyzeExpr(node.right);
        break;

      case NodeType.UNARY_OP:
        this._analyzeExpr(node.operand);
        break;

      // Littéraux → ok, pas de vérification nécessaire
      case NodeType.NUMBER:
      case NodeType.STRING:
      case NodeType.CHAR:
      case NodeType.BOOLEAN:
        break;

      default:
        break;
    }
  }

  // ── Inférence de type d'une expression ───────────────────────────────────────

  /**
   * Tente d'inférer le type d'un nœud expression.
   * Retourne null si l'inférence est impossible (expression composée).
   * @param {object} node
   * @returns {string|null}
   */
  _inferExprType(node) {
    if (!node) return null;

    switch (node.type) {
      case NodeType.NUMBER:
        return Number.isInteger(node.value) ? 'entier' : 'reel';
      case NodeType.STRING:
        return 'chaine';
      case NodeType.CHAR:
        return 'caractere';
      case NodeType.BOOLEAN:
        return 'booleen';
      case NodeType.IDENTIFIER: {
        const entry = this.symbols.get(node.name);
        return entry ? entry.type : null;
      }
      case NodeType.UNARY_OP:
        if (node.operator === 'NON') return 'booleen';
        if (node.operator === '-') return this._inferExprType(node.operand);
        return null;
      case NodeType.BINARY_OP: {
        const { operator } = node;
        // Opérateurs logiques → booleen
        if (['ET', 'OU'].includes(operator)) return 'booleen';
        // Opérateurs de comparaison → booleen
        if (['=', '!=', '<', '<=', '>', '>='].includes(operator)) return 'booleen';
        // Arithmétique → numérique (on ne peut pas distinguer entier/reel sans évaluation)
        if (['+', '-', '*', '/', '%', '^'].includes(operator)) {
          const leftType  = this._inferExprType(node.left);
          const rightType = this._inferExprType(node.right);
          // Concaténation de chaînes avec +
          if (leftType === 'chaine' || rightType === 'chaine') return 'chaine';
          if (leftType === 'reel'   || rightType === 'reel')   return 'reel';
          return 'entier';
        }
        return null;
      }
      default:
        return null;
    }
  }

  // ── Vérification de compatibilité de types ────────────────────────────────────

  /**
   * Vérifie si un type source est accepté pour une variable cible.
   * @param {string} targetType - Type de la variable déclarée
   * @param {string} sourceType - Type inféré de l'expression
   * @returns {boolean}
   */
  _isTypeCompatible(targetType, sourceType) {
    const accepted = TYPE_COMPAT[targetType];
    return accepted ? accepted.includes(sourceType) : true;
  }

  // ── Gestion des erreurs ───────────────────────────────────────────────────────

  _addError({ message, line, column = 0, value = null, hint = null }) {
    const codeLine = (line > 0 && line <= this.sourceLines.length)
      ? this.sourceLines[line - 1]
      : null;

    this.errors.push(new AlgoSemanticError({
      message,
      line,
      column,
      value,
      hint,
      codeLine,
    }));
  }
}

export default SemanticAnalyzer;
