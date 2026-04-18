import AlgoRuntimeError from '../../errors/RuntimeError.js';
import { NodeType } from '../../parser/AST/nodes.js';

const executionMethods = {
  async _executeBlock(block) {
    for (const stmt of block.statements) {
      await this._execute(stmt);
    }
  },

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
};

export default executionMethods;
