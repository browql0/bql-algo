import AlgoRuntimeError from '../../errors/RuntimeError.js';

const arrayExecutionMethods = {
  async _executeArrayDecl(node) {
    const isDynamicPlaceholder = node.sizes.some(s => s === null);
    
    if (isDynamicPlaceholder) {
      this.env.declare(node.name, `${node.varType}[]`, node.line);
      this.env.set(node.name, null, node.line); // Non alloué
      return;
    }

    const dimLengths = [];
    for (const sizeNode of node.sizes) {
      const sizeValue = await this._evaluate(sizeNode);

      if (typeof sizeValue === 'number' && !Number.isInteger(sizeValue)) {
        throw new AlgoRuntimeError({
          message: `La taille d'un tableau doit être un nombre entier (reçu: ${sizeValue})`,
          line: node.line,
        });
      }

      const nSize = Math.floor(this._toNumber(sizeValue, node.line));
      if (nSize <= 0) {
        throw new AlgoRuntimeError({
          message: `La taille d'une dimension doit être strictement positive (reçue: ${nSize})`,
          line: node.line,
        });
      }
      dimLengths.push(nSize);
    }

    let arr;
    if (dimLengths.length === 1) {
      arr = Array.from({ length: dimLengths[0] }, () => this.env.getDefaultValue(node.varType, node.line));
    } else if (dimLengths.length === 2) {
      arr = Array.from({ length: dimLengths[0] }, () => 
        Array.from({ length: dimLengths[1] }, () => this.env.getDefaultValue(node.varType, node.line))
      );
    } else {
      throw new AlgoRuntimeError({
        message: `La dimensionnalité supérieure à 2 n'est pas supportée.`,
        line: node.line,
      });
    }

    this.env.declare(node.name, `${node.varType}[]`, node.line);
    this.env.set(node.name, arr, node.line);
    
    // Notification de création/allocation
    await this._reportArrayUpdate(node.name, 'create', null, arr);
  },

  async _executeArrayAllocation(node) {
    const entry = this.env.getEntry(node.name, node.line);
    
    // Sécurité: vérifier si c'est bien un type tableau
    if (!entry.type.endsWith('[]')) {
      throw new AlgoRuntimeError({
        message: `'${node.name}' n'est pas un tableau`,
        line: node.line,
      });
    }

    const dimLengths = [];
    for (const sizeNode of node.sizes) {
      const sizeValue = await this._evaluate(sizeNode);

      if (typeof sizeValue === 'number' && !Number.isInteger(sizeValue)) {
        throw new AlgoRuntimeError({
          message: `La taille d'un tableau doit être un nombre entier (reçu: ${sizeValue})`,
          line: node.line,
        });
      }

      const nSize = Math.floor(this._toNumber(sizeValue, node.line));
      if (nSize <= 0) {
        throw new AlgoRuntimeError({
          message: `La taille d'une dimension doit être strictement positive (reçue: ${nSize})`,
          line: node.line,
        });
      }
      dimLengths.push(nSize);
    }

    const baseType = entry.type.slice(0, -2); // 'entier[]' -> 'entier'

    let arr;
    if (dimLengths.length === 1) {
      arr = Array.from({ length: dimLengths[0] }, () => this.env.getDefaultValue(baseType, node.line));
    } else if (dimLengths.length === 2) {
      arr = Array.from({ length: dimLengths[0] }, () => 
        Array.from({ length: dimLengths[1] }, () => this.env.getDefaultValue(baseType, node.line))
      );
    } else {
      throw new AlgoRuntimeError({
        message: `La dimensionnalité supérieure à 2 n'est pas supportée.`,
        line: node.line,
      });
    }

    this.env.set(node.name, arr, node.line);
    
    // Notification de création/allocation (utile pour les animations UI)
    await this._reportArrayUpdate(node.name, 'create', null, arr);
  },

  async _executeArrayAssign(node) {
    const arr = this.env.get(node.name, node.line);
    if (!Array.isArray(arr)) {
      if (arr === null) {
        throw new AlgoRuntimeError({
          message: `tableau '${node.name}' non alloué`,
          line: node.line,
          hint: `Vous devez utiliser 'Tableau ${node.name}[...]' après DEBUT pour allouer le tableau avant de l'utiliser.`,
        });
      }
      throw new AlgoRuntimeError({
        message: `'${node.name}' n'est pas un tableau`,
        line: node.line,
      });
    }

    const indices = [];
    for (const idxNode of node.indices) {
      const idxValue = await this._evaluate(idxNode);
      indices.push(Math.floor(this._toNumber(idxValue, node.line)));
    }

    const value = await this._evaluate(node.value);

    if (indices.length === 1) {
      const idx = indices[0];
      if (idx < 0 || idx >= arr.length) {
        throw new AlgoRuntimeError({
          message: `Indice de tableau hors bornes : ${idx} (taille: ${arr.length})`,
          line: node.line,
          hint: `Les indices valides sont de 0 à ${arr.length - 1}.`
        });
      }
      arr[idx] = value;
      // Notification de modification
      await this._reportArrayUpdate(node.name, 'write', [idx], arr);
    } else if (indices.length === 2) {
      const row = indices[0];
      const col = indices[1];
      if (row < 0 || row >= arr.length) {
        throw new AlgoRuntimeError({
          message: `Indice de ligne hors bornes : ${row} (lignes: ${arr.length})`,
          line: node.line,
        });
      }
      if (!Array.isArray(arr[row])) {
         throw new AlgoRuntimeError({
           message: `Impossible d'accéder à l'élément 2D - le tableau est 1D`,
           line: node.line
         });
      }
      if (col < 0 || col >= arr[row].length) {
        throw new AlgoRuntimeError({
          message: `Indice de colonne hors bornes : ${col} (colonnes: ${arr[row].length})`,
          line: node.line,
        });
      }
      arr[row][col] = value;
      // Notification de modification
      await this._reportArrayUpdate(node.name, 'write', indices, arr);
    }
  }
};

export default arrayExecutionMethods;
