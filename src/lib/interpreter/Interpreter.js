/**
 * Interpreter.js  (version async + LIRE interactif)
 * ─────────────────────────────────────────────────────────────────────────────
 * Interpréteur async en mode "tree-walk" pour le pseudo-langage marocain.
 *
 * Nouveauté : LIRE(x) appelle this._inputFn(variable, type) qui retourne
 * une Promise. L'interpréteur await cette promise → le programme se suspend
 * jusqu'à ce que React fournisse la valeur saisie par l'utilisateur.
 *
 * Usage :
 *   const interp = new Interpreter({
 *     output: (line) => setLines(prev => [...prev, line]),
 *     input:  async (varName, type) => { ... retourne la valeur ... }
 *   });
 *   const result = await interp.run(ast);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AlgoRuntimeError from '../errors/RuntimeError.js';
import Environment      from './Environment.js';
import { NodeType }     from '../parser/AST/nodes.js';

// ── Signal interne : sortie de boucle ─────────────────────────────────────────
class BreakSignal {}

// ── Interpréteur ──────────────────────────────────────────────────────────────
class Interpreter {
  /**
   * @param {object}   options
   * @param {Function} [options.output]   - Callback appelé pour chaque ECRIRE()
   *                                        Signature : (line: string) => void
   * @param {Function} [options.input]    - Callback async pour LIRE()
   *                                        Signature : (varName: string, type: string) => Promise<string>
   * @param {string[]} [options.inputs]   - Valeurs mockées pour les tests batch (legacy)
   * @param {number}   [options.maxSteps] - Garde-fou anti-boucle infinie
   */
  constructor({ output = null, input = null, inputs = [], maxSteps = 100_000 } = {}) {
    // Mode interactif (React) : callbacks fournis
    this._outputFn = output;
    this._inputFn  = input;

    // Mode batch (tests) : tableau de valeurs prédéfinies (legacy)
    this._inputs   = [...inputs];

    this.output    = [];          // sortie collectée (accès externe)
    this.maxSteps  = maxSteps;
    this._steps    = 0;
    this.env       = new Environment();
  }

  // ── API publique ────────────────────────────────────────────────────────────

  /**
   * Exécute le programme complet (async — supporte LIRE interactif).
   * @param {import('../parser/AST/nodes.js').ProgramNode} ast
   * @returns {Promise<{ output: string[], env: Environment }>}
   */
  async run(ast) {
    for (const decl of ast.declarations) {
      this._executeVarDecl(decl);
    }
    await this._executeBlock(ast.body);
    return { output: this.output, env: this.env };
  }

  // ── Exécution de blocs et instructions ──────────────────────────────────────

  async _executeBlock(block) {
    for (const stmt of block.statements) {
      await this._execute(stmt);
    }
  }

  async _execute(node) {
    this._tick();

    switch (node.type) {
      case NodeType.VAR_DECL:   return this._executeVarDecl(node);
      case NodeType.ASSIGN:     return this._executeAssign(node);
      case NodeType.IF:         return this._executeIf(node);
      case NodeType.WHILE:      return this._executeWhile(node);
      case NodeType.FOR:        return this._executeFor(node);
      case NodeType.DO_WHILE:   return this._executeDoWhile(node);
      case NodeType.PRINT:      return this._executePrint(node);
      case NodeType.INPUT:      return this._executeInput(node);   // async
      default:
        throw new AlgoRuntimeError({
          message: `Instruction inconnue : '${node.type}'`,
          hint: 'Ce type de nœud n\'est pas pris en charge par l\'interpréteur.',
          line: node.line,
        });
    }
  }

  // ── Déclaration de variables ─────────────────────────────────────────────────

  _executeVarDecl(node) {
    for (const name of node.names) {
      this.env.declare(name, node.varType, node.line);
    }
  }

  // ── Affectation ─────────────────────────────────────────────────────────────

  async _executeAssign(node) {
    const value = await this._evaluate(node.value);
    if (!this.env.has(node.name)) {
      const type = this._inferType(value);
      this.env.declare(node.name, type, node.line);
    }
    this.env.set(node.name, value, node.line);
  }

  // ── Condition ────────────────────────────────────────────────────────────────

  async _executeIf(node) {
    if (this._isTruthy(await this._evaluate(node.condition))) {
      await this._executeBlock(node.thenBlock);
      return;
    }
    for (const clause of node.elseifClauses) {
      if (this._isTruthy(await this._evaluate(clause.condition))) {
        await this._executeBlock(clause.block);
        return;
      }
    }
    if (node.elseBlock) {
      await this._executeBlock(node.elseBlock);
    }
  }

  // ── Boucle TANTQUE ───────────────────────────────────────────────────────────

  async _executeWhile(node) {
    while (this._isTruthy(await this._evaluate(node.condition))) {
      this._tick();
      await this._executeBlock(node.body);
    }
  }

  // ── Boucle POUR ─────────────────────────────────────────────────────────────

  async _executeFor(node) {
    let from    = this._toNumber(await this._evaluate(node.from), node.line);
    const to    = this._toNumber(await this._evaluate(node.to),   node.line);
    const step  = this._toNumber(await this._evaluate(node.step), node.line);

    if (step === 0) {
      throw new AlgoRuntimeError({
        message: `Le pas de la boucle POUR ne peut pas être 0`,
        hint: `Utilisez un pas différent de zéro, ex: POUR i DE 1 A 10 PAS 1`,
        line: node.line,
      });
    }

    if (!this.env.has(node.variable)) {
      this.env.declare(node.variable, 'entier', node.line);
    }
    this.env.set(node.variable, from, node.line);

    const condition = () => {
      const cur = this._toNumber(this.env.get(node.variable, node.line));
      return step > 0 ? cur <= to : cur >= to;
    };

    while (condition()) {
      this._tick();
      await this._executeBlock(node.body);
      const cur = this._toNumber(this.env.get(node.variable, node.line));
      this.env.set(node.variable, cur + step, node.line);
    }
  }

  // ── Boucle REPETER ───────────────────────────────────────────────────────────

  async _executeDoWhile(node) {
    do {
      this._tick();
      await this._executeBlock(node.body);
    } while (!this._isTruthy(await this._evaluate(node.condition)));
  }

  // ── Sortie ECRIRE ─────────────────────────────────────────────────────────────

  async _executePrint(node) {
    const parts = await Promise.all(
      node.args.map(arg => this._evaluate(arg).then(v => this._stringify(v)))
    );
    const line = parts.join('');
    this.output.push(line);
    // Appeler le callback React immédiatement (streaming du terminal)
    if (this._outputFn) this._outputFn(line);
  }

  // ── Entrée LIRE ──────────────────────────────────────────────────────────────

  async _executeInput(node) {
    const varName = node.variable;
    const entry   = this.env.has(varName)
      ? this.env.getEntry(varName, node.line)
      : null;
    const type = entry?.type ?? 'chaine';

    let raw;

    if (this._inputFn) {
      // ── Mode interactif React : on attend que l'utilisateur saisisse ──────
      raw = await this._inputFn(varName, type);
    } else if (this._inputs.length > 0) {
      // ── Mode batch (tests) : consommer la valeur pré-fournie ─────────────
      raw = this._inputs.shift();
    } else {
      // ── Aucune source d'input : valeur vide avec avertissement ────────────
      raw = '';
      const msg = `[LIRE] Aucune valeur fournie pour '${varName}' — utilisation de '' par défaut`;
      this.output.push(msg);
      if (this._outputFn) this._outputFn(msg);
    }

    if (!this.env.has(varName)) {
      this.env.declare(varName, type, node.line);
    }

    // ── Conversion selon le type déclaré ─────────────────────────────────────
    const coerced = this._coerceInput(raw, type, varName, node.line);
    this.env.set(varName, coerced, node.line);
  }

  /**
   * Convertit la chaîne saisie vers le type attendu.
   * Lance une RuntimeError si la valeur est incompatible.
   */
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Évaluation des expressions
  // ═══════════════════════════════════════════════════════════════════════════

  async _evaluate(node) {
    switch (node.type) {
      case NodeType.NUMBER:    return node.value;
      case NodeType.STRING:    return node.value;
      case NodeType.CHAR:      return node.value;
      case NodeType.BOOLEAN:   return node.value;

      case NodeType.IDENTIFIER:
        return this.env.get(node.name, node.line);

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
  }

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
  }

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
      case '%': {
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

      case '=':  return left === right || String(left) === String(right);
      case '!=': return left !== right;
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
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _isTruthy(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number')  return val !== 0;
    if (typeof val === 'string')  return val.length > 0;
    return Boolean(val);
  }

  _toNumber(val, line) {
    const n = Number(val);
    if (isNaN(n)) {
      const typeLabel = typeof val === 'string' ? 'une CHAINE'
                      : typeof val === 'boolean' ? 'un BOOLEEN'
                      : `'${val}'`;
      throw new AlgoRuntimeError({
        message: `Une valeur numérique est attendue, mais reçu ${typeLabel}`,
        value: String(val),
        hint: `Vérifiez que la variable contient bien un nombre avant d'effectuer cette opération.`,
        line,
      });
    }
    return n;
  }

  _stringify(val) {
    if (val === true)  return 'VRAI';
    if (val === false) return 'FAUX';
    if (val === null || val === undefined) return '';
    return String(val);
  }

  _inferType(val) {
    if (typeof val === 'boolean') return 'booleen';
    if (typeof val === 'string')  return 'chaine';
    if (Number.isInteger(val))    return 'entier';
    return 'reel';
  }

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
}

export default Interpreter;
