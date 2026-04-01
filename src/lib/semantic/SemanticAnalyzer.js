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
 *
 * Corrections appliquées :
 *  - Ignore les noeuds résultant d'erreurs de parsing ('?', undefined, null)
 *  - Ne signale pas de variable non déclarée si la valeur est '?' (résidu d'erreur parser)
 *  - Ne signale pas d'utilisation avant initialisation dans ECRIRE (contexte affichage)
 *  - Table des symboles correctement construite depuis ast.declarations
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

/**
 * Vérifie qu'un nom de variable est valide (pas un résidu d'erreur de parsing).
 * Le parser peut produire '?' comme nom de variable en cas d'erreur de récupération.
 * Ces nœuds ne doivent pas générer d'erreurs sémantiques supplémentaires.
 *
 * @param {string|any} name
 * @returns {boolean} true si le nom est valide et doit être analysé
 */
function isValidVariableName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name === '?') return false;  // résidu d'erreur de parsing
  if (name.trim() === '') return false;
  return true;
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
     *
     * Exemple après VARIABLES: a : ENTIER; b : ENTIER;
     * {
     *   'a': { type: 'entier', line: 3, initialized: false },
     *   'b': { type: 'entier', line: 4, initialized: false }
     * }
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

    // 1. Enregistrer toutes les déclarations de variables depuis ast.declarations
    //    C'est la source de vérité pour la table des symboles.
    if (Array.isArray(ast.declarations)) {
      this._processDeclarations(ast.declarations);
    }

    // 2. Analyser le corps du programme
    if (ast.body) {
      this._analyzeBlock(ast.body);
    }

    return { errors: this.errors, symbols: this.symbols };
  }

  // ── Traitement des déclarations ───────────────────────────────────────────────

  /**
   * Enregistre les variables déclarées dans la table des symboles.
   * Chaque VarDeclNode peut contenir plusieurs noms (a, b : ENTIER;).
   *
   * @param {import('../parser/AST/nodes.js').VarDeclNode[]} declarations
   */
  _processDeclarations(declarations) {
    if (!Array.isArray(declarations)) return;

    for (const decl of declarations) {
      if (!decl) continue;

      // Cas : Tableau T[10] : ENTIER;
      if (decl.type === NodeType.ARRAY_DECL) {
        const name = decl.name;
        if (!isValidVariableName(name)) continue;

        if (this.symbols.has(name)) {
          this._addError({
            message: `Le tableau '${name}' est déjà déclaré`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ou tableau ne peut être déclaré qu'une seule fois.`,
          });
        } else {
          // Type enregistré: "entier[]", "reel[]", etc.
          this.symbols.set(name, {
            type: `${decl.varType}[]`,
            line: decl.line,
            initialized: true, // Un tableau est "initialisé" par sa déclaration (allocation)
            isArray: true,
            dimensions: decl.sizes?.length ?? 1,
            baseType: decl.varType
          });
        }
        
        // Analyser les expressions de taille
        if (decl.sizes) {
          for (const size of decl.sizes) {
            this._analyzeExpr(size);
          }
        }
        continue;
      }

      // Cas standard : a, b : ENTIER;
      if (!Array.isArray(decl.names)) continue;

      for (const name of decl.names) {
        // Ignorer les noms invalides (résidus d'erreurs de parsing)
        if (!isValidVariableName(name)) continue;

        if (this.symbols.has(name)) {
          this._addError({
            message: `La variable '${name}' est déjà déclarée`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ne peut être déclaré qu'une seule fois dans le bloc VARIABLES.`,
          });
        } else {
          this.symbols.set(name, {
            type: decl.varType,
            line: decl.line,
            initialized: false, // sera mis à true lors de l'affectation ou LIRE
          });
        }
      }
    }
  }

  // ── Analyse d'un bloc d'instructions ─────────────────────────────────────────

  _analyzeBlock(block) {
    if (!block || !block.statements) return;
    for (const stmt of block.statements) {
      // Ignorer les nœuds invalides/null produits par le parser en mode récupération
      if (stmt === null || stmt === undefined) continue;
      this._analyzeStatement(stmt);
    }
  }

  // ── Analyse d'une instruction ─────────────────────────────────────────────────

  _analyzeStatement(node) {
    if (!node) return;
    switch (node.type) {
      case NodeType.ASSIGN:       return this._analyzeAssign(node);
      case NodeType.ARRAY_ASSIGN: return this._analyzeArrayAssign(node);
      case NodeType.IF:           return this._analyzeIf(node);
      case NodeType.WHILE:        return this._analyzeWhile(node);
      case NodeType.FOR:          return this._analyzeFor(node);
      case NodeType.DO_WHILE:     return this._analyzeDoWhile(node);
      case NodeType.PRINT:        return this._analyzePrint(node);
      case NodeType.INPUT:        return this._analyzeInput(node);
      case NodeType.VAR_DECL:     return this._processDeclarations([node]);
      case NodeType.ARRAY_DECL:   return this._processDeclarations([node]);
      case NodeType.SWITCH:       return this._analyzeSwitch(node);
      default: break;
    }
  }

  // ── Affectation ───────────────────────────────────────────────────────────────

  _analyzeAssign(node) {
    const name = node.name;

    // Ignorer les nœuds parasites (résidus d'erreurs de parsing)
    if (!isValidVariableName(name)) {
      if (node.value) this._analyzeExpr(node.value);
      return;
    }

    const entry = this.symbols.get(name);

    if (!entry) {
      this._addError({
        message: `La variable '${name}' n'est pas déclarée`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT : ${name} : ENTIER;`,
      });
    } else if (entry.isArray) {
      // ── NOUVEAU : Tableau utilisé sans indice à gauche d'une affectation ──
      // Ex: T <- 3;   → interdit
      // Ex: T[0] <- 3; → valide (traité par _analyzeArrayAssign)
      this._addError({
        message: `Affectation invalide : le tableau '${name}' ne peut pas être utilisé sans indice`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Utilisez un indice pour accéder à un élément : ${name}[i] <- valeur;`,
      });
      // Analyser quand même l'expression de droite pour détecter d'autres erreurs
      if (node.value) this._analyzeExpr(node.value);
    } else {
      // Variable simple : affectation normale
      // Marquer comme initialisée
      entry.initialized = true;

      // Vérification de compatibilité de type (si on peut inférer)
      if (node.value) {
        this._analyzeExpr(node.value);
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
      }
    }
  }

  _analyzeArrayAssign(node) {
    const name = node.name;
    if (!isValidVariableName(name)) {
      if (node.indices) node.indices.forEach(idx => this._analyzeExpr(idx));
      if (node.value) this._analyzeExpr(node.value);
      return;
    }

    const entry = this.symbols.get(name);

    if (!entry) {
      this._addError({
        message: `Le tableau '${name}' n'est pas déclaré`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' comme tableau : Tableau ${name}[taille] : ENTIER;`,
      });
    } else if (!entry.isArray) {
      this._addError({
        message: `'${name}' n'est pas un tableau`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `'${name}' a été déclaré comme une variable simple, pas comme un tableau.`,
      });
    }

    // Analyser les indices
    if (node.indices) {
      if (entry && entry.isArray && entry.dimensions !== node.indices.length) {
        this._addError({
          message: `Le tableau '${name}' nécessite ${entry.dimensions} indice(s) (utilisé: ${node.indices.length})`,
          line: node.line,
          column: node.column,
          hint: `Le tableau a été déclaré avec ${entry.dimensions} dimension(s).`,
        });
      }

      for (const idx of node.indices) {
        this._analyzeExpr(idx);
        const indexType = this._inferExprType(idx);
        if (indexType && indexType !== 'entier') {
          this._addError({
            message: `L'indice du tableau doit être un entier (trouvé: ${indexType.toUpperCase()})`,
            line: idx.line,
            column: idx.column,
            hint: `Utilisez un nombre entier ou une variable de type ENTIER comme indice.`,
          });
        }
      }
    }

    // Analyser la valeur
    if (node.value) {
      this._analyzeExpr(node.value);
      if (entry && entry.baseType) {
        const valType = this._inferExprType(node.value);
        if (valType && !this._isTypeCompatible(entry.baseType, valType)) {
          this._addError({
            message: `Type incompatible : impossible d'affecter du ${valType.toUpperCase()} dans un tableau de ${entry.baseType.toUpperCase()}`,
            line: node.value.line,
            column: node.value.column,
            hint: `Le tableau '${name}' contient des éléments de type ${entry.baseType.toUpperCase()}.`,
          });
        }
      }
    }
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

  // ── Structure SELON ──────────────────────────────────────────────────────────

  _analyzeSwitch(node) {
    // 1. Analyser l'expression d'entrée du SELON
    this._analyzeExpr(node.expression);

    // 2. Analyser chaque CAS
    if (Array.isArray(node.cases)) {
      for (const caseNode of node.cases) {
        // Analyser l'expression de valeur
        this._analyzeExpr(caseNode.value);
        // Analyser le bloc d'instructions
        this._analyzeBlock(caseNode.body);
      }
    }

    // 3. Analyser le bloc par défaut (AUTRE)
    if (node.defaultBlock) {
      this._analyzeBlock(node.defaultBlock);
    }
  }

  // ── Boucle POUR ───────────────────────────────────────────────────────────────

  _analyzeFor(node) {
    const varName = node.variable;

    // Ignorer les nœuds parasites
    if (!isValidVariableName(varName)) {
      this._analyzeExpr(node.from);
      this._analyzeExpr(node.to);
      this._analyzeExpr(node.step);
      this._analyzeBlock(node.body);
      return;
    }

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
    // node.step est null si PAS est absent (pas implicite de 1 — rien à analyser)
    if (node.step !== null && node.step !== undefined) {
      this._analyzeExpr(node.step);
    }
    this._analyzeBlock(node.body);
  }

  // ── Boucle REPETER ────────────────────────────────────────────────────────────

  _analyzeDoWhile(node) {
    this._analyzeBlock(node.body);
    this._analyzeExpr(node.condition);
  }

  // ── ECRIRE ────────────────────────────────────────────────────────────────────

  /**
   * Analyse les arguments de ECRIRE.
   * Dans le contexte d'affichage, on ne signale PAS d'erreur
   * si une variable n'est pas encore initialisée — c'est un pattern
   * légal en pseudo-code (afficher une valeur par défaut/nulle).
   */
  _analyzePrint(node) {
    if (!node.args || !Array.isArray(node.args)) return;
    for (const arg of node.args) {
      if (arg === null || arg === undefined) continue;
      // inPrintContext = true : supprime les warnings "utilisé avant initialisation"
      this._analyzeExpr(arg, true);
    }
  }

  // ── LIRE ──────────────────────────────────────────────────────────────────────

  /**
   * Analyse l'instruction LIRE(variable).
   * Vérifie que la variable est déclarée.
   * Marque la variable comme initialisée après LIRE.
   *
   * Note: Si node.variable === '?', c'est un résidu d'erreur de parsing.
   * On l'ignore silencieusement pour éviter les fausses erreurs en cascade.
   */
  _analyzeInput(node) {
    // Cas : LIRE(T[i]) - node.variable peut être un nom (string) ou un ArrayAccessNode (objet avec .name)
    // Selon la structure de InputNode du parser : LIRE(...) prend souvent un identifiant
    // Si on veut supporter LIRE(T[i]), le parser doit produire un InputNode avec soit .variable (string) soit .arrayAccess (node)
    
    // Pour l'instant, regardons si c'est un identifiant simple ou un accès tableau
    const target = node.variable; 
    
    // Si target est un objet (ArrayAccessNode)
    if (target && typeof target === 'object' && target.type === NodeType.ARRAY_ACCESS) {
      this._analyzeExpr(target);
      return;
    }

    const name = typeof target === 'string' ? target : target?.name;

    // Ignorer les résidus d'erreurs de parsing ('?' = variable non reconnue par le parser)
    if (!name || !isValidVariableName(name)) {
      return; // Pas d'erreur cascadée
    }

    if (!this.symbols.has(name)) {
      this._addError({
        message: `La variable '${name}' n'est pas déclarée`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT.`,
      });
    } else {
      // LIRE initialise la variable (ou tableau)
      this.symbols.get(name).initialized = true;
    }
  }

  // ── Analyse des expressions ───────────────────────────────────────────────────

  /**
   * Analyse sémantique d'une expression.
   *
   * @param {object} node          - Nœud AST d'expression
   * @param {boolean} inPrintContext - Si true, supprime les warnings "avant initialisation"
   */
  _analyzeExpr(node, inPrintContext = false) {
    if (!node) return;

    switch (node.type) {
      case NodeType.IDENTIFIER: {
        const name = node.name;
        // Ignorer les identifiants parasites (résidus d'erreurs de parsing)
        if (!isValidVariableName(name)) break;

        if (!this.symbols.has(name)) {
          this._addError({
            message: `La variable '${name}' n'est pas déclarée`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT : ${name} : ENTIER;`,
          });
        } else if (!this.symbols.get(name).initialized && !inPrintContext) {
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

      case NodeType.ARRAY_ACCESS: {
        const name = node.name;
        if (!isValidVariableName(name)) break;

        const entry = this.symbols.get(name);
        if (!entry) {
          this._addError({
            message: `Le tableau '${name}' n'est pas déclaré`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Déclarez '${name}' comme tableau avant de l'utiliser : Tableau ${name}[10] : ENTIER;`,
          });
        } else if (!entry.isArray) {
          this._addError({
            message: `'${name}' n'est pas un tableau`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `'${name}' a été déclaré comme une variable simple, utilisez '${name}' sans crochets.`,
          });
        }

        // Analyser les indices
        if (node.indices) {
          if (entry && entry.isArray && entry.dimensions !== node.indices.length) {
            this._addError({
              message: `Le tableau '${name}' nécessite ${entry.dimensions} indice(s) (utilisé: ${node.indices.length})`,
              line: node.line,
              column: node.column,
              hint: `Le tableau a été déclaré avec ${entry.dimensions} dimension(s).`,
            });
          }

          for (const idx of node.indices) {
            this._analyzeExpr(idx);
            const idxType = this._inferExprType(idx);
            if (idxType && idxType !== 'entier') {
              this._addError({
                message: `L'indice du tableau doit être un entier (trouvé: ${idxType.toUpperCase()})`,
                line: idx.line,
                column: idx.column,
                hint: `Utilisez un nombre entier ou une variable de type ENTIER comme indice.`,
              });
            }
          }
        }
        break;
      }

      case NodeType.BINARY_OP:
        this._analyzeExpr(node.left, inPrintContext);
        this._analyzeExpr(node.right, inPrintContext);
        break;

      case NodeType.UNARY_OP:
        this._analyzeExpr(node.operand, inPrintContext);
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
      case NodeType.ARRAY_ACCESS: {
        const entry = this.symbols.get(node.name);
        return (entry && entry.isArray) ? entry.baseType : null;
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
