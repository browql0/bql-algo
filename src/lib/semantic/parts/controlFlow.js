import { isValidVariableName } from './utils.js';

const controlFlowAnalysisMethods = {
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
  },

  _analyzeWhile(node) {
    this._analyzeExpr(node.condition);
    this._analyzeBlock(node.body);
  },

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
  },

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
  },

  _analyzeDoWhile(node) {
    this._analyzeBlock(node.body);
    this._analyzeExpr(node.condition);
  }
};

export default controlFlowAnalysisMethods;
