/**
 * index.js — Point d'entrée du module errors
 *
 * Usage :
 *   import { LexicalError, AlgoSyntaxError, AlgoRuntimeError, AlgoSemanticError } from '@/lib/errors';
 *   import { formatError, formatErrorReact, formatErrors }                         from '@/lib/errors';
 *   import { suggest, buildHint, levenshtein }                                     from '@/lib/errors';
 */

export { default as BaseError }          from './BaseError.js';
export { default as LexicalError }       from './LexicalError.js';
export { default as AlgoSyntaxError }    from './SyntaxError.js';
export { default as AlgoRuntimeError }   from './RuntimeError.js';
export { default as AlgoSemanticError }  from './SemanticError.js';

export {
  formatError,
  formatErrors,
  formatErrorReact,
}                                        from './formatError.js';

export {
  suggest,
  buildHint,
  levenshtein,
  ALL_KEYWORDS,
}                                        from './suggest.js';
