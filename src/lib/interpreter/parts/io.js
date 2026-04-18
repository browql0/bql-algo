import AlgoRuntimeError from '../../errors/RuntimeError.js';
import { NodeType } from '../../parser/AST/nodes.js';

const ioExecutionMethods = {
  async _executePrint(node) {
    const parts = await Promise.all(
      node.args.map(arg => this._evaluate(arg).then(v => this._stringify(v)))
    );
    const line = parts.join('');
    this.output.push(line);
    
    // Appeler le callback React immédiatement (streaming du terminal)
    if (this._outputFn) {
      this._outputFn(line);
      // Simuler une vitesse d'affichage (Lot 2)
      if (this._delayMs > 0) {
        await new Promise(r => setTimeout(r, this._delayMs));
      }
    }
  },

  async _executeInput(node) {
    const targetNode = node.target ?? { type: NodeType.IDENTIFIER, name: node.variable, line: node.line };

    if (!this._inputFn && this._inputs.length === 0) {
      await this._setTargetValue(targetNode, "valeur_saisie");
      return;
    }

    let varNameForUI = "inconnue";
    let typeForUI = 'inconnu';

    if (targetNode.type === NodeType.IDENTIFIER) {
      varNameForUI = targetNode.name;
      try { 
        typeForUI = this.env.getEntry(targetNode.name, targetNode.line).type; 
      } catch (e) {}
    } else if (targetNode.type === NodeType.ARRAY_ACCESS) {
      varNameForUI = targetNode.name + "[...]";
      try { 
        typeForUI = this.env.getEntry(targetNode.name, targetNode.line).type.replace(/\[\]/g, ''); 
      } catch (e) {}
    } else if (targetNode.type === NodeType.MEMBER_ACCESS) {
      varNameForUI = targetNode.property;
      try {
        const obj = await this._evaluate(targetNode.object);
        if (obj && obj.__type) {
           const def = this.env.customTypes.get(obj.__type);
           if (def && def[targetNode.property]) {
             typeForUI = def[targetNode.property];
           } else {
             typeForUI = obj.__type;
           }
        }
      } catch (e) {}
    }

    let raw;
    if (this._inputFn) {
      raw = await this._inputFn(varNameForUI, typeForUI);
    } else {
      raw = this._inputs.shift() ?? '';
    }

    let finalValue = raw;
    // Si on connaît le type, on utilise la méthode de de-typisation du langage pour une erreur claire.
    if (typeForUI !== 'inconnu') {
      finalValue = this._coerceInput(raw, typeForUI, varNameForUI, targetNode.line);
    } else {
      // Fallback par défaut
      const num = Number(raw);
      if (!isNaN(num) && String(raw).trim() !== '') {
        finalValue = num;
      }
    }

    await this._setTargetValue(targetNode, finalValue);
  },

  _coerceInput(raw, type, varName, line) {
    const trimmed = String(raw ?? '').trim();

    switch (type) {
      case 'entier': {
        const n = parseInt(trimmed, 10);
        if (isNaN(n)) {
          throw new AlgoRuntimeError({
            message: `Valeur invalide pour '${varName}' (type ENTIER) : "${trimmed}"`,
            hint: `Entrez un nombre entier, ex: 42`,
            value: trimmed,
            line,
          });
        }
        return n;
      }
      case 'reel': {
        const n = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(n)) {
          throw new AlgoRuntimeError({
            message: `Valeur invalide pour '${varName}' (type REEL) : "${trimmed}"`,
            hint: `Entrez un nombre décimal, ex: 3.14`,
            value: trimmed,
            line,
          });
        }
        return n;
      }
      case 'booleen': {
        const low = trimmed.toLowerCase();
        if (low === 'vrai' || low === 'true' || low === '1') return true;
        if (low === 'faux' || low === 'false' || low === '0') return false;
        throw new AlgoRuntimeError({
          message: `Valeur invalide pour '${varName}' (type BOOLEEN) : "${trimmed}"`,
          hint: `Entrez VRAI ou FAUX`,
          value: trimmed,
          line,
        });
      }
      case 'caractere': {
        if (trimmed.length === 0) {
          throw new AlgoRuntimeError({
            message: `Valeur vide pour '${varName}' (type CARACTERE)`,
            hint: `Entrez un seul caractère`,
            line,
          });
        }
        return trimmed[0];
      }
      default:
        return trimmed; // chaine
    }
  }
};

export default ioExecutionMethods;
