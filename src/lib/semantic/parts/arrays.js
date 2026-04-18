import { isValidVariableName } from './utils.js';

const arrayAnalysisMethods = {
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
  },

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
};

export default arrayAnalysisMethods;
