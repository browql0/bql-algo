/**
 * Environment.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestion de la mémoire (portée / scope) des variables durant l'exécution.
 *
 * Chaque variable est stockée sous la forme :
 *   { type: 'entier' | 'reel' | 'chaine' | 'caractere' | 'booleen',
 *     value: <valeur JS> }
 *
 * La chaîne de portées (parent) permet de supporter les blocs imbriqués
 * ou futures fonctions sans modifier cette classe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AlgoRuntimeError from '../errors/RuntimeError.js';

// ── Valeurs par défaut selon le type ──────────────────────────────────────────
const DEFAULT_VALUES = {
  entier:    0,
  reel:      0.0,
  chaine:    '',
  caractere: '',
  booleen:   false,
};

// ── Classe Environment ────────────────────────────────────────────────────────
class Environment {
  /**
   * @param {Environment|null} parent - Portée parente (null pour la portée globale)
   */
  constructor(parent = null) {
    this.parent    = parent;
    /** @type {Map<string, {type: string, value: *}>} */
    this.variables = new Map();
    this.constantes = new Map();
    this.customTypes = new Map();
  }

  // ── Types structurés ──────────────────────────────────────────────────────────

  /**
   * Déclare un type structuré (enregistrement)
   * @param {string} name
   * @param {Object} fields - { champ1: 'entier', champ2: 'chaine' }
   */
  declareCustomType(name, fields) {
    this.customTypes.set(name, fields);
  }

  /**
   * Récupère la valeur par défaut pour un type
   */
  getDefaultValue(type, line) {
    if (type.endsWith('[]')) return [];
    if (DEFAULT_VALUES.hasOwnProperty(type)) return DEFAULT_VALUES[type];
    
    // Si c'est un type structuré, on instancie un objet contenant chaque champ
    const customTypeStr = this.customTypes.get(type);
    if (!customTypeStr && this.parent) {
       return this.parent.getDefaultValue(type, line);
    }
    if (customTypeStr) {
      const obj = {};
      for (const [fName, fType] of Object.entries(customTypeStr)) {
        obj[fName] = this.getDefaultValue(fType, line);
      }
      return obj;
    }
    
    throw new AlgoRuntimeError({ message: `Type inconnu : '${type}'`, line });
  }

  // ── Déclaration ─────────────────────────────────────────────────────────────

  /**
   * Déclare une nouvelle constante dans cette portée.
   * @param {string} name
   * @param {string} type
   * @param {*} value
   * @param {number} [line]
   */
  declareConst(name, type, value, line) {
    this.constantes.set(name, { type, value, immutable: true });
  }

  /**
   * Déclare une nouvelle variable dans cette portée.
   * Initialise avec la valeur par défaut du type.
   * @param {string} name
   * @param {string} type - 'entier' | 'reel' | 'chaine' | 'caractere' | 'booleen'
   * @param {number} [line]
   */
  declare(name, type, line) {
    const isArray = type.endsWith('[]');
    const baseType = isArray ? type.slice(0, -2) : type;

    // S'assurer que le type existe (natif ou custom)
    const defaultValue = isArray ? [] : this.getDefaultValue(type, line);
    
    this.variables.set(name, { 
      type, 
      value: defaultValue 
    });
  }

  // ── Lecture ─────────────────────────────────────────────────────────────────

  /**
   * Lit la valeur d'une variable (cherche dans la chaîne de portées).
   * @param {string} name
   * @param {number} [line]
   * @returns {*}
   */
  get(name, line) {
    const env = this._resolve(name);
    if (!env) {
      throw new AlgoRuntimeError({
        message: `Identifiant '${name}' non déclaré`,
        value: name,
        hint: `Déclarez '${name}' avant de l'utiliser.`,
        line
      });
    }
    if (env.constantes.has(name)) return env.constantes.get(name).value;
    return env.variables.get(name).value;
  }

  /**
   * Retourne l'entrée complète {type, value} d'une variable.
   * @param {string} name
   * @param {number} [line]
   */
  getEntry(name, line) {
    const env = this._resolve(name);
    if (!env) {
      throw new AlgoRuntimeError({
        message: `Identifiant '${name}' non déclaré`,
        value: name,
        hint: `Déclarez '${name}' avant de l'utiliser.`,
        line
      });
    }
    if (env.constantes.has(name)) return env.constantes.get(name);
    return env.variables.get(name);
  }

  // ── Écriture ─────────────────────────────────────────────────────────────────

  /**
   * Met à jour la valeur d'une variable déjà déclarée.
   * La conversion de type est appliquée automatiquement.
   * @param {string} name
   * @param {*}      value
   * @param {number} [line]
   */
  set(name, value, line) {
    const env = this._resolve(name);
    if (!env) {
      throw new AlgoRuntimeError({
        message: `Identifiant '${name}' non déclaré`,
        value: name,
        hint: `Déclarez '${name}' avant de l'utiliser.`,
        line
      });
    }
    if (env.constantes.has(name)) {
      throw new AlgoRuntimeError({
        message: `Impossible de modifier la constante '${name}'`,
        value: name,
        line
      });
    }
    const entry      = env.variables.get(name);
    entry.value      = this._coerce(value, entry.type, name, line);
    env.variables.set(name, entry);
  }

  /**
   * Affecte directement sans chercher dans la chaîne — utile pour la variable
   * de contrôle d'une boucle POUR déclarée implicitement.
   */
  setLocal(name, type, value) {
    if (!this.variables.has(name)) {
      this.variables.set(name, { type, value });
    } else {
      this.variables.get(name).value = value;
    }
  }

  // ── Existence ────────────────────────────────────────────────────────────────

  /** Vrai si `name` existe dans cette portée ou une portée parente. */
  has(name) { return !!this._resolve(name); }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Cherche l'environment qui contient `name`. */
  _resolve(name) {
    if (this.variables.has(name) || this.constantes.has(name)) return this;
    if (this.parent) return this.parent._resolve(name);
    return null;
  }

  /**
   * Extrait toutes les variables visibles depuis cette portée (inclut parents).
   * Utile pour la visualisation en direct (Lot 3).
   */
  getAllVariables() {
    const all = this.parent ? this.parent.getAllVariables() : {};
    for (const [name, entry] of this.variables) {
      all[name] = { ...entry }; // Copie superficielle
    }
    for (const [name, entry] of this.constantes) {
      all[name] = { ...entry }; // Copie superficielle
    }
    return all;
  }

  /**
   * Coerce `value` vers le type attendu.
   * Génère une erreur si la conversion n'est pas possible.
   */
  _coerce(value, type, name, line) {
    switch (type) {
      case 'entier': {
        if (typeof value === 'boolean') return value ? 1 : 0;
        const int = parseInt(value, 10);
        if (isNaN(int)) throw new AlgoRuntimeError({
          message: `Impossible d'affecter "${value}" à la variable entière '${name}' — une valeur entière est attendue`,
          value: String(value),
          hint: `Vérifiez que la valeur calculée est bien un nombre entier.`,
          line
        });
        return int;
      }

      case 'reel': {
        if (typeof value === 'boolean') return value ? 1.0 : 0.0;
        const float = parseFloat(value);
        if (isNaN(float)) throw new AlgoRuntimeError({
          message: `Impossible d'affecter "${value}" à la variable réelle '${name}' — un nombre décimal est attendu`,
          value: String(value),
          hint: `Vérifiez que la valeur calculée est bien un nombre (ex: 3.14).`,
          line
        });
        return float;
      }

      case 'chaine':
        return String(value);

      case 'caractere':
        const str = String(value);
        return str.length > 0 ? str[0] : '';

      case 'booleen':
        if (typeof value === 'boolean') return value;
        if (value === 'VRAI' || value === 'vrai') return true;
        if (value === 'FAUX' || value === 'faux') return false;
        return Boolean(value);

      default:
        // Pour les tableaux (ex: entier[]), on accepte l'objet array tel quel
        if (type.endsWith('[]') && Array.isArray(value)) {
          return value;
        }
        return value;
    }
  }
}

export default Environment;
