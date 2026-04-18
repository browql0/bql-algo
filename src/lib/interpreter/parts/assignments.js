import AlgoRuntimeError from '../../errors/RuntimeError.js';
import { NodeType } from '../../parser/AST/nodes.js';

const assignmentExecutionMethods = {
  async _executeAssign(node) {
    const value = await this._evaluate(node.value);
    
    // Assignation simple compat
    if (!node.target) {
       // Bloquer la modification d'une constante
       const constEntry = this._constants.get(node.name);
       if (constEntry?.immutable) {
          throw new AlgoRuntimeError({
            message: `Impossible de modifier la constante '${node.name}'`,
            value: node.name,
            line: node.line,
          });
       }

       if (!this.env.has(node.name)) {
          const type = this._inferType(value);
          this.env.declare(node.name, type, node.line);
       }
       this.env.set(node.name, value, node.line);
       return;
    }

    await this._setTargetValue(node.target, value);
  },

  async _setTargetValue(targetNode, value) {
    if (targetNode.type === NodeType.IDENTIFIER) {
      const name = targetNode.name;
      const constEntry = this._constants.get(name);
      if (constEntry?.immutable) {
         throw new AlgoRuntimeError({ message: `Impossible de modifier '${name}'`, line: targetNode.line });
      }
      this.env.set(name, value, targetNode.line);

      // Détection : si c'est un record (objet), on rapporte l'update
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        await this._reportArrayUpdate(name, 'write', null, value);
      }
    } else if (targetNode.type === NodeType.ARRAY_ACCESS) {
      const arr = this.env.get(targetNode.name, targetNode.line);
      if (!Array.isArray(arr)) {
         throw new AlgoRuntimeError({ message: `'${targetNode.name}' n'est pas un tableau assignable`, line: targetNode.line });
      }
      
      const indices = [];
      for (const idxNode of targetNode.indices) {
         const idxValue = await this._evaluate(idxNode);
         indices.push(Math.floor(this._toNumber(idxValue, targetNode.line)));
      }
      
      if (indices.length === 1) {
         const idx = indices[0];
         if (idx < 0 || idx >= arr.length) throw new AlgoRuntimeError({ message: `Indice hors bornes`, line: targetNode.line });
         arr[idx] = value;
         await this._reportArrayUpdate(targetNode.name, 'write', [idx], arr);
      } else if (indices.length === 2) {
         const row = indices[0];
         const col = indices[1];
         if (row < 0 || row >= arr.length) throw new AlgoRuntimeError({ message: `Ligne hors bornes`, line: targetNode.line });
         if (!Array.isArray(arr[row])) throw new AlgoRuntimeError({ message: `Tableau 1D accédé en 2D`, line: targetNode.line });
         if (col < 0 || col >= arr[row].length) throw new AlgoRuntimeError({ message: `Colonne hors bornes`, line: targetNode.line });
         arr[row][col] = value;
         await this._reportArrayUpdate(targetNode.name, 'write', indices, arr);
      }
    } else if (targetNode.type === NodeType.MEMBER_ACCESS) {
      const obj = await this._evaluate(targetNode.object);
      if (!obj || typeof obj !== 'object') {
         throw new AlgoRuntimeError({ message: `L'objet n'est pas un enregistrement`, line: targetNode.line });
      }
      obj[targetNode.property] = value;

      // Détection : si l'objet fait partie d'un tableau, on notifie la UI du champ précis
      if (targetNode.object.type === NodeType.ARRAY_ACCESS) {
        const arrName = targetNode.object.name;
        const arr = this.env.get(arrName, targetNode.line);
        const indices = [];
        for (const idxNode of targetNode.object.indices) {
          const idxValue = await this._evaluate(idxNode);
          indices.push(Math.floor(this._toNumber(idxValue, targetNode.line)));
        }
        await this._reportArrayUpdate(arrName, 'write', indices, arr, targetNode.property);
      } else if (targetNode.object.type === NodeType.IDENTIFIER) {
        const varName = targetNode.object.name;
        await this._reportArrayUpdate(varName, 'write', null, obj, targetNode.property);
      }
    }
  }
};

export default assignmentExecutionMethods;
