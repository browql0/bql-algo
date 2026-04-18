import { NodeType } from '../../parser/AST/nodes.js';

const declarationExecutionMethods = {
  async _executeConstDecl(node) {
    // La valeur est un nœud AST "plat" stocké dans node.value
    // On l'évalue directement (c'est toujours un littéral)
    let value;
    switch (node.value?.type) {
      case 'NUMBER':  value = node.value.value; break;
      case 'STRING':  value = node.value.value; break;
      case 'CHAR':    value = node.value.value; break;
      case 'BOOLEAN': value = node.value.value; break;
      default:
        value = node.value?.value ?? null;
    }

    // Coerce selon le type déclaré
    if (node.constType === 'entier')  value = Math.trunc(Number(value));
    if (node.constType === 'reel')    value = parseFloat(value);
    if (node.constType === 'chaine')  value = String(value);
    if (node.constType === 'booleen') value = Boolean(value);

    this._constants.set(node.name, { value, type: node.constType, immutable: true });

    // Déclarer aussi dans l'environnement pour que ECRIRE(Pi) fonctionne
    this.env.declareConst(node.name, node.constType, value, node.line);
  },

  async _executeVarDecl(node) {
    if (node.type === NodeType.ARRAY_DECL) {
      return await this._executeArrayDecl(node);
    }
    for (const name of node.names) {
      this.env.declare(name, node.varType, node.line);
    }
  }
};

export default declarationExecutionMethods;
