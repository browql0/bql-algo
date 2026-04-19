/**
 * nodes.js
 * -----------------------------------------------------------------------------
 * Toutes les classes de nœuds de l'AST (Abstract Syntax Tree).
 *
 * Chaque classe est un simple conteneur de données avec :
 *   - un champ `type` (string constant) pour le dispatch dans l'interprêteur
 *   - les champs propres au nœud
 *   - line / column pour les messages d'erreur
 *
 * Convention : NodeType.XXX_NODE correspond à la classe XxxNode.
 * -----------------------------------------------------------------------------
 */

// -- Enum des types de nœuds ----------------------------------------------------
export const NodeType = Object.freeze({
  PROGRAM:     'PROGRAM',
  BLOCK:       'BLOCK',
  VAR_DECL:    'VAR_DECL',
  ARRAY_DECL:  'ARRAY_DECL',
  ARRAY_ALLOCATION: 'ARRAY_ALLOCATION',
  CONST_DECL:  'CONST_DECL',
  TYPE_DECL:   'TYPE_DECL',
  RECORD_FIELD:'RECORD_FIELD',

  // Littéraux
  NUMBER:      'NUMBER',
  STRING:      'STRING',
  CHAR:        'CHAR',
  BOOLEAN:     'BOOLEAN',

  // Références
  IDENTIFIER:  'IDENTIFIER',
  ARRAY_ACCESS:'ARRAY_ACCESS',
  MEMBER_ACCESS:'MEMBER_ACCESS',

  // Opérations
  BINARY_OP:   'BINARY_OP',
  UNARY_OP:    'UNARY_OP',

  // Instructions
  ASSIGN:      'ASSIGN',
  ARRAY_ASSIGN:'ARRAY_ASSIGN',
  IF:          'IF',
  WHILE:       'WHILE',
  FOR:         'FOR',
  DO_WHILE:    'DO_WHILE',
  PRINT:       'PRINT',
  INPUT:       'INPUT',
  SWITCH:      'SWITCH',
  CASE:        'CASE',
});

// -- Helpers --------------------------------------------------------------------

/** Positionne facilement line/column sur un nœud depuis un token. */
function pos(token) {
  return { line: token?.line ?? 0, column: token?.column ?? 0 };
}

// ===============================================================================
// NÅ“uds de structure
// ===============================================================================

/**
 * Racine du programme.
 *
 * Syntaxe de l'en-tête (formes valides) :
 *   ALGORITHMENom;        ? nom collé directement
 *   ALGORITHME_Nom;       ? underscore comme séparateur
 *   ALGORITHME Nom;       ? INVALIDE (espace interdit)
 *
 * Structure générale :
 *   ALGORITHMENom; CONSTANTE(S) ... VARIABLE(S) ... DEBUT ... FIN
 */
export class ProgramNode {
  /**
   * @param {string}        name         - Nom de l'algorithme
   * @param {ConstDeclNode[]} constants  - Déclarations de constantes
   * @param {TypeDeclarationNode[]} customTypes - Déclarations de types
   * @param {VarDeclNode[]} declarations - Déclarations de variables
   * @param {BlockNode}     body         - Corps DEBUT/FIN
   * @param {object}        token        - Token ALGORITHME (pour position)
   */
  constructor(name, constants, customTypes, declarations, body, token) {
    this.type         = NodeType.PROGRAM;
    this.name         = name;
    this.constants    = constants;
    this.customTypes  = customTypes;
    this.declarations = declarations;
    this.body         = body;
    this.column       = token?.column ?? 0;
  }
}

/**
 * Bloc d'instructions (entre DEBUT/FIN, ALORS/FINSI, FAIRE/FINTANTQUE?).
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
 *
 * Syntaxe officielle BQL :
 *   VARIABLE  age : ENTIER;          ? exactement 1 symbole déclaré
 *   VARIABLES age : ENTIER;          ? 2+ symboles déclarés
 *   VARIABLES age : ENTIER; nom : CHAINE DE CARACTERE;
 *
 * Important : le ':' est INTERDIT immédiatement après VARIABLE ou VARIABLES.
 *   VARIABLE:  ? INVALIDE
 *   VARIABLES: ? INVALIDE
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

export class ArrayDeclNode {
  constructor(name, sizes, varType, token) {
    this.type    = NodeType.ARRAY_DECL;
    this.name    = name;
    this.sizes   = sizes;    // ExpressionNode[] (tailles du tableau, array vide si non-spécifié)
    this.varType = varType;  // string type
    Object.assign(this, pos(token));
  }
}

export class ArrayAllocationNode {
  constructor(name, sizes, token) {
    this.type  = NodeType.ARRAY_ALLOCATION;
    this.name  = name;       // string (nom du tableau)
    this.sizes = sizes;      // ExpressionNode[] (tailles)
    Object.assign(this, pos(token));
  }
}

/**
 * Déclaration d'une constante typée.
 * CONSTANTE(S)
 *   NomConstante = Valeur : TYPE;
 */
export class ConstDeclNode {
  /**
   * @param {string}  name      - Nom de la constante
   * @param {*}       value     - Valeur AST (nœud expression évalué statiquement)
   * @param {string}  constType - Type : 'entier' | 'reel' | 'chaine' | 'booleen'
   * @param {object}  token     - Token de référence (position)
   */
  constructor(name, value, constType, token) {
    this.type      = NodeType.CONST_DECL;
    this.name      = name;
    this.value     = value;
    this.constType = constType;
    Object.assign(this, pos(token));
  }
}

/**
 * Déclaration d'un type structuré (Enregistrement).
 * Type NomType = Enregistrement
 *    champ1 : type1;
 * Fin NomType
 */
export class TypeDeclarationNode {
  constructor(name, fields, token) {
    this.type   = NodeType.TYPE_DECL;
    this.name   = name;
    this.fields = fields; // RecordFieldNode[]
    Object.assign(this, pos(token));
  }
}

export class RecordFieldNode {
  constructor(name, varType, token) {
    this.type    = NodeType.RECORD_FIELD;
    this.name    = name;
    this.varType = varType;
    Object.assign(this, pos(token));
  }
}

// ===============================================================================
// NÅ“uds littéraux
// ===============================================================================

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

// ===============================================================================
// NÅ“uds de référence et d'opération
// ===============================================================================

/** Référence à une variable. ex: note, compteur */
export class IdentifierNode {
  constructor(name, token) {
    this.type = NodeType.IDENTIFIER;
    this.name = name;
    Object.assign(this, pos(token));
  }
}

/** Accès à un tableau. ex: T[i], M[i,j] */
export class ArrayAccessNode {
  constructor(name, indices, token) {
    this.type    = NodeType.ARRAY_ACCESS;
    this.name    = name;
    this.indices = indices; // ExpressionNode[]
    Object.assign(this, pos(token));
  }
}

/** Accès à un membre (champ) d'un enregistrement. ex: e.nom, groupe[i].moyenne */
export class MemberAccessNode {
  constructor(object, property, token) {
    this.type     = NodeType.MEMBER_ACCESS;
    this.object   = object;   // ExpressionNode (e.g. IdentifierNode, ArrayAccessNode, MemberAccessNode)
    this.property = property; // string (le nom du champ accédé)
    Object.assign(this, pos(token));
  }
}

/**
 * Opération binaire.
 * left OP right ? ex: a + b, x >= 10, a ET b
 */
export class BinaryOpNode {
  /**
   * @param {*}      left     - NÅ“ud gauche
   * @param {string} operator - Opérateur (+, -, *, /, %, ^, =, !=, <, <=, >, >=, ET, OU)
   * @param {*}      right    - NÅ“ud droit
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
 * OP operand ? ex: NON condition, - valeur
 */
export class UnaryOpNode {
  constructor(operator, operand, token) {
    this.type     = NodeType.UNARY_OP;
    this.operator = operator;
    this.operand  = operand;
    Object.assign(this, pos(token));
  }
}

// ===============================================================================
// NÅ“uds d'instruction
// ===============================================================================

/** Affectation : name <- value ou e1.nom <- value */
export class AssignNode {
  constructor(target, value, token) {
    this.type   = NodeType.ASSIGN;
    this.target = target; // IdentifierNode ou MemberAccessNode
    this.name   = target?.name || null; // Rétrocompatibilité pour les cas simples
    this.value  = value; // nœud expression
    Object.assign(this, pos(token));
  }
}

/** Affectation Tableau : name[idx1, idx2] <- value */
export class ArrayAssignNode {
  constructor(name, indices, value, token) {
    this.type    = NodeType.ARRAY_ASSIGN;
    this.name    = name;    // string
    this.indices = indices; // ExpressionNode[]
    this.value   = value;   // nœud expression
    Object.assign(this, pos(token));
  }
}

/**
 * Condition : SI ? ALORS ? (SINON SI ? ALORS ?)* (SINON ?)?FINSI
 */
export class IfNode {
  /**
   * @param {*}           condition     - NÅ“ud condition principale
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

/** Boucle TANTQUE condition FAIRE ? FINTANTQUE */
export class WhileNode {
  constructor(condition, body, token) {
    this.type      = NodeType.WHILE;
    this.condition = condition;
    this.body      = body;
    Object.assign(this, pos(token));
  }
}

/**
 * Boucle POUR variable ALLANT DE from A to [PAS step] FAIRE ? FINPOUR
 *
 * Syntaxe : POUR i ALLANT DE debut A fin [PAS valeur] FAIRE ? FINPOUR
 *
 * Règles sur le pas :
 *   - si step est null  ? pas implicite de 1 (PAS absent de la source)
 *   - si step est fourni ? PAS valeur explicite (valeur != 0 et != 1 obligatoire)
 */
export class ForNode {
  /**
   * @param {string}     variable - Nom de la variable de contrôle
   * @param {*}          from     - NÅ“ud valeur de départ
   * @param {*}          to       - NÅ“ud valeur de fin
   * @param {*|null}     step     - NÅ“ud pas (null = implicite 1, pas de PAS ?crit)
   * @param {BlockNode}  body
   * @param {object}     token
   */
  constructor(variable, from, to, step, body, token) {
    this.type     = NodeType.FOR;
    this.variable = variable;
    this.from     = from;
    this.to       = to;
    this.step     = step;   // null = implicite 1 (PAS absent)
    this.body     = body;
    Object.assign(this, pos(token));
  }
}

/** Boucle REPETER ? JUSQUA (condition) */
export class DoWhileNode {
  constructor(body, condition, token) {
    this.type      = NodeType.DO_WHILE;
    this.body      = body;
    this.condition = condition;
    Object.assign(this, pos(token));
  }
}

/** Instruction ECRIRE(arg1, arg2, ?) */
export class PrintNode {
  /** @param {Array} args - NÅ“uds d'expressions à afficher */
  constructor(args, token) {
    this.type = NodeType.PRINT;
    this.args = args;
    Object.assign(this, pos(token));
  }
}

/**
 * Instruction LIRE(cible)
 *
 * La cible peut être :
 *   - un IdentifierNode  ? LIRE(x)
 *   - un ArrayAccessNode ? LIRE(T[i])
 *
 * Le champ `variable` est conservé pour rétrocompatibilité (string du nom de
 * la variable racine). Le champ `target` est le nœud AST complet.
 */
export class InputNode {
  /**
   * @param {IdentifierNode|ArrayAccessNode|string} target  - NÅ“ud cible (ou string legacy)
   * @param {object} token
   */
  constructor(target, token) {
    this.type = NodeType.INPUT;
    // Support du mode legacy (string) et du mode nœud AST
    if (typeof target === 'string') {
      this.variable = target;   // rétrocompatibilité
      this.target   = null;     // pas de nœud dans ce cas
    } else {
      // NÅ“ud AST : extraire le nom de base pour `variable`
      this.target   = target;
      this.variable = target?.name ?? '?';
    }
    Object.assign(this, pos(token));
  }
}

// ===============================================================================
// Structure SELON (Switch / Case)
// ===============================================================================

/** Structure conditionnelle à choix multiples (SELON) */
export class SwitchNode {
  /**
   * @param {object} expression - Expression évaluée par le SELON
   * @param {CaseNode[]} cases - Liste des blocs CAS
   * @param {BlockNode|null} defaultBlock - Bloc par défaut (AUTRE), null si absent
   * @param {object} token - Token SELON pour la trace de l'erreur
   */
  constructor(expression, cases, defaultBlock, token) {
    this.type         = NodeType.SWITCH;
    this.expression   = expression;
    this.cases        = cases;
    this.defaultBlock = defaultBlock;
    Object.assign(this, pos(token));
  }
}

/** Branche individuelle d'un bloc SELON (CAS) */
export class CaseNode {
  /**
   * @param {object} value - Expression de test
   * @param {BlockNode} body - Bloc d'instructions propre à ce cas
   * @param {object} token - Token CAS pour trace
   */
  constructor(value, body, token) {
    this.type  = NodeType.CASE;
    this.value = value;
    this.body  = body;
    Object.assign(this, pos(token));
  }
}

