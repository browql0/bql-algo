import { NodeType } from '../../parser/AST/nodes.js';

const statementAnalysisMethods = {
  _analyzeBlock(block) {
    if (!block || !block.statements) return;
    for (const stmt of block.statements) {
      // Ignorer les nœuds invalides/null produits par le parser en mode récupération
      if (stmt === null || stmt === undefined) continue;
      this._analyzeStatement(stmt);
    }
  },

  _analyzeStatement(node) {
    if (!node) return;
    switch (node.type) {
      case NodeType.ASSIGN:       return this._analyzeAssign(node);
      case NodeType.ARRAY_ASSIGN: return this._analyzeArrayAssign(node);
      case NodeType.IF:           return this._analyzeIf(node);
      case NodeType.WHILE:        return this._analyzeWhile(node);
      case NodeType.FOR:          return this._analyzeFor(node);
      case NodeType.DO_WHILE:     return this._analyzeDoWhile(node);
      case NodeType.PRINT:        return this._analyzePrint(node);
      case NodeType.INPUT:        return this._analyzeInput(node);
      case NodeType.VAR_DECL:     return this._processDeclarations([node]);
      case NodeType.ARRAY_DECL:   return this._processDeclarations([node]);
      case NodeType.ARRAY_ALLOCATION: return this._analyzeArrayAllocation(node);
      case NodeType.SWITCH:       return this._analyzeSwitch(node);
      default:
        return null;
    }
  }
};

export default statementAnalysisMethods;
