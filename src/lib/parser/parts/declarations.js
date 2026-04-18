import typeDeclarationMethods from './declarations/types.js';
import constantDeclarationMethods from './declarations/constants.js';
import variableDeclarationMethods from './declarations/variables.js';

const declarationMethods = Object.assign(
  {},
  typeDeclarationMethods,
  constantDeclarationMethods,
  variableDeclarationMethods,
);

export default declarationMethods;
