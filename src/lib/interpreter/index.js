/**
 * index.js — Point d'entrée du module interpreter
 *
 * Usage :
 *   import { Interpreter, AlgoRuntimeError } from '@/lib/interpreter';
 *   import { Environment }                   from '@/lib/interpreter';
 */
export { default as Interpreter }       from './Interpreter.js';
export { default as Environment }       from './Environment.js';
export { default as AlgoRuntimeError }  from '../errors/RuntimeError.js';
