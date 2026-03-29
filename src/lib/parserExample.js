/**
 * parserExample.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Démonstration complète de la chaîne :
 *   Code source  →  Lexer  →  Tokens  →  Parser  →  AST  →  Interpréteur  →  Output
 *
 * Compatible React (importable dans n'importe quel composant).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Lexer        from './lexer/Lexer.js';
import Parser       from './parser/Parser.js';
import Interpreter  from './interpreter/Interpreter.js';

// ── Programme exemple ─────────────────────────────────────────────────────────
//
//  Calcule la moyenne de N notes saisies, puis affiche un bilan.
//  Couvre : déclarations, REPETER/JUSQUA, SI/SINON SI/SINON/FINSI,
//            POUR, opérations arithmétiques et logiques.
//
export const SOURCE_CODE = `
ALGORITHME_CALCULMOYENNE;

VARIABLES:
  note     : entier;
  somme    : entier;
  compteur : entier;
  n        : entier;
  moyenne  : reel;
  reussi   : booleen;

DEBUT

  ecrire("=== Calcul de Moyenne ===");

  // n est fourni via LIRE (mocké par inputs[])
  lire(n);
  somme    <- 0;
  compteur <- 1;

  REPETER
    lire(note);
    somme    <- somme + note;
    compteur <- compteur + 1;
  JUSQUA (compteur > n);

  moyenne <- somme / n;

  SI (moyenne >= 10) ALORS
    reussi <- vrai;
    ecrire("Résultat : ADMIS");
  SINON SI (moyenne >= 8) ALORS
    reussi <- faux;
    ecrire("Résultat : Rattrapage");
  SINON
    reussi <- faux;
    ecrire("Résultat : ÉCHEC");
  FINSI

  ecrire("Moyenne = ", moyenne);

  // Affiche chaque note via POUR
  compteur <- 1;
  POUR compteur DE 1 A n PAS 1
    ecrire("  Note ", compteur, " enregistrée");
  FINPOUR

FIN
`;

// ── Fonction principale ────────────────────────────────────────────────────────

/**
 * Exécute le programme exemple de bout en bout.
 * @param {string[]} inputs  - Valeurs simulant les LIRE() dans l'ordre
 * @returns {{ tokens, ast, output, errors }}
 */
export function runExample(inputs = ['3', '14', '16', '12']) {
  const result = { tokens: [], ast: null, output: [], errors: [] };

  try {
    // ── Étape 1 : Lexer ──────────────────────────────────────────────────────
    const lexer = new Lexer(SOURCE_CODE);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    result.tokens = tokens;

    if (lexErrors.length > 0) {
      result.errors.push(...lexErrors.map(e => e.toString()));
    }

    // ── Étape 2 : Parser ─────────────────────────────────────────────────────
    const parser = new Parser(tokens);
    const ast    = parser.parse();
    result.ast   = ast;

    // ── Étape 3 : Interpréteur ───────────────────────────────────────────────
    const interp    = new Interpreter({ inputs });
    const { output } = interp.run(ast);
    result.output   = output;

  } catch (err) {
    result.errors.push(err.toString());
  }

  return result;
}

// ── Affichage console (Node.js) ───────────────────────────────────────────────

export function printExample() {
  console.log('═'.repeat(60));
  console.log('  CHAÎNE COMPLÈTE : source → AST → exécution');
  console.log('═'.repeat(60));

  // Inputs : n=3, note1=14, note2=16, note3=12
  const { tokens, ast, output, errors } = runExample(['3', '14', '16', '12']);

  console.log(`\n📋 Tokens : ${tokens.length} token(s) produit(s)`);

  console.log('\n🌳 AST (extrait racine) :');
  if (ast) {
    console.log(`  ProgramNode  → name    : "${ast.name}"`);
    console.log(`               → decls   : ${ast.declarations.length} variable(s) déclarée(s)`);
    console.log(`               → stmts   : ${ast.body.statements.length} instruction(s) dans DEBUT…FIN`);
  }

  console.log('\n📺 Sortie du programme :');
  if (output.length === 0) {
    console.log('  (aucune sortie)');
  } else {
    output.forEach(line => console.log('  ' + line));
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Erreurs :');
    errors.forEach(e => console.error('  ' + e));
  } else {
    console.log('\n✅ Aucune erreur.');
  }

  console.log('\n' + '═'.repeat(60));
  return { tokens, ast, output, errors };
}

// ── Auto-run en Node.js ───────────────────────────────────────────────────────
if (typeof process !== 'undefined') {
  const { fileURLToPath } = await import('url');
  if (fileURLToPath(import.meta.url) === process.argv[1]) {
    printExample();
  }
}
