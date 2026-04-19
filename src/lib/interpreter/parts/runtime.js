import AlgoRuntimeError from '../../errors/RuntimeError.js';

const runtimeMethods = {
  async _reportArrayUpdate(name, action, index, arr, field = null) {
    if (this._onArrayUpdate) {
      // On envoie une copie (objet ou tableau) et les détails de l'action
      const data = (arr !== null && typeof arr === 'object') 
        ?(Array.isArray(arr) ?[...arr] : { ...arr }) 
        : arr;
      await this._onArrayUpdate(name, action, index, data, field);
    }
  },

  _isTruthy(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number')  return val !== 0;
    if (typeof val === 'string')  return val.length > 0;
    return Boolean(val);
  },

  _toNumber(val, line) {
    const n = Number(val);
    if (isNaN(n)) {
      const typeLabel = typeof val === 'string' ?'une CHAINE'
                      : typeof val === 'boolean' ?'un BOOLEEN'
                      : `'${val}'`;
      throw new AlgoRuntimeError({
        message: `Une valeur numérique est attendue, mais reçu ${typeLabel}`,
        value: String(val),
        hint: `Vérifiez que la variable contient bien un nombre avant d'effectuer cette opération.`,
        line,
      });
    }
    return n;
  },

  _stringify(val) {
    if (val === true)  return 'VRAI';
    if (val === false) return 'FAUX';
    if (val === null || val === undefined) return '';
    return String(val);
  },

  _inferType(val) {
    if (typeof val === 'boolean') return 'booleen';
    if (typeof val === 'string')  return 'chaine';
    if (Number.isInteger(val))    return 'entier';
    return 'reel';
  },

  _tick() {
    this._steps++;
    if (this._steps > this.maxSteps) {
      throw new AlgoRuntimeError({
        message: `Boucle infinie détectée — limite de ${this.maxSteps} instructions atteinte`,
        hint: `Vérifiez que la condition de votre boucle finit par devenir fausse.`,
        line: 0,
      });
    }
  }
};

export default runtimeMethods;
