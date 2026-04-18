import conditionStatementMethods from './controlFlow/conditions.js';
import switchStatementMethods from './controlFlow/switch.js';
import loopStatementMethods from './controlFlow/loops.js';

const controlFlowStatementMethods = Object.assign(
  {},
  conditionStatementMethods,
  switchStatementMethods,
  loopStatementMethods,
);

export default controlFlowStatementMethods;
