/**
 * index.js — Point d'entrée du module parser
 *
 * Usage :
 *   import { Parser, AlgoSyntaxError }                from '@/lib/parser';
 *   import { ProgramNode, BlockNode, NodeType }   from '@/lib/parser';
 */
export { default as Parser }             from './Parser.js';
export { default as AlgoSyntaxError }    from '../errors/SyntaxError.js';
export { NodeType,
  ProgramNode, BlockNode, VarDeclNode,
  NumberNode, StringNode, CharNode, BooleanNode, IdentifierNode,
  BinaryOpNode, UnaryOpNode,
  AssignNode, IfNode, WhileNode, ForNode, DoWhileNode,
  PrintNode, InputNode,
} from './AST/nodes.js';
