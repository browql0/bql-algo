import AlgoRuntimeError from '../../errors/RuntimeError.js';

const controlFlowExecutionMethods = {
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
  },

  async _executeSwitch(node) {
    const switchValue = await this._evaluate(node.expression);

    if (Array.isArray(node.cases)) {
      for (const clause of node.cases) {
        const caseValue = await this._evaluate(clause.value);
        // On compare la valeur finale au cas.
        if (this._equals(switchValue, caseValue, node.expression, clause.value)) {
          await this._executeBlock(clause.body);
          return; // on exécute un seul bloc CAS puis on quitte le SELON
        }
      }
    }

    if (node.defaultBlock) {
      await this._executeBlock(node.defaultBlock);
    }
  },

  async _executeWhile(node) {
    while (this._isTruthy(await this._evaluate(node.condition))) {
      this._tick();
      await this._executeBlock(node.body);
    }
  },

  async _executeFor(node) {
    const from = this._toNumber(await this._evaluate(node.from), node.line);
    const to   = this._toNumber(await this._evaluate(node.to),   node.line);

    // step = null → PAS absent en source → pas implicite officiel de 1
    // step = nœud → PAS valeur écrit explicitement (valeur non nulle)
    let step;
    if (node.step === null) {
      step = 1;
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
  },

  async _executeDoWhile(node) {
    do {
      this._tick();
      await this._executeBlock(node.body);
    } while (!this._isTruthy(await this._evaluate(node.condition)));
  }
};

export default controlFlowExecutionMethods;
