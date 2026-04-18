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

import declarationAnalysisMethods from './parts/declarations.js';
import statementAnalysisMethods from './parts/statements.js';
import assignmentAnalysisMethods from './parts/assignments.js';
import arrayAnalysisMethods from './parts/arrays.js';
import controlFlowAnalysisMethods from './parts/controlFlow.js';
import ioAnalysisMethods from './parts/io.js';
import expressionAnalysisMethods from './parts/expressions.js';
import semanticErrorMethods from './parts/errors.js';

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

}

Object.assign(
  SemanticAnalyzer.prototype,
  declarationAnalysisMethods,
  statementAnalysisMethods,
  assignmentAnalysisMethods,
  arrayAnalysisMethods,
  controlFlowAnalysisMethods,
  ioAnalysisMethods,
  expressionAnalysisMethods,
  semanticErrorMethods,
);

export default SemanticAnalyzer;
