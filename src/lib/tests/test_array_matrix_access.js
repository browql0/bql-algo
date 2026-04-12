/**
 * test_array_matrix_access.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests unitaires pour valider la gestion AST / Parser / Sémantique des
 * accès indexés en BQL (Tableaux 1D et Matrices 2D).
 *
 * Cas testés :
 *   Valides   → LIRE(x), LIRE(notes[i]), LIRE(M[i, j]),
 *               notes[i] <- 3;  M[i, j] <- 9;
 *   Invalides → LIRE(notes), LIRE(M), notes <- 3, M <- 9, M[i][j]
 *
 * Exécution : node src/lib/tests/test_array_matrix_access.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Parser } from '../parser/index.js';
import Lexer from '../lexer/Lexer.js';
import SemanticAnalyzer from '../semantic/SemanticAnalyzer.js';
import { NodeType } from '../parser/AST/nodes.js';

// ── Couleurs console ──────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;

// ── Utilitaires ───────────────────────────────────────────────────────────────

function wrap(body, extraVars = '') {
  return `ALGORITHME_Test;
VARIABLES
  x : ENTIER;
  i : ENTIER;
  j : ENTIER;
  Tableau notes[3] : REEL;
  Tableau M[3, 3] : ENTIER;
${extraVars}
DEBUT
i <- 0;
j <- 0;
x <- 0;
${body}
FIN`;
}

function parseAndAnalyze(code) {
  const lexer = new Lexer(code);
  const { tokens } = lexer.tokenize();
  const parser = new Parser(tokens, code);
  const { ast, errors: parseErrors } = parser.parse();
  if (!ast) return { parseErrors, semanticErrors: [] };
  const analyzer = new SemanticAnalyzer(code);
  const { errors: semanticErrors } = analyzer.analyze(ast);
  return { ast, parseErrors, semanticErrors };
}

function assert(label, condition, details = '') {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${label}`);
    passed++;
  } else {
    console.log(`  ${RED}✗ FAIL${RESET} ${label}`);
    if (details) console.log(`    ${YELLOW}→ ${details}${RESET}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${CYAN}${BOLD}${'─'.repeat(60)}${RESET}`);
  console.log(`${CYAN}${BOLD}  ${title}${RESET}`);
  console.log(`${CYAN}${BOLD}${'─'.repeat(60)}${RESET}`);
}

// ── SECTION 1: CAS VALIDES ────────────────────────────────────────────────────

section('1. Cas valides — Parser produit les bons nœuds AST');

// LIRE(x) → InputNode → IdentifierNode
{
  const { ast, parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(x);'));
  const inputStmt = ast?.body?.statements?.[3]; // After 3 initializations
  assert(
    'LIRE(x) produit un InputNode avec target = IdentifierNode',
    inputStmt?.type === NodeType.INPUT && inputStmt?.target?.type === NodeType.IDENTIFIER,
    `Got type=${inputStmt?.type}, target.type=${inputStmt?.target?.type}`
  );
  assert(
    'LIRE(x) : pas d\'erreur de parsing',
    parseErrors.length === 0,
    parseErrors.map(e => e.message).join('; ')
  );
  assert(
    'LIRE(x) : pas d\'erreur sémantique',
    semanticErrors.length === 0,
    semanticErrors.map(e => e.message).join('; ')
  );
}

// LIRE(notes[i]) → InputNode → ArrayAccessNode  ← BUG PRÉCÉDENT
{
  const { ast, parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(notes[i]);'));
  const inputStmt = ast?.body?.statements?.[3];
  assert(
    'LIRE(notes[i]) produit un InputNode avec target = ArrayAccessNode',
    inputStmt?.type === NodeType.INPUT && inputStmt?.target?.type === NodeType.ARRAY_ACCESS,
    `Got type=${inputStmt?.type}, target.type=${inputStmt?.target?.type} — BUG DÉTECTÉ si IDENTIFIER`
  );
  assert(
    'LIRE(notes[i]) : ArrayAccessNode.name === "notes"',
    inputStmt?.target?.name === 'notes',
    `Got name=${inputStmt?.target?.name}`
  );
  assert(
    'LIRE(notes[i]) : 1 seul indice',
    inputStmt?.target?.indices?.length === 1,
    `Got ${inputStmt?.target?.indices?.length} indices`
  );
  assert(
    'LIRE(notes[i]) : pas d\'erreur de parsing',
    parseErrors.length === 0,
    parseErrors.map(e => e.message).join('; ')
  );
  assert(
    'LIRE(notes[i]) : pas d\'erreur sémantique',
    semanticErrors.length === 0,
    semanticErrors.map(e => e.message).join('; ')
  );
}

// LIRE(M[i, j]) → InputNode → ArrayAccessNode avec 2 indices
{
  const { ast, parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(M[i, j]);'));
  const inputStmt = ast?.body?.statements?.[3];
  assert(
    'LIRE(M[i, j]) produit un InputNode avec target = ArrayAccessNode',
    inputStmt?.type === NodeType.INPUT && inputStmt?.target?.type === NodeType.ARRAY_ACCESS,
    `Got target.type=${inputStmt?.target?.type}`
  );
  assert(
    'LIRE(M[i, j]) : 2 indices',
    inputStmt?.target?.indices?.length === 2,
    `Got ${inputStmt?.target?.indices?.length} indices`
  );
  assert(
    'LIRE(M[i, j]) : pas d\'erreur',
    parseErrors.length === 0 && semanticErrors.length === 0,
    [...parseErrors, ...semanticErrors].map(e => e.message).join('; ')
  );
}

// notes[i] <- 3 → AssignNode avec ArrayAccessNode target
{
  const { ast, parseErrors, semanticErrors } = parseAndAnalyze(wrap('notes[0] <- 10;'));
  const stmt = ast?.body?.statements?.[3];
  assert(
    'notes[0] <- 10 produit un AssignNode avec target ArrayAccessNode',
    stmt?.type === NodeType.ASSIGN && stmt?.target?.type === NodeType.ARRAY_ACCESS,
    `Got type=${stmt?.type}, target=${stmt?.target?.type}`
  );
  assert(
    'notes[0] <- 10 : pas d\'erreur',
    parseErrors.length === 0 && semanticErrors.length === 0,
    [...parseErrors, ...semanticErrors].map(e => e.message).join('; ')
  );
}

// M[i, j] <- 9 → AssignNode avec ArrayAccessNode target 2 indices
{
  const { ast, parseErrors, semanticErrors } = parseAndAnalyze(wrap('M[0, 1] <- 9;'));
  const stmt = ast?.body?.statements?.[3];
  assert(
    'M[0, 1] <- 9 produit un AssignNode avec target ArrayAccessNode',
    stmt?.type === NodeType.ASSIGN && stmt?.target?.type === NodeType.ARRAY_ACCESS,
    `Got type=${stmt?.type}, target=${stmt?.target?.type}`
  );
  assert(
    'M[0, 1] <- 9 : 2 indices',
    stmt?.target?.indices?.length === 2,
    `Got ${stmt?.target?.indices?.length} indices`
  );
  assert(
    'M[0, 1] <- 9 : pas d\'erreur',
    parseErrors.length === 0 && semanticErrors.length === 0,
    [...parseErrors, ...semanticErrors].map(e => e.message).join('; ')
  );
}

// ── SECTION 2: CAS INVALIDES ──────────────────────────────────────────────────

section('2. Cas invalides — Erreurs pédagogiques attendues');

// LIRE(notes) → erreur : tableau sans indice
{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(notes);'));
  const allErrors = [...parseErrors, ...semanticErrors];
  const hasArrayError = allErrors.some(e =>
    e.message.includes('tableau') && (e.message.includes('entier') || e.message.includes('Impossible'))
  );
  assert(
    'LIRE(notes) → erreur sémantique "tableau sans indice"',
    hasArrayError,
    `Errors: [${allErrors.map(e => e.message).join(' | ')}]`
  );
  const hasHint = allErrors.some(e => e.hint && e.hint.includes('notes['));
  assert(
    'LIRE(notes) → hint contient "notes[i]"',
    hasHint,
    `Hints: [${allErrors.map(e => e.hint).join(' | ')}]`
  );
}

// LIRE(M) → erreur : matrice sans indice
{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(M);'));
  const allErrors = [...parseErrors, ...semanticErrors];
  const hasMatrixError = allErrors.some(e =>
    e.message.includes('matrice') || (e.message.includes('tableau') && e.message.includes('M'))
  );
  assert(
    'LIRE(M) → erreur sémantique "matrice sans indice"',
    hasMatrixError,
    `Errors: [${allErrors.map(e => e.message).join(' | ')}]`
  );
}

// notes <- 3 → erreur : affectation tableau
{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('notes <- 3;'));
  const allErrors = [...parseErrors, ...semanticErrors];
  const hasError = allErrors.some(e =>
    e.message.includes('Affectation invalide') || e.message.includes('tableau')
  );
  assert(
    'notes <- 3 → erreur "affectation invalide"',
    hasError,
    `Errors: [${allErrors.map(e => e.message).join(' | ')}]`
  );
}

// M <- 9 → erreur : affectation matrice
{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('M <- 9;'));
  const allErrors = [...parseErrors, ...semanticErrors];
  const hasError = allErrors.some(e =>
    e.message.includes('Affectation invalide') || e.message.includes('tableau')
  );
  assert(
    'M <- 9 → erreur "affectation invalide"',
    hasError,
    `Errors: [${allErrors.map(e => e.message).join(' | ')}]`
  );
}

// M[i][j] → erreur : syntaxe BQL incorrecte
{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('LIRE(M[i][j]);'));
  const allErrors = [...parseErrors, ...semanticErrors];
  const hasSyntaxError = allErrors.some(e =>
    e.message.includes('BQL') || e.message.includes('[...][...]') || e.message.includes('incorrecte')
  );
  assert(
    'LIRE(M[i][j]) → erreur syntaxe BQL "M[i, j]"',
    hasSyntaxError,
    `Errors: [${allErrors.map(e => e.message).join(' | ')}]`
  );
  const hasHint = allErrors.some(e => e.hint && e.hint.includes('[..., ...]'));
  assert(
    'LIRE(M[i][j]) → hint mentionne la syntaxe correcte',
    hasHint,
    `Hints: [${allErrors.map(e => e.hint).join(' | ')}]`
  );
}

// ── SECTION 3: Expressions complexes dans les indices ─────────────────────────

section('3. Expressions complexes dans les indices');

{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('notes[i + 1] <- 5;'));
  assert(
    'notes[i + 1] <- 5 : pas d\'erreur de parsing',
    parseErrors.length === 0,
    parseErrors.map(e => e.message).join('; ')
  );
}

{
  const { parseErrors, semanticErrors } = parseAndAnalyze(wrap('M[i, j - 1] <- 7;'));
  assert(
    'M[i, j - 1] <- 7 : pas d\'erreur de parsing',
    parseErrors.length === 0,
    parseErrors.map(e => e.message).join('; ')
  );
}

// ── RÉSUMÉ ────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`${BOLD}Résultats : ${GREEN}${passed} passés${RESET}${BOLD}, ${passed + failed} total${RESET}`);
if (failed > 0) {
  console.log(`${RED}${BOLD}${failed} test(s) échoué(s) — corrections nécessaires${RESET}`);
} else {
  console.log(`${GREEN}${BOLD}✅ Tous les tests sont passés !${RESET}`);
}
console.log('─'.repeat(60));

process.exit(failed > 0 ? 1 : 0);
