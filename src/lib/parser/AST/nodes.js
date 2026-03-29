/**
 * nodes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Toutes les classes de nœuds de l'AST (Abstract Syntax Tree).
 *
 * Chaque classe est un simple conteneur de données avec :
 *   - un champ `type` (string constant) pour le dispatch dans l'interpréteur
 *   - les champs propres au nœud
 *   - line / column pour les messages d'erreur
 *
 * Convention : NodeType.XXX_NODE correspond à la classe XxxNode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Enum des types de nœuds ────────────────────────────────────────────────────
export const NodeType = Object.freeze({
  PROGRAM:     'PROGRAM',
  BLOCK:       'BLOCK',
  VAR_DECL:    'VAR_DECL',

  // Littéraux
  NUMBER:      'NUMBER',
  STRING:      'STRING',
  CHAR:        'CHAR',
  BOOLEAN:     'BOOLEAN',

  // Références
  IDENTIFIER:  'IDENTIFIER',

  // Opérations
  BINARY_OP:   'BINARY_OP',
  UNARY_OP:    'UNARY_OP',

  // Instructions
  ASSIGN:      'ASSIGN',
  IF:          'IF',
  WHILE:       'WHILE',
  FOR:         'FOR',
  DO_WHILE:    'DO_WHILE',
  PRINT:       'PRINT',
  INPUT:       'INPUT',
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Positionne facilement line/column sur un nœud depuis un token. */
function pos(token) {
  return { line: token?.line ?? 0, column: token?.column ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nœuds de structure
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Racine du programme.
 * ALGORITHME nom ; VARIABLE(S): ... DEBUT ... FIN
 */
export class ProgramNode {
  /**
   * @param {string}      name         - Nom de l'algorithme
   * @param {VarDeclNode[]} declarations - Déclarations de variables
   * @param {BlockNode}   body         - Corps DEBUT…FIN
   * @param {object}      token        - Token ALGORITHME (pour position)
   */
  constructor(name, declarations, body, token) {
    this.type         = NodeType.PROGRAM;
    this.name         = name;
    this.declarations = declarations;
    this.body         = body;
    this.line         = token?.line   ?? 0;
    this.column       = token?.column ?? 0;
  }
}

/**
 * Bloc d'instructions (entre DEBUT/FIN, ALORS/FINSI, FAIRE/FINTANTQUE…).
 */
export class BlockNode {
  /** @param {Array} statements - Liste de nœuds d'instruction */
  constructor(statements) {
    this.type       = NodeType.BLOCK;
    this.statements = statements;
  }
}

/**
 * Déclaration de variables.
 * VARIABLE:  age : entier;
 * VARIABLES: age : entier; nom : chaine;
 */
export class VarDeclNode {
  /**
   * @param {string[]} names   - Noms des variables déclarées
   * @param {string}   varType - Type ('entier','reel','chaine','caractere','booleen')
   * @param {object}   token   - Token pour position
   */
  constructor(names, varType, token) {
    this.type    = NodeType.VAR_DECL;
    this.names   = names;
    this.varType = varType;
    Object.assign(this, pos(token));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nœuds littéraux
// ═══════════════════════════════════════════════════════════════════════════════

/** Nombre entier ou réel. ex: 42, 3.14 */
export class NumberNode {
  constructor(value, token) {
    this.type  = NodeType.NUMBER;
    this.value = value; // number JS
    Object.assign(this, pos(token));
  }
}

/** Chaîne de caractères. ex: "Bonjour" */
export class StringNode {
  constructor(value, token) {
    this.type  = NodeType.STRING;
    this.value = value;
    Object.assign(this, pos(token));
  }
}

/** Caractère simple. ex: 'a' */
export class CharNode {
  constructor(value, token) {
    this.type  = NodeType.CHAR;
    this.value = value;
    Object.assign(this, pos(token));
  }
}

/** Booléen. ex: VRAI, FAUX */
export class BooleanNode {
  constructor(value, token) {
    this.type  = NodeType.BOOLEAN;
    this.value = value; // true | false
    Object.assign(this, pos(token));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nœuds de référence et d'opération
// ═══════════════════════════════════════════════════════════════════════════════

/** Référence à une variable. ex: note, compteur */
export class IdentifierNode {
  constructor(name, token) {
    this.type = NodeType.IDENTIFIER;
    this.name = name;
    Object.assign(this, pos(token));
  }
}

/**
 * Opération binaire.
 * left OP right — ex: a + b, x >= 10, a ET b
 */
export class BinaryOpNode {
  /**
   * @param {*}      left     - Nœud gauche
   * @param {string} operator - Opérateur (+, -, *, /, %, ^, =, !=, <, <=, >, >=, ET, OU)
   * @param {*}      right    - Nœud droit
   * @param {object} token    - Token de l'opérateur (pour position)
   */
  constructor(left, operator, right, token) {
    this.type     = NodeType.BINARY_OP;
    this.left     = left;
    this.operator = operator;
    this.right    = right;
    Object.assign(this, pos(token));
  }
}

/**
 * Opération unaire.
 * OP operand — ex: NON condition, - valeur
 */
export class UnaryOpNode {
  constructor(operator, operand, token) {
    this.type     = NodeType.UNARY_OP;
    this.operator = operator;
    this.operand  = operand;
    Object.assign(this, pos(token));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nœuds d'instruction
// ═══════════════════════════════════════════════════════════════════════════════

/** Affectation : name <- value */
export class AssignNode {
  constructor(name, value, token) {
    this.type  = NodeType.ASSIGN;
    this.name  = name;  // string (nom de variable)
    this.value = value; // nœud expression
    Object.assign(this, pos(token));
  }
}

/**
 * Condition : SI … ALORS … (SINON SI … ALORS …)* (SINON …)? FINSI
 */
export class IfNode {
  /**
   * @param {*}           condition     - Nœud condition principale
   * @param {BlockNode}   thenBlock     - Bloc ALORS
   * @param {Array}       elseifClauses - [{ condition, block }]
   * @param {BlockNode|null} elseBlock  - Bloc SINON (ou null)
   * @param {object}      token
   */
  constructor(condition, thenBlock, elseifClauses, elseBlock, token) {
    this.type          = NodeType.IF;
    this.condition     = condition;
    this.thenBlock     = thenBlock;
    this.elseifClauses = elseifClauses;
    this.elseBlock     = elseBlock;
    Object.assign(this, pos(token));
  }
}

/** Boucle TANTQUE condition FAIRE … FINTANTQUE */
export class WhileNode {
  constructor(condition, body, token) {
    this.type      = NodeType.WHILE;
    this.condition = condition;
    this.body      = body;
    Object.assign(this, pos(token));
  }
}

/**
 * Boucle POUR variable DE from A to PAS step … FINPOUR
 */
export class ForNode {
  /**
   * @param {string}  variable - Nom de la variable de contrôle
   * @param {*}       from     - Nœud valeur de départ
   * @param {*}       to       - Nœud valeur de fin
   * @param {*}       step     - Nœud pas (NumberNode(1) par défaut)
   * @param {BlockNode} body
   * @param {object}  token
   */
  constructor(variable, from, to, step, body, token) {
    this.type     = NodeType.FOR;
    this.variable = variable;
    this.from     = from;
    this.to       = to;
    this.step     = step;
    this.body     = body;
    Object.assign(this, pos(token));
  }
}

/** Boucle REPETER … JUSQUA (condition) */
export class DoWhileNode {
  constructor(body, condition, token) {
    this.type      = NodeType.DO_WHILE;
    this.body      = body;
    this.condition = condition;
    Object.assign(this, pos(token));
  }
}

/** Instruction ECRIRE(arg1, arg2, …) */
export class PrintNode {
  /** @param {Array} args - Nœuds d'expressions à afficher */
  constructor(args, token) {
    this.type = NodeType.PRINT;
    this.args = args;
    Object.assign(this, pos(token));
  }
}

/** Instruction LIRE(variable) */
export class InputNode {
  constructor(variable, token) {
    this.type     = NodeType.INPUT;
    this.variable = variable; // string (nom de la variable)
    Object.assign(this, pos(token));
  }
}
