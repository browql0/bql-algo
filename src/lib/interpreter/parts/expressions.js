import AlgoRuntimeError from '../../errors/RuntimeError.js';
import { NodeType } from '../../parser/AST/nodes.js';

const expressionEvaluationMethods = {
  async _evaluate(node) {
    switch (node.type) {
      case NodeType.NUMBER:    return node.value;
      case NodeType.STRING:    return node.value;
      case NodeType.CHAR:      return node.value;
      case NodeType.BOOLEAN:   return node.value;

      case NodeType.IDENTIFIER:
        return this.env.get(node.name, node.line);

      case NodeType.ARRAY_ACCESS: {
        const arr = this.env.get(node.name, node.line);
        if (!Array.isArray(arr)) {
          if (arr === null) {
            throw new AlgoRuntimeError({
              message: `tableau '${node.name}' non alloué`,
              line: node.line,
              hint: `Vous devez utiliser 'Tableau ${node.name}[...]' après DEBUT pour allouer le tableau avant d'y accéder.`,
            });
          }
          throw new AlgoRuntimeError({
            message: `'${node.name}' n'est pas un tableau`,
            line: node.line,
          });
        }
        
        const indices = [];
        for (const idxNode of node.indices) {
          const index = await this._evaluate(idxNode);
          indices.push(Math.floor(this._toNumber(index, node.line)));
        }

        if (indices.length === 1) {
          if (indices[0] < 0 || indices[0] >= arr.length) {
            throw new AlgoRuntimeError({
              message: `Accès hors bornes : ${indices[0]} (taille: ${arr.length})`,
              line: node.line,
              hint: `L'indice doit être compris entre 0 et ${arr.length - 1}.`
            });
          }
          await this._reportArrayUpdate(node.name, 'read', indices, arr);
          return arr[indices[0]];
        } else if (indices.length === 2) {
          if (indices[0] < 0 || indices[0] >= arr.length || !Array.isArray(arr[indices[0]]) || indices[1] < 0 || indices[1] >= arr[indices[0]].length) {
            throw new AlgoRuntimeError({
              message: `Accès hors bornes : [${indices[0]}, ${indices[1]}]`,
              line: node.line
            });
          }
          await this._reportArrayUpdate(node.name, 'read', indices, arr);
          return arr[indices[0]][indices[1]];
        }
      }

      case NodeType.MEMBER_ACCESS: {
        const obj = await this._evaluate(node.object);
        if (!obj || typeof obj !== 'object') {
          throw new AlgoRuntimeError({
            message: `Accès invalide: n'est pas un enregistrement`,
            line: node.line
          });
        }
        return obj[node.property];
      }

      case NodeType.UNARY_OP:
        return this._evalUnary(node);

      case NodeType.BINARY_OP:
        return this._evalBinary(node);

      default:
        throw new AlgoRuntimeError({
          message: `Expression inconnue : '${node.type}'`,
          line: node.line,
        });
    }
  },

  async _evalUnary(node) {
    const val = await this._evaluate(node.operand);
    switch (node.operator) {
      case '-':   return -this._toNumber(val, node.line);
      case 'NON': return !this._isTruthy(val);
      default:
        throw new AlgoRuntimeError({
          message: `Opérateur unaire inconnu : '${node.operator}'`,
          line: node.line,
        });
    }
  },

  async _evalBinary(node) {
    if (node.operator === 'ET') {
      return this._isTruthy(await this._evaluate(node.left))
        ? this._isTruthy(await this._evaluate(node.right))
        : false;
    }
    if (node.operator === 'OU') {
      return this._isTruthy(await this._evaluate(node.left))
        ? true
        : this._isTruthy(await this._evaluate(node.right));
    }

    const left  = await this._evaluate(node.left);
    const right = await this._evaluate(node.right);

    switch (node.operator) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return left + right;
      case '-':  return this._toNumber(left, node.line) - this._toNumber(right, node.line);
      case '*':  return this._toNumber(left, node.line) * this._toNumber(right, node.line);
      case '/': {
        const r = this._toNumber(right, node.line);
        if (r === 0) throw new AlgoRuntimeError({
          message: `Impossible de diviser par zéro`,
          hint: `Vérifiez que le diviseur n'est pas nul avant d'effectuer la division.`,
          line: node.line,
        });
        return this._toNumber(left, node.line) / r;
      }
      case '%':
      case 'MOD': {
        const r = this._toNumber(right, node.line);
        if (r === 0) throw new AlgoRuntimeError({
          message: `Impossible de calculer le modulo par zéro`,
          hint: `Le modulo nécessite un diviseur non nul.`,
          line: node.line,
        });
        return this._toNumber(left, node.line) % r;
      }
      case '^':
        return Math.pow(this._toNumber(left, node.line), this._toNumber(right, node.line));

      case '=':  return this._equals(left, right, node.left, node.right);
      case '!=': return !this._equals(left, right, node.left, node.right);  // compat legacy
      case '<>': return !this._equals(left, right, node.left, node.right);  // syntaxe BQL officielle
      case '<':  return left < right;
      case '<=': return left <= right;
      case '>':  return left > right;
      case '>=': return left >= right;

      default:
        throw new AlgoRuntimeError({
          message: `Opérateur binaire inconnu : '${node.operator}'`,
          value: node.operator,
          line: node.line,
        });
      }
  },

  _equals(left, right, leftNode = null, rightNode = null) {
    if (
      this._isCharacterComparisonOperand(leftNode) &&
      this._isCharacterComparisonOperand(rightNode)
    ) {
      return String(left).toUpperCase() === String(right).toUpperCase();
    }

    return left === right || String(left) === String(right);
  },

  _isCharacterComparisonOperand(node) {
    if (!node) return false;
    if (node.type === NodeType.CHAR) return true;
    return this._resolveExpressionType(node) === 'caractere';
  },

  _resolveExpressionType(node) {
    if (!node) return null;

    if (node.type === NodeType.CHAR) return 'caractere';
    if (node.type === NodeType.STRING) return 'chaine';
    if (node.type === NodeType.NUMBER) return Number.isInteger(node.value) ? 'entier' : 'reel';
    if (node.type === NodeType.BOOLEAN) return 'booleen';

    if (node.type === NodeType.IDENTIFIER) {
      try {
        return this.env.getEntry(node.name, node.line).type;
      } catch (e) {
        return null;
      }
    }

    if (node.type === NodeType.ARRAY_ACCESS) {
      try {
        const entryType = this.env.getEntry(node.name, node.line).type;
        return entryType.endsWith('[]') ? entryType.slice(0, -2) : entryType;
      } catch (e) {
        return null;
      }
    }

    if (node.type === NodeType.MEMBER_ACCESS) {
      const objectType = this._resolveExpressionType(node.object);
      if (!objectType) return null;

      const recordType = objectType.endsWith('[]') ? objectType.slice(0, -2) : objectType;
      const fields = this.env.customTypes.get(recordType);
      return fields?.[node.property] ?? null;
    }

    return null;
  }
};

export default expressionEvaluationMethods;
