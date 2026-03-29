/**
 * SemanticError.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Erreur produite par le SemanticAnalyzer lors de la vérification sémantique
 * de l'AST (après le parsing).
 *
 * Exemples :
 *  - Variable utilisée sans déclaration : 'x' n'a pas été déclarée
 *  - Variable redéclarée dans le même scope
 *  - Affectation incompatible avec le type déclaré
 *  - Variable de boucle POUR non déclarée
 * ─────────────────────────────────────────────────────────────────────────────
 */

import BaseError from './BaseError.js';

class AlgoSemanticError extends BaseError {
  /**
   * @param {object} params
   * @param {string}  params.message
   * @param {number}  params.line
   * @param {number}  [params.column]
   * @param {string}  [params.value]    - Identifiant ou valeur concerné
   * @param {string}  [params.hint]
   * @param {string}  [params.codeLine]
   */
  constructor({ message, line, column = 0, value = null, hint = null, codeLine = null }) {
    super({
      type: 'semantic',
      message,
      line,
      column,
      value,
      hint,
      codeLine,
    });
    this.name = 'SemanticError';
  }
}

export default AlgoSemanticError;
