import { NodeType } from '../../parser/AST/nodes.js';
import { isValidVariableName } from './utils.js';

const ioAnalysisMethods = {
  _analyzePrint(node) {
    if (!node.args || !Array.isArray(node.args)) return;
    for (const arg of node.args) {
      if (arg === null || arg === undefined) continue;
      // inPrintContext = true : supprime les warnings "utilisé avant initialisation"
      this._analyzeExpr(arg, true);
    }
  },

  _analyzeInput(node) {
    const target = node.target;

    // ── Nœud AST complet (nouveau chemin)
    if (target && typeof target === 'object') {
      if (target.type === NodeType.ARRAY_ACCESS) {
        // LIRE(notes[i]) ou LIRE(M[i, j]) → chemin normal
        this._analyzeTarget(target, true, false);
        return;
      }

      if (target.type === NodeType.MEMBER_ACCESS) {
        this._analyzeTarget(target, true, false);
        return;
      }

      if (target.type === NodeType.IDENTIFIER) {
        const name = target.name;
        if (!isValidVariableName(name)) return;

        const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
        if (!entry) {
          this._addError({
            message: `Identifiant '${name}' non déclaré`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Déclarez '${name}' dans le bloc VARIABLE(S) avant DEBUT.`,
          });
          return;
        }

        if (entry.immutable) {
          this._addError({
            message: `Impossible de lire la constante '${name}' avec LIRE`,
            line: node.line,
            column: node.column,
            value: name,
          });
          return;
        }

        // ── Erreur pédagogique : tableau ou matrice sans indice
        if (entry.isArray) {
          const dims = entry.dimensions ?? 1;
          if (dims === 1) {
            this._addError({
              message: `Impossible de lire le tableau '${name}' entier avec LIRE`,
              line: node.line,
              column: node.column,
              value: name,
              hint: `Utilisez un indice pour lire une case du tableau : LIRE(${name}[i]);`,
            });
          } else {
            const idxPlaceholders = Array.from({ length: dims }, (_, k) => ['i','j','k'][k] || `i${k}`).join(', ');
            this._addError({
              message: `Impossible de lire la matrice '${name}' entière avec LIRE`,
              line: node.line,
              column: node.column,
              value: name,
              hint: `Utilisez des indices pour lire une case : LIRE(${name}[${idxPlaceholders}]);`,
            });
          }
          return;
        }

        // Variable scalaire → OK
        entry.initialized = true;
        return;
      }
    }

    // ── Fallback legacy (target = string)
    const name = typeof target === 'string' ?target : target?.name;
    if (!name || !isValidVariableName(name)) return;

    const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
    if (!entry) {
      this._addError({
        message: `Identifiant '${name}' non déclaré`,
        line: node.line,
        column: node.column,
        value: name,
        hint: `Déclarez '${name}' dans le bloc VARIABLE(S) avant DEBUT.`,
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
};

export default ioAnalysisMethods;
