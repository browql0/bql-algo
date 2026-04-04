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

// ── Signal interne : sortie de boucle ────────────────────────────────────────────
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

    // Table des constantes immuables (réinitialisée à chaque run)
    /** @type {Map<string, { value: *, type: string }>} */
    this._constants = new Map();

    // Vitesse du terminal (Lot 2)
    this._delayMs = terminalSpeed === 'typewriter' ? 150 : (terminalSpeed === 'normal' ? 40 : 0);
  }

  // ── Communication UI ────────────────────────────────────────────────────────
  async _reportArrayUpdate(name, action, index, arr, field = null) {
    if (this._onArrayUpdate) {
      // On envoie une copie (objet ou tableau) et les détails de l'action
      const data = (arr !== null && typeof arr === 'object') 
        ? (Array.isArray(arr) ? [...arr] : { ...arr }) 
        : arr;
      await this._onArrayUpdate(name, action, index, data, field);
    }
  }

  // ── API publique ────────────────────────────────────────────────────────────

  /**
   * Exécute le programme complet (async — supporte LIRE interactif).
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
      case NodeType.ARRAY_ALLOCATION: return this._executeArrayAllocation(node);
      case NodeType.SWITCH:       return this._executeSwitch(node);
      default:
        throw new AlgoRuntimeError({
          message: `Instruction inconnue : '${node.type}'`,
          hint: 'Ce type de nœud n\'est pas pris en charge par l\'interpréteur.',
          line: node.line,
        });
    }
  }

  // ── Déclaration de constantes ──────────────────────────────────────────

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
  }

  // ── Allocation de taille au runtime (après DEBUT) ───────────────

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
  }

  // ── Affectation ─────────────────────────────────────────────────────────────

  async _executeAssign(node) {
    const value = await this._evaluate(node.value);
    
    // Assignation simple compat
    if (!node.target) {
       // Bloquer la modification d'une constante
       const constEntry = this._constants.get(node.name);
       if (constEntry?.immutable) {
          throw new AlgoRuntimeError({
            message: `Impossible de modifier la constante '${node.name}'`,
            value: node.name,
            line: node.line,
          });
       }

       if (!this.env.has(node.name)) {
          const type = this._inferType(value);
          this.env.declare(node.name, type, node.line);
       }
       this.env.set(node.name, value, node.line);
       return;
    }

    await this._setTargetValue(node.target, value);
  }

  /**
   * Assigne une valeur à une cible (IDENTIFIER, ARRAY_ACCESS, MEMBER_ACCESS)
   */
  async _setTargetValue(targetNode, value) {
    if (targetNode.type === NodeType.IDENTIFIER) {
      const name = targetNode.name;
      const constEntry = this._constants.get(name);
      if (constEntry?.immutable) {
         throw new AlgoRuntimeError({ message: `Impossible de modifier '${name}'`, line: targetNode.line });
      }
      this.env.set(name, value, targetNode.line);

      // Détection : si c'est un record (objet), on rapporte l'update
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        await this._reportArrayUpdate(name, 'write', null, value);
      }
    } else if (targetNode.type === NodeType.ARRAY_ACCESS) {
      const arr = this.env.get(targetNode.name, targetNode.line);
      if (!Array.isArray(arr)) {
         throw new AlgoRuntimeError({ message: `'${targetNode.name}' n'est pas un tableau assignable`, line: targetNode.line });
      }
      
      const indices = [];
      for (const idxNode of targetNode.indices) {
         const idxValue = await this._evaluate(idxNode);
         indices.push(Math.floor(this._toNumber(idxValue, targetNode.line)));
      }
      
      if (indices.length === 1) {
         const idx = indices[0];
         if (idx < 0 || idx >= arr.length) throw new AlgoRuntimeError({ message: `Indice hors bornes`, line: targetNode.line });
         arr[idx] = value;
         await this._reportArrayUpdate(targetNode.name, 'write', [idx], arr);
      } else if (indices.length === 2) {
         const row = indices[0];
         const col = indices[1];
         if (row < 0 || row >= arr.length) throw new AlgoRuntimeError({ message: `Ligne hors bornes`, line: targetNode.line });
         if (!Array.isArray(arr[row])) throw new AlgoRuntimeError({ message: `Tableau 1D accédé en 2D`, line: targetNode.line });
         if (col < 0 || col >= arr[row].length) throw new AlgoRuntimeError({ message: `Colonne hors bornes`, line: targetNode.line });
         arr[row][col] = value;
         await this._reportArrayUpdate(targetNode.name, 'write', indices, arr);
      }
    } else if (targetNode.type === NodeType.MEMBER_ACCESS) {
      const obj = await this._evaluate(targetNode.object);
      if (!obj || typeof obj !== 'object') {
         throw new AlgoRuntimeError({ message: `L'objet n'est pas un enregistrement`, line: targetNode.line });
      }
      obj[targetNode.property] = value;

      // Détection : si l'objet fait partie d'un tableau, on notifie la UI du champ précis
      if (targetNode.object.type === NodeType.ARRAY_ACCESS) {
        const arrName = targetNode.object.name;
        const arr = this.env.get(arrName, targetNode.line);
        const indices = [];
        for (const idxNode of targetNode.object.indices) {
          const idxValue = await this._evaluate(idxNode);
          indices.push(Math.floor(this._toNumber(idxValue, targetNode.line)));
        }
        await this._reportArrayUpdate(arrName, 'write', indices, arr, targetNode.property);
      } else if (targetNode.object.type === NodeType.IDENTIFIER) {
        const varName = targetNode.object.name;
        await this._reportArrayUpdate(varName, 'write', null, obj, targetNode.property);
      }
    }
  }

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
          if (arr === null) {
            throw new AlgoRuntimeError({
              message: `tableau '${node.name}' non alloué`,
              line: node.line,
              hint: `Vous devez utiliser 'Tableau ${node.name}[...]' après DEBUT pour allouer le tableau avant d'y accéder.`,
            });
          }
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

      case NodeType.MEMBER_ACCESS: {
        const obj = await this._evaluate(node.object);
        if (!obj || typeof obj !== 'object') {
          throw new AlgoRuntimeError({
            message: `Accès invalide: n'est pas un enregistrement`,
            line: node.line
          });
        }
        return obj[node.property];
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
