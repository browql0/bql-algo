import { NodeType } from '../../parser/AST/nodes.js';
import { TYPE_COMPAT, isValidVariableName } from './utils.js';

const expressionAnalysisMethods = {
  _getTargetType(node) {
    if (!node) return null;
    if (node.type === NodeType.IDENTIFIER) {
      const entry = this.symbolTable.variables[node.name] || this.symbolTable.constantes[node.name];
      return entry ?entry.type : null;
    }
    if (node.type === NodeType.ARRAY_ACCESS) {
      const entry = this.symbolTable.variables[node.name] || this.symbolTable.constantes[node.name];
      return entry ?entry.baseType : null;
    }
    if (node.type === NodeType.MEMBER_ACCESS) {
       const baseType = this._getTargetType(node.object);
       if (!baseType) return null;
       const cType = this.symbolTable.customTypes[baseType];
       return cType && cType.fields ?cType.fields[node.property] : null;
    }
    return null;
  },

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

      // Littéraux ? ok, pas de vérification nécessaire
      case NodeType.NUMBER:
      case NodeType.STRING:
      case NodeType.CHAR:
      case NodeType.BOOLEAN:
        break;

      default:
        break;
    }
  },

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
          const dims = entry.dimensions ?? 1;
          const idxEx = dims === 1 ?`${name}[i]` : `${name}[${Array.from({length:dims},(_,k)=>(['i','j','k'][k]||('i'+k))).join(', ')}]`;
          this._addError({
            message: `Affectation invalide : le tableau '${name}' ne peut pas recevoir une valeur scalaire`,
            line: node.line,
            column: node.column,
            hint: `Affectez case par case : ${idxEx} <- valeur;`,
          });
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
            this._addError({ message: `Le tableau nécessite ${entry.dimensions} indices (utilis?: ${node.indices.length})`, line: node.line, column: node.column });
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
  },

  _inferExprType(node) {
    if (!node) return null;

    switch (node.type) {
      case NodeType.NUMBER:
        return Number.isInteger(node.value) ?'entier' : 'reel';
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
        // Opérateurs logiques ? booleen
        if (['ET', 'OU'].includes(operator)) return 'booleen';
        // Opérateurs de comparaison ? booleen
        if (['=', '!=', '<>', '<', '<=', '>', '>='].includes(operator)) return 'booleen';
        // Arithmétique ? numérique (on ne peut pas distinguer entier/reel sans évaluation)
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
  },

  _isTypeCompatible(targetType, sourceType) {
    const accepted = TYPE_COMPAT[targetType];
    return accepted ?accepted.includes(sourceType) : true;
  }
};

export default expressionAnalysisMethods;

