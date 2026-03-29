/**
 * RuntimeError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Erreur produite par l'interpréteur lors de l'exécution du programme.
 *
 * Exemples :
 *  - Division par zéro
 *  - Variable non déclarée
 *  - Type incompatible
 *  - Boucle infinie (maxSteps atteint)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import BaseError from './BaseError.js';

class AlgoRuntimeError extends BaseError {
  /**
   * @param {object} params
   * @param {string}  params.message
   * @param {number}  [params.line]
   * @param {number}  [params.column]
   * @param {string}  [params.value]    - Valeur ayant causé l'erreur
   * @param {string}  [params.hint]     - Conseil de correction
   * @param {string}  [params.codeLine]
   */
  constructor({ message, line = 0, column = 0, value = null, hint = null, codeLine = null }) {
    super({ type: 'runtime', message, line, column, value, hint, codeLine });
    this.name = 'RuntimeError';
  }
}

export default AlgoRuntimeError;
