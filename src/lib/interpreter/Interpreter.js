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

    // Vitesse du terminal (Lot 2)
    this._delayMs = terminalSpeed === 'typewriter' ? 150 : (terminalSpeed === 'normal' ? 40 : 0);
  }

  // ── Communication UI ────────────────────────────────────────────────────────
  async _reportArrayUpdate(name, action, index, arr) {
    if (this._onArrayUpdate) {
      // On envoie une copie du tableau et les détails de l'action
      await this._onArrayUpdate(name, action, index, [...arr]);
    }
  }

  // ── API publique ────────────────────────────────────────────────────────────

  /**
   * Exécute le programme complet (async — supporte LIRE interactif).
   * @param {import('../parser/AST/nodes.js').ProgramNode} ast
   * @returns {Promise<{ output: string[], env: Environment }>}
   */
  async run(ast) {
    for (const decl of ast.declarations) {
      await this._executeVarDecl(decl);
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

    // Notification pédagogique (Lot 3)
    if (this._onStep) this._onStep(node.line);
    if (this._onSnapshot) this._onSnapshot(this.env.getAllVariables());
    
    // Pause Pas-à-pas (Lot 3)
    if (this._waitStepFn) {
      await this._waitStepFn();
    }

    switch (node.type) {
      case NodeType.ASSIGN:       return this._executeAssign(node);
      case NodeType.ARRAY_ASSIGN: return this._executeArrayAssign(node);
      case NodeType.IF:           return this._executeIf(node);
      case NodeType.WHILE:        return this._executeWhile(node);
      case NodeType.FOR:          return this._executeFor(node);
      case NodeType.DO_WHILE:     return this._executeDoWhile(node);
      case NodeType.PRINT:        return this._executePrint(node);
      case NodeType.INPUT:        return this._executeInput(node);   // async
      case NodeType.ARRAY_DECL:   return this._executeArrayDecl(node);
      case NodeType.SWITCH:       return this._executeSwitch(node);
      default:
        throw new AlgoRuntimeError({
          message: `Instruction inconnue : '${node.type}'`,
          hint: 'Ce type de nœud n\'est pas pris en charge par l\'interpréteur.',
          line: node.line,
        });
    }
  }

  // ── Déclaration de variables ─────────────────────────────────────────────────

  async _executeVarDecl(node) {
    if (node.type === NodeType.ARRAY_DECL) {
      return await this._executeArrayDecl(node);
    }
    for (const name of node.names) {
      this.env.declare(name, node.varType, node.line);
    }
  }

  async _executeArrayDecl(node) {
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

    // Valeur par défaut selon le type
    let defaultValue = 0;
    if (node.varType === 'chaine')    defaultValue = "";
    if (node.varType === 'caractere') defaultValue = " ";
    if (node.varType === 'booleen')   defaultValue = false;

    let arr;
    if (dimLengths.length === 1) {
      arr = new Array(dimLengths[0]).fill(defaultValue);
    } else if (dimLengths.length === 2) {
      arr = Array.from({ length: dimLengths[0] }, () => new Array(dimLengths[1]).fill(defaultValue));
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

  async _executeArrayAssign(node) {
    const arr = this.env.get(node.name, node.line);
    if (!Array.isArray(arr)) {
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

  // ── Structure SELON ──────────────────────────────────────────────────────────

  async _executeSwitch(node) {
    const switchValue = await this._evaluate(node.expression);

    if (Array.isArray(node.cases)) {
      for (const clause of node.cases) {
        const caseValue = await this._evaluate(clause.value);
        // On compare la valeur finale au cas.
        if (switchValue === caseValue || String(switchValue) === String(caseValue)) {
          await this._executeBlock(clause.body);
          return; // on exécute un seul bloc CAS puis on quitte le SELON
        }
      }
    }

    if (node.defaultBlock) {
      await this._executeBlock(node.defaultBlock);
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
    const from = this._toNumber(await this._evaluate(node.from), node.line);
    const to   = this._toNumber(await this._evaluate(node.to),   node.line);

    // step = null → PAS absent en source → pas implicite de 1
    // step = nœud → PAS valeur écrit explicitement (valeur != 0, != 1)
    let step;
    if (node.step === null) {
      // Pas implicite : direction selon from → to
      // Si from <= to → +1, sinon → -1 (comportement naturel)
      step = from <= to ? 1 : -1;
    } else {
      step = this._toNumber(await this._evaluate(node.step), node.line);
      // Validation runtime pour les pas dynamiques (ex: PAS maVariable)
      if (step === 0) {
        throw new AlgoRuntimeError({
          message: `Le pas de la boucle POUR ne peut pas être 0`,
          hint: `Utilisez un pas non nul, ex : PAS 2 ou PAS -1`,
          line: node.line,
        });
      }
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
    if (this._outputFn) {
      this._outputFn(line);
      // Simuler une vitesse d'affichage (Lot 2)
      if (this._delayMs > 0) {
        await new Promise(r => setTimeout(r, this._delayMs));
      }
    }
  }

  // ── Entrée LIRE ──────────────────────────────────────────────────────────────

  async _executeInput(node) {
    // node.target = nœud AST complet (IdentifierNode ou ArrayAccessNode) — nouveau format
    // node.variable = string du nom de base — rétrocompatibilité
    const target = node.target ?? node.variable;
    let varName;
    let entry;
    let isArrayAccess = false;
    let arr = null;
    let idx = -1;

    if (target && typeof target === 'object' && target.type === NodeType.ARRAY_ACCESS) {
      isArrayAccess = true;
      varName = target.name;
      arr = this.env.get(varName, node.line);
      if (!Array.isArray(arr)) throw new AlgoRuntimeError({ message: `'${varName}' n'est pas un tableau`, line: node.line });
      
      const indices = [];
      for (const idxNode of target.indices) {
        const idxVal = await this._evaluate(idxNode);
        indices.push(Math.floor(this._toNumber(idxVal, node.line)));
      }
      
      if (indices.length === 1) {
        if (indices[0] < 0 || indices[0] >= arr.length) {
          throw new AlgoRuntimeError({ message: `Indice hors bornes : ${indices[0]} (taille: ${arr.length})`, line: node.line });
        }
      } else if (indices.length === 2) {
        if (indices[0] < 0 || indices[0] >= arr.length || !Array.isArray(arr[indices[0]]) || indices[1] < 0 || indices[1] >= arr[indices[0]].length) {
          throw new AlgoRuntimeError({ message: `Indices hors bornes : [${indices[0]}, ${indices[1]}]`, line: node.line });
        }
      }
      idx = indices;
      
      entry = this.env.getEntry(varName, node.line);
    } else {
      // Variable simple (string ou IdentifierNode)
      varName = typeof target === 'object' ? target.name : target;
      if (!this.env.has(varName)) {
        this.env.declare(varName, 'chaine', node.line);
      }
      entry = this.env.getEntry(varName, node.line);
    }

    const type = entry?.type.endsWith('[]') ? entry.type.slice(0, -2) : (entry?.type ?? 'chaine');
    let raw;

    if (this._inputFn) {
      raw = await this._inputFn(varName, type);
    } else if (this._inputs.length > 0) {
      raw = this._inputs.shift();
    } else {
      raw = '';
    }

    const coerced = this._coerceInput(raw, type, varName, node.line);
    
    if (isArrayAccess) {
      if (idx.length === 1) {
        arr[idx[0]] = coerced;
      } else {
        arr[idx[0]][idx[1]] = coerced;
      }
      // Notification suite à saisie clavier
      await this._reportArrayUpdate(varName, 'write', idx, arr);
    } else {
      this.env.set(varName, coerced, node.line);
    }
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

      case NodeType.ARRAY_ACCESS: {
        const arr = this.env.get(node.name, node.line);
        if (!Array.isArray(arr)) {
          throw new AlgoRuntimeError({
            message: `'${node.name}' n'est pas un tableau`,
            line: node.line,
          });
        }
        
        const indices = [];
        for (const idxNode of node.indices) {
          const index = await this._evaluate(idxNode);
          indices.push(Math.floor(this._toNumber(index, node.line)));
        }

        if (indices.length === 1) {
          if (indices[0] < 0 || indices[0] >= arr.length) {
            throw new AlgoRuntimeError({
              message: `Accès hors bornes : ${indices[0]} (taille: ${arr.length})`,
              line: node.line,
              hint: `L'indice doit être compris entre 0 et ${arr.length - 1}.`
            });
          }
          await this._reportArrayUpdate(node.name, 'read', indices, arr);
          return arr[indices[0]];
        } else if (indices.length === 2) {
          if (indices[0] < 0 || indices[0] >= arr.length || !Array.isArray(arr[indices[0]]) || indices[1] < 0 || indices[1] >= arr[indices[0]].length) {
            throw new AlgoRuntimeError({
              message: `Accès hors bornes : [${indices[0]}, ${indices[1]}]`,
              line: node.line
            });
          }
          await this._reportArrayUpdate(node.name, 'read', indices, arr);
          return arr[indices[0]][indices[1]];
        }
      }

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
