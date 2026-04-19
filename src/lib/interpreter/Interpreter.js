/**
 * Interpreter.js  (version async + LIRE interactif)
 * -----------------------------------------------------------------------------
 * Interprêteur async en mode "tree-walk" pour le pseudo-langage marocain.
 *
 * Nouveaut? : LIRE(x) appelle this._inputFn(variable, type) qui retourne
 * une Promise. L'interprêteur await cette promise ? le programme se suspend
 * jusqu'à ce que React fournisse la valeur saisie par l'utilisateur.
 *
 * Usage :
 *   const interp = new Interpreter({
 *     output: (line) => setLines(prev => [...prev, line]),
 *     input:  async (varName, type) => { ... retourne la valeur ... }
 *   });
 *   const result = await interp.run(ast);
 * -----------------------------------------------------------------------------
 */

import Environment from './Environment.js';
import runtimeMethods from './parts/runtime.js';
import executionMethods from './parts/execution.js';
import declarationExecutionMethods from './parts/declarations.js';
import arrayExecutionMethods from './parts/arrays.js';
import assignmentExecutionMethods from './parts/assignments.js';
import controlFlowExecutionMethods from './parts/controlFlow.js';
import ioExecutionMethods from './parts/io.js';
import expressionEvaluationMethods from './parts/expressions.js';


// -- Interprêteur --------------------------------------------------------------
class Interpreter {
  /**
   * @param {object}   options
   * @param {Function} [options.output]   - Callback appel? pour chaque ECRIRE()
   *                                        Signature : (line: string) => void
   * @param {Function} [options.input]    - Callback async pour LIRE()
   *                                        Signature : (varName: string, type: string) => Promise<string>
   * @param {string[]} [options.inputs]   - Valeurs mockées pour les tests batch (legacy)
   * @param {number}   [options.maxSteps] - Garde-fou anti-boucle infinie
   * @param {Function} [options.onArrayUpdate] - Callback animation tableaux (name, action, index, arr)
   */
  constructor({ output = null, input = null, inputs = [], maxSteps = 100_000, onArrayUpdate = null, terminalSpeed = 'instant', onStep = null, onSnapshot = null, waitStep = null } = {}) {
    // Mode interactif (React) : callbacks fournis
    this._outputFn = output;
    this._inputFn  = input;
    this._onArrayUpdate = onArrayUpdate;
    this._onStep = onStep;
    this._onSnapshot = onSnapshot;
    this._waitStepFn = waitStep;

    // Mode batch (tests) : tableau de valeurs prédéfinies (legacy)
    this._inputs   = [...inputs];

    this.output    = [];          // sortie collectée (accès externe)
    this.maxSteps  = maxSteps;
    this._steps    = 0;
    this.env       = new Environment();

    // Table des constantes immuables (réinitialisée à chaque run)
    /** @type {Map<string, { value: *, type: string }>} */
    this._constants = new Map();

    // Vitesse du terminal (Lot 2)
    this._delayMs = terminalSpeed === 'typewriter' ?150 : (terminalSpeed === 'normal' ?40 : 0);
  }

  // -- API publique ------------------------------------------------------------

  /**
   * Exécute le programme complet (async ? supporte LIRE interactif).
   * @param {import('../parser/AST/nodes.js').ProgramNode} ast
   * @returns {Promise<{ output: string[], env: Environment }>}
   */
  async run(ast) {
    if (!ast) return { output: this.output, env: this.env };

    // 0. Types structurés
    if (Array.isArray(ast.customTypes)) {
      for (const t of ast.customTypes) {
        const fieldsObj = {};
        for (const f of t.fields) {
           fieldsObj[f.name] = f.varType;
        }
        this.env.declareCustomType(t.name, fieldsObj);
      }
    }

    // 1. Constantes (immuables, évaluées statiquement)
    if (ast.constants) {
      for (const decl of ast.constants) {
        await this._executeConstDecl(decl);
      }
    }
    // 2. Variables
    for (const decl of ast.declarations) {
      await this._executeVarDecl(decl);
    }
    // 3. Corps principal
    await this._executeBlock(ast.body);
    return { output: this.output, env: this.env };
  }

}

Object.assign(
  Interpreter.prototype,
  runtimeMethods,
  executionMethods,
  declarationExecutionMethods,
  arrayExecutionMethods,
  assignmentExecutionMethods,
  controlFlowExecutionMethods,
  ioExecutionMethods,
  expressionEvaluationMethods,
);

export default Interpreter;

