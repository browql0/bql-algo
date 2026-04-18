/**
 * lexerExample.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Exemple complet illustrant la syntaxe mise à jour :
 *
 *   ✔  ALGORITHME + nom collé ou avec _     →  ALGORITHMECALCULMOYENNE;
 *                                           →  ALGORITHME_CALCULMOYENNE;
 *   ✔  1 variable  → VARIABLE  nom : type;
 *      Plusieurs   → VARIABLES  nom : type; nom2 : type2;
 *   ✔  Mots-clés insensibles à la casse
 *   ✔  Semicolons ; obligatoires en fin d'instruction / affectation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Lexer from './Lexer.js';

// ── Code source de démonstration ──────────────────────────────────────────────
export const SAMPLE_CODE = `
ALGORITHME_CALCULMOYENNE;

// Une seule variable → VARIABLE
VARIABLE
  n : entier;

// Plusieurs variables → VARIABLES
VARIABLES
  note     : entier;
  somme    : entier;
  compteur : entier;
  moyenne  : reel;
  reussi   : booleen;
  message  : chaine de caractere;

DEBUT

  ecrire("Combien de notes ? ");
  lire(n);

  somme    <- 0;
  compteur <- 1;

  // Boucle REPETER … JUSQUA
  REPETER
    ecrire("Note ", compteur, " : ");
    lire(note);
    somme    <- somme + note;
    compteur <- compteur + 1;
  JUSQUA (compteur > n);

  moyenne <- somme / n;

  SI (moyenne >= 10) ALORS
    reussi  <- vrai;
    message <- "Félicitations !";
  SINONSI (moyenne >= 8) ALORS
    reussi  <- faux;
    message <- "Proche, courage !";
  SINON
    reussi  <- faux;
    message <- "Echec.";
  FINSI

  ecrire("Moyenne = ", moyenne);
  ecrire(message);

  POUR compteur ALLANT DE 1 A n PAS 1 FAIRE
    ecrire("Note ", compteur);
  FINPOUR

FIN
`;

// ── Exécution et affichage ─────────────────────────────────────────────────────
export function runLexerExample() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   LEXER — Pseudo-algorithme marocain (syntaxe finale)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const lexer = new Lexer(SAMPLE_CODE);
  const { tokens, errors } = lexer.tokenize();

  console.log(`📋  ${tokens.length} token(s) produit(s) :\n`);
  console.log('Index  Type                   Value                  L:C');
  console.log('─'.repeat(65));

  tokens.forEach((tok, i) => {
    const idx  = String(i).padEnd(5);
    const type = tok.type.padEnd(22);
    const val  = JSON.stringify(tok.value ?? '').substring(0, 20).padEnd(22);
    const pos  = `L${tok.line}:C${tok.column}`;
    console.log(`${idx}  ${type} ${val} ${pos}`);
  });

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} erreur(s) :`);
    errors.forEach(e => console.warn('  ' + e.toString()));
  } else {
    console.log('\n✅  Aucune erreur lexicale.');
  }
  console.log('\n═══════════════════════════════════════════════════════════\n');
  return { tokens, errors };
}

// Auto-exécution Node.js
if (typeof process !== 'undefined') {
  const { fileURLToPath } = await import('url');
  if (fileURLToPath(import.meta.url) === process.argv[1]) {
    runLexerExample();
  }
}
