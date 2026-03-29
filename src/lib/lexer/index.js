/**
 * index.js  —  Point d'entrée du module lexer
 * ─────────────────────────────────────────────────────────────────────────────
 * Importez tout ce dont vous avez besoin depuis ce fichier unique :
 *
 *   import Lexer, { LexicalError }  from '@/lib/lexer';
 *   import TokenType               from '@/lib/lexer/tokenTypes.js';
 *   import Token                   from '@/lib/lexer/Token.js';
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { default as Lexer }       from './Lexer.js';
export { default as LexicalError } from '../errors/LexicalError.js';
export { default as Token }              from './Token.js';
export { default as TokenType }          from './tokenTypes.js';
export {
  SIMPLE_KEYWORDS,
  COMPOUND_KEYWORDS,
  getBooleanValue,
} from './keywords.js';
