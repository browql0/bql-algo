/**
 * executeCode.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pipeline complet d'exécution du pseudo-langage algorithmique marocain.
 *
 * Stratégie NON-BLOQUANTE (comportement de compilateur réel) :
 *
 *   sourceCode
 *     → Lexer              → lexicalErrors[]
 *     → Parser             → syntaxErrors[]  + ast (partiel si erreurs)
 *     → SemanticAnalyzer   → semanticErrors[] (si ast existe, même partiel)
 *     → Interpreter        → runtimeErrors[]  (SEULEMENT si 0 erreur bloquante)
 *
 * Tous les types d'erreurs sont collectés en un seul passage.
 * Aucun return prématuré ne bloque les étapes suivantes.
 *
 * Retourne TOUJOURS :
 * {
 *   success:        boolean,
 *   tokens:         Token[],
 *   ast:            ProgramNode | null,
 *   symbols:        Map,
 *   output:         string[],
 *   memory:         object,
 *
 *   // Erreurs par catégorie (pour un affichage granulaire)
 *   lexicalErrors:  BaseError[],
 *   syntaxErrors:   BaseError[],
 *   semanticErrors: BaseError[],
 *   runtimeErrors:  BaseError[],
 *
 *   // Toutes les erreurs fusionnées et triées par ligne+colonne
 *   errors:         BaseError[],
 *
 *   // Version texte formatée (pour terminal ou logs)
 *   formattedErrors: string,
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Lexer            from './lexer/Lexer.js';
import Parser           from './parser/Parser.js';
import SemanticAnalyzer from './semantic/SemanticAnalyzer.js';
import Interpreter      from './interpreter/Interpreter.js';
import BaseError        from './errors/BaseError.js';
import { formatErrors, formatErrorReact } from './errors/formatError.js';

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exécute du code source BQL et retourne un résultat complet et structuré.
 *
 * @param {string}   sourceCode
 * @param {object}   [options]
 * @param {string[]} [options.inputs]    - Valeurs batch pour les LIRE() (mode test)
 * @param {Function} [options.output]    - Callback streaming : (line: string) => void
 * @param {Function} [options.input]     - Callback async interactif : (varName, type) => Promise<string>
 * @param {number}   [options.maxSteps]  - Limite anti-boucle infinie
 * @param {Function} [options.onArrayUpdate] - Callback pour animation de tableaux : async (name, action, index, values) => void
 * @returns {Promise<object>}
 */
export async function executeCode(
  sourceCode,
  { inputs = [], output = null, input = null, maxSteps = 100_000, onArrayUpdate = null, terminalSpeed = 'instant', onStep = null, onSnapshot = null, waitStep = null } = {}
) {

  // ── Collecte par catégorie ─────────────────────────────────────────────────
  let tokens         = [];
  let ast            = null;
  let symbols        = new Map();
  let outLines       = [];
  let memory         = {};

  let lexicalErrors  = [];
  let syntaxErrors   = [];
  let semanticErrors = [];
  let runtimeErrors  = [];

  // ── Étape 1 : Analyse lexicale ────────────────────────────────────────────
  // Toujours exécutée. Les erreurs lexicales sont collectées mais
  // n'empêchent PAS de tenter les étapes suivantes si des tokens valides existent.
  try {
    const lexer  = new Lexer(sourceCode);
    const result = lexer.tokenize();
    tokens       = result.tokens  ?? [];
    lexicalErrors = (result.errors ?? []).map(e => _normalizeError(e, 'lexical'));
  } catch (err) {
    lexicalErrors = [_wrapUnexpected(err, 'lexical')];
    // Si le lexer crashe complètement, on ne peut pas continuer
    return _buildResult({
      tokens, ast, symbols, output: outLines, memory,
      lexicalErrors, syntaxErrors, semanticErrors, runtimeErrors,
      sourceCode,
    });
  }

  // Arrêt anticipé uniquement si le lexer n'a pas produit le moindre token utilisable
  if (tokens.length === 0) {
    return _buildResult({
      tokens, ast, symbols, output: outLines, memory,
      lexicalErrors, syntaxErrors, semanticErrors, runtimeErrors,
      sourceCode,
    });
  }

  // ── Étape 2 : Analyse syntaxique ──────────────────────────────────────────
  // Toujours exécutée (même s'il y a des erreurs lexicales non fatales).
  // Le parser retourne { ast, errors } sans jamais lever d'exception.
  try {
    const parser = new Parser(tokens, sourceCode);
    const result = parser.parse();   // never throws
    ast          = result.ast;
    syntaxErrors = (result.errors ?? []).map(e => _normalizeError(e, 'syntax'));
  } catch (err) {
    // Crash inattendu dans le parser lui-même
    syntaxErrors = [_wrapUnexpected(err, 'syntax')];
  }

  // ── Étape 3 : Analyse sémantique ─────────────────────────────────────────
  // Exécutée si un AST (même partiel) est disponible.
  // Les erreurs syntaxiques ne bloquent plus l'analyse sémantique.
  if (ast) {
    try {
      const analyzer = new SemanticAnalyzer(sourceCode);
      const result   = analyzer.analyze(ast);
      semanticErrors = (result.errors  ?? []).map(e => _normalizeError(e, 'semantic'));
      symbols        = result.symbols   ?? new Map();
    } catch (err) {
      semanticErrors = [_wrapUnexpected(err, 'semantic')];
    }
  }

  // ── Étape 4 : Interprétation (async) ─────────────────────────────────────
  // Exécutée SEULEMENT si aucune erreur bloquante dans les étapes précédentes.
  // Erreurs bloquantes = toute erreur lex, syntax ou semantic.
  const blockingErrors = [
    ...lexicalErrors,
    ...syntaxErrors,
    ...semanticErrors,
  ];

  if (blockingErrors.length === 0 && ast) {
    try {
      const interpreter = new Interpreter({
        inputs,
        output,   // callback streaming pour ECRIRE (→ terminal React temps réel)
        input,    // callback async pour LIRE (→ attend saisie utilisateur)
        onArrayUpdate, // callback d'animation tableau
        maxSteps,
        terminalSpeed,
        onStep,
        onSnapshot,
        waitStep,
      });
      const { output: out, env } = await interpreter.run(ast);
      outLines = out ?? [];

      for (const [name, entry] of (env?.variables ?? [])) {
        memory[name] = { type: entry.type, value: entry.value };
      }
    } catch (err) {
      runtimeErrors = [err instanceof BaseError ? err : _wrapUnexpected(err, 'runtime')];
    }
  }

  return _buildResult({
    tokens, ast, symbols, output: outLines, memory,
    lexicalErrors, syntaxErrors, semanticErrors, runtimeErrors,
    sourceCode,
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// Helpers publics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convertit un tableau d'erreurs brutes en objets structurés React.
 * Compatible avec ErrorPanel.
 *
 * @param {BaseError[]} errors
 * @param {string}      sourceCode
 * @param {object}      [options]
 * @returns {object[]}
 */
export function getStructuredErrors(errors, sourceCode, options = {}) {
  return errors.map(err => formatErrorReact(err, sourceCode, options));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit l'objet de résultat final standardisé.
 * Fusionne, déduplique et trie toutes les erreurs par ligne puis colonne.
 */
function _buildResult({
  tokens, ast, symbols, output, memory,
  lexicalErrors, syntaxErrors, semanticErrors, runtimeErrors,
  sourceCode,
}) {
  // Fusion de toutes les erreurs
  const allErrors = [
    ...lexicalErrors,
    ...syntaxErrors,
    ...semanticErrors,
    ...runtimeErrors,
  ];

  // Déduplication (même ligne:colonne:message)
  const seen    = new Set();
  const errors  = allErrors.filter(err => {
    const key = `${err.line ?? 0}:${err.column ?? 0}:${err.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Tri par ligne puis colonne
  errors.sort((a, b) => ((a.line ?? 0) - (b.line ?? 0)) || ((a.column ?? 0) - (b.column ?? 0)));

  const success       = errors.length === 0 && output.length >= 0;
  const formattedErrors = formatErrors(errors, sourceCode);

  return {
    // Statut
    success,

    // Données du pipeline
    tokens,
    ast,
    symbols,
    output,
    memory,

    // Erreurs par catégorie (pour affichage granulaire)
    lexicalErrors,
    syntaxErrors,
    semanticErrors,
    runtimeErrors,

    // Toutes les erreurs fusionnées, triées, dédupliquées
    errors,

    // Version texte (pour terminal/console)
    formattedErrors,

    // Rétrocompatibilité : alias vers formattedErrors
    formattedError: formattedErrors,
  };
}

/**
 * S'assure qu'une erreur a bien le bon type déclaré.
 * Ne modifie pas l'erreur si le type est déjà correct.
 */
function _normalizeError(err, expectedType) {
  if (!err) return _wrapUnexpected(new Error('Erreur inconnue'), expectedType);
  // Si l'erreur est une instance de BaseError, son type est déjà défini
  if (err instanceof BaseError) return err;
  // Sinon, wrapper
  return _wrapUnexpected(err, expectedType);
}

/**
 * Enveloppe une erreur JavaScript native en objet compatible avec le système d'erreurs.
 */
function _wrapUnexpected(err, type) {
  if (err instanceof BaseError) return err;
  return {
    type,
    message:  err?.message ?? 'Erreur interne inattendue',
    line:     0,
    column:   0,
    value:    null,
    hint:     'Cette erreur est inattendue. Signalez-la au support technique.',
    codeLine: null,
    name:     'InternalError',
    toJSON()  { return { ...this }; },
  };
}

export default executeCode;
