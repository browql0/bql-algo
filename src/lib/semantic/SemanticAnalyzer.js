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
     * Table des symboles structurée avec variables et constantes séparées
     */
    this.symbolTable = {
      variables: {},
      constantes: {},
      customTypes: {}
    };
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  /**
   * Lance l'analyse sémantique de l'AST.
   * @param {import('../parser/AST/nodes.js').ProgramNode} ast
   * @returns {{ errors: AlgoSemanticError[], symbols: Map }}
   */
  analyze(ast) {
    if (!ast) return { errors: this.errors, symbolTable: this.symbolTable };

    // 0. Enregistrer les types structurés (AVANT constantes et variables)
    if (Array.isArray(ast.customTypes)) {
      this._processCustomTypes(ast.customTypes);
    }

    // 1. Enregistrer les constantes (AVANT les variables — elles ont la priorité)
    //    Les constantes sont immuables et toujours initialisées.
    if (Array.isArray(ast.constants)) {
      this._processConstants(ast.constants);
    }

    // 2. Enregistrer toutes les déclarations de variables depuis ast.declarations
    if (Array.isArray(ast.declarations)) {
      this._processDeclarations(ast.declarations);
    }

    // 3. Analyser le corps du programme
    if (ast.body) {
      this._analyzeBlock(ast.body);
    }

    return { errors: this.errors, symbolTable: this.symbolTable };
  }

  // ── Traitement des constantes & types structurés ────────────────────────────

  _processCustomTypes(customTypes) {
    if (!Array.isArray(customTypes)) return;

    for (const typeDecl of customTypes) {
      if (!typeDecl || !typeDecl.name) continue;
      const tName = typeDecl.name;
      
      if (this.symbolTable.customTypes[tName]) {
        this._addError({
          message: `Le type '${tName}' est déjà déclaré`,
          line: typeDecl.line,
          column: typeDecl.column,
          value: tName,
        });
      } else {
        const fields = {};
        for (const field of typeDecl.fields) {
          if (fields[field.name]) {
            this._addError({
              message: `Le champ '${field.name}' est dupliqué dans l'enregistrement '${tName}'`,
              line: field.line,
              column: field.column,
              value: field.name,
            });
          } else {
            fields[field.name] = field.varType;
          }
        }
        this.symbolTable.customTypes[tName] = { 
          nom: tName,
          fields: fields 
        };
      }
    }
  }

  _processConstants(constants) {
    if (!Array.isArray(constants)) return;

    for (const decl of constants) {
      if (!decl) continue;
      const name = decl.name;
      if (!isValidVariableName(name)) continue;

      if (this.symbolTable.constantes[name] || this.symbolTable.variables[name]) {
        this._addError({
          message: `L'identifiant '${name}' est déjà déclaré`,
          line: decl.line,
          column: decl.column,
          value: name,
        });
      } else {
        this.symbolTable.constantes[name] = {
          nom: name,
          type: decl.constType || 'inconnu',
          line: decl.line,
          immutable: true,
          initialized: true
        };
      }
    }
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

        if (this.symbolTable.variables[name] || this.symbolTable.constantes[name]) {
          this._addError({
            message: `Le tableau '${name}' est déjà déclaré`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ou tableau ne peut être déclaré qu'une seule fois.`,
          });
        } else {
          const isDynamicPlaceholder = decl.sizes.some(s => s === null);
          this.symbolTable.variables[name] = {
            type: `${decl.varType}[]`,
            line: decl.line,
            initialized: true, // "initialisé" dans le sens où l'identifiant existe
            isArray: true,
            isAllocated: !isDynamicPlaceholder,
            isDynamicPlaceholder: isDynamicPlaceholder,
            dimensions: decl.sizes?.length ?? 1,
            baseType: decl.varType
          };
        }
        
        // Analyser les expressions de taille (pour les statiques uniquement)
        if (decl.sizes) {
          for (const size of decl.sizes) {
            if (size !== null) {
              this._analyzeExpr(size);
            }
          }
        }
        continue;
      }

      // Cas standard : a, b : ENTIER;
      if (!Array.isArray(decl.names)) continue;

      for (const name of decl.names) {
        // Ignorer les noms invalides (résidus d'erreurs de parsing)
        if (!isValidVariableName(name)) continue;

        if (this.symbolTable.variables[name] || this.symbolTable.constantes[name]) {
          this._addError({
            message: `La variable '${name}' est déjà déclarée`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ne peut être déclaré qu'une seule fois dans le bloc VARIABLES.`,
          });
        } else {
          this.symbolTable.variables[name] = {
            type: decl.varType,
            line: decl.line,
            initialized: false, // sera mis à true lors de l'affectation ou LIRE
          };
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
      case NodeType.ARRAY_ALLOCATION: return this._analyzeArrayAllocation(node);
      case NodeType.SWITCH:       return this._analyzeSwitch(node);
      default:
        return null;
    }
  }

  _getTargetType(node) {
    if (!node) return null;
    if (node.type === NodeType.IDENTIFIER) {
      const entry = this.symbolTable.variables[node.name] || this.symbolTable.constantes[node.name];
      return entry ? entry.type : null;
    }
    if (node.type === NodeType.ARRAY_ACCESS) {
      const entry = this.symbolTable.variables[node.name] || this.symbolTable.constantes[node.name];
      return entry ? entry.baseType : null;
    }
    if (node.type === NodeType.MEMBER_ACCESS) {
       const baseType = this._getTargetType(node.object);
       if (!baseType) return null;
       const cType = this.symbolTable.customTypes[baseType];
       return cType && cType.fields ? cType.fields[node.property] : null;
    }
    return null;
  }

  // ── Ajout d'erreurs ───────────────────────────────────────────────────────────────

  _analyzeAssign(node) {
    const target = node.target; // IdentifierNode, ArrayAccessNode, or MemberAccessNode
    
    // Si c'est un noeud basique (AssignNode sans target mais avec name pour compat)
    if (!target) {
       // fallback ancien code
       const name = node.name;
       if (!isValidVariableName(name)) {
         if (node.value) this._analyzeExpr(node.value);
         return;
       }
       const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
       if (!entry) {
         this._addError({
           message: `Identifiant '${name}' non déclaré`,
           line: node.line,
           column: node.column,
           value: name,
           hint: `Déclarez '${name}' dans le bloc VARIABLE(S) avant DEBUT : ${name} : ENTIER;`,
         });
       } else if (entry.immutable) {
         this._addError({
           message: `Impossible de modifier la constante '${name}'`,
           line: node.line,
           column: node.column,
           value: name,
         });
       } else if (entry.isArray) {
         this._addError({
           message: `Affectation invalide : le tableau '${name}' ne peut pas être utilisé sans indice`,
           line: node.line,
           column: node.column,
           value: name,
         });
       } else {
         entry.initialized = true;
         if (node.value) {
            this._analyzeExpr(node.value);
            const inferredType = this._inferExprType(node.value);
            if (inferredType && !this._isTypeCompatible(entry.type, inferredType)) {
               this._addError({
                 message: `Type incompatible : impossible d'affecter une valeur de type ${inferredType.toUpperCase()} à '${name}' déclaré comme ${entry.type.toUpperCase()}`,
                 line: node.line,
                 column: node.column,
                 value: name,
               });
            }
         }
       }
       return;
    }

    const type = this._analyzeTarget(target, true, false);
    if (node.value) {
      this._analyzeExpr(node.value);
      const inferredType = this._inferExprType(node.value);
      if (type && inferredType && !this._isTypeCompatible(type, inferredType)) {
        this._addError({
          message: `Type incompatible : impossible d'affecter une valeur de type ${inferredType.toUpperCase()} à la cible de type ${type.toUpperCase()}`,
          line: node.line,
          column: node.column,
        });
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

    const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];

    if (!entry) {
      this._addError({
        message: `Identifiant '${name}' non déclaré`,
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
    } else if (!entry.isAllocated) {
      this._addError({
        message: `tableau '${name}' non alloué`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Ce tableau a été déclaré vide. Vous devez lui définir une taille avec 'Tableau ${name}[...];' avant de l'utiliser.`,
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

  // ── Allocation de taille Tableau (après DEBUT) ────────────────────────────────

  _analyzeArrayAllocation(node) {
    const name = node.name;
    if (!isValidVariableName(name)) {
      if (node.sizes) node.sizes.forEach(sz => this._analyzeExpr(sz));
      return;
    }

    const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];

    if (!entry) {
      this._addError({
        message: `tableau non déclaré`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Le tableau '${name}' doit d'abord être déclaré dans le bloc VARIABLES.`,
      });
    } else if (!entry.isArray) {
      this._addError({
        message: `'${name}' n'est pas un tableau`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `'${name}' a été déclaré comme une variable simple.`,
      });
    } else if (!entry.isDynamicPlaceholder) {
      this._addError({
        message: `tableau déjà dimensionné`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `La taille du tableau '${name}' a déjà été définie lors de sa déclaration statique.`,
      });
    } else if (entry.isAllocated) {
      this._addError({
        message: `tableau déjà dimensionné`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Le tableau '${name}' a déjà été alloué précédemment. Il ne peut pas être réalloué.`,
      });
    } else {
      if (entry.dimensions !== node.sizes.length) {
        this._addError({
          message: `Le tableau '${name}' a été déclaré avec ${entry.dimensions} dimension(s), mais vous allouez ${node.sizes.length} dimension(s)`,
          line: node.line,
          column: node.column,
          hint: `Respectez la dimensionnalité (ex 1D: [], ex 2D: [,]).`,
        });
      }
      entry.isAllocated = true; // Mark as allocated for subsequent usage
    }

    if (node.sizes) {
      for (const sz of node.sizes) {
        this._analyzeExpr(sz);
        const indexType = this._inferExprType(sz);
        if (indexType && indexType !== 'entier') {
          this._addError({
            message: `Une taille de tableau doit être un entier (trouvé: ${indexType.toUpperCase()})`,
            line: sz.line,
            column: sz.column,
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
    const entry = this.symbolTable.variables[varName] || this.symbolTable.constantes[varName];
    if (!entry) {
      this._addError({
        message: `Identifiant '${varName}' non déclaré`,
        line: node.line,
        column: node.column,
        value: varName,
        hint: `Déclarez '${varName}' dans le bloc VARIABLES : ${varName} : ENTIER;`,
      });
    } else if (entry.immutable) {
      this._addError({
        message: `Impossible de modifier la constante '${varName}'`,
        line: node.line,
        column: node.column,
        value: varName,
      });
    } else {
      // Marquer comme initialisée (la boucle POUR l'initialise)
      entry.initialized = true;
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
    const target = node.target || node.variable; 
    
    // Si target est un noeud complexe géré par _analyzeTarget
    if (target && typeof target === 'object') {
       if (target.type === NodeType.ARRAY_ACCESS || target.type === NodeType.IDENTIFIER || target.type === NodeType.MEMBER_ACCESS) {
          this._analyzeTarget(target, true, false);
          return;
       }
    }

    // Fallback pour compatibilité (si target est juste un nom en string)
    const name = typeof target === 'string' ? target : target?.name;

    if (!name || !isValidVariableName(name)) {
      return; 
    }

    const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
    if (!entry) {
      this._addError({
        message: `Identifiant '${name}' non déclaré`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLES avant DEBUT.`,
      });
    } else if (entry.immutable) {
      this._addError({
        message: `Impossible de modifier la constante '${name}' avec LIRE`,
        line: node.line,
        column: node.column,
        value: name,
      });
    } else {
      entry.initialized = true;
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
      case NodeType.IDENTIFIER:
      case NodeType.ARRAY_ACCESS:
      case NodeType.MEMBER_ACCESS: {
        this._analyzeTarget(node, false, inPrintContext);
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

  _analyzeTarget(node, isAssignment = false, inPrintContext = false) {
    if (!node) return null;

    if (node.type === NodeType.IDENTIFIER) {
      const name = node.name;
      if (!isValidVariableName(name)) return null;

      const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
      if (!entry) {
        this._addError({
          message: `Identifiant '${name}' non déclaré`,
          line: node.line,
          column: node.column,
          value: name,
        });
        return null;
      }
      if (isAssignment) {
        if (entry.immutable) {
          this._addError({ message: `Impossible de modifier la constante '${name}'`, line: node.line, column: node.column });
          return null;
        }
        if (entry.isArray) {
          this._addError({ message: `Affectation invalide : le tableau '${name}' ne peut pas être modifié sans indice`, line: node.line, column: node.column });
          return null;
        }
        entry.initialized = true;
      } else {
        if (!entry.immutable && !entry.initialized && !inPrintContext) {
           this._addError({ message: `La variable '${name}' est utilisée avant d'avoir reçu une valeur`, line: node.line, column: node.column });
        }
      }
      return entry.type;
    }

    if (node.type === NodeType.ARRAY_ACCESS) {
      const name = node.name;
      if (!isValidVariableName(name)) return null;
      const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
      if (!entry) {
         this._addError({ message: `Identifiant '${name}' non déclaré`, line: node.line, column: node.column });
         return null;
      }
      if (!entry.isArray) {
         this._addError({ message: `'${name}' n'est pas un tableau`, line: node.line, column: node.column });
         return null;
      }
      if (!entry.isAllocated) {
         this._addError({ message: `Le tableau '${name}' est non alloué`, line: node.line, column: node.column });
         return null;
      }
      if (node.indices) {
         if (entry.dimensions !== node.indices.length) {
            this._addError({ message: `Le tableau nécessite ${entry.dimensions} indices (utilisé: ${node.indices.length})`, line: node.line, column: node.column });
         }
         for(const idx of node.indices) {
            this._analyzeExpr(idx);
            const t = this._inferExprType(idx);
            if (t && t !== 'entier') this._addError({ message: `L'indice doit être entier`, line: idx.line, column: idx.column });
         }
      }
      if (isAssignment) {
         if (entry.immutable) { this._addError({ message: `Impossible de modifier la constante '${name}'`, line: node.line, column: node.column }); return null;}
         entry.initialized = true;
      }
      return entry.baseType;
    }

    if (node.type === NodeType.MEMBER_ACCESS) {
       const baseType = this._analyzeTarget(node.object, isAssignment, inPrintContext);
       if (!baseType) return null;
       const customType = this.symbolTable.customTypes[baseType];
       if (!customType) {
          this._addError({ message: `Le type '${baseType.toUpperCase()}' n'est pas un enregistrement, accès à '${node.property}' impossible`, line: node.line, column: node.column });
          return null;
       }
       const fieldType = customType.fields[node.property];
       if (!fieldType) {
          this._addError({ message: `Le champ '${node.property}' n'existe pas dans le type '${baseType}'`, line: node.line, column: node.column });
          return null;
       }
       return fieldType;
    }

    return null;
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
      case NodeType.IDENTIFIER:
      case NodeType.ARRAY_ACCESS:
      case NodeType.MEMBER_ACCESS:
        return this._getTargetType(node);
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
