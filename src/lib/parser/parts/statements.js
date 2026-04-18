import blockStatementMethods from './statements/blocks.js';
import assignmentStatementMethods from './statements/assignments.js';
import controlFlowStatementMethods from './statements/controlFlow.js';
import ioStatementMethods from './statements/io.js';

const statementMethods = Object.assign(
  {},
  blockStatementMethods,
  assignmentStatementMethods,
  controlFlowStatementMethods,
  ioStatementMethods,
);

export default statementMethods;
