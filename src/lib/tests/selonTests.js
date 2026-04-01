import Lexer from '../lexer/Lexer.js';
import Parser from '../parser/Parser.js';

const tests = [
  {
    name: 'Test 1 - SELON simple',
    code: `ALGORITHMESimple;
DEBUT
  SELON (a) FAIRE
    CAS 1:
      ECRIRE("Un");
    CAS 2:
      ECRIRE("Deux");
    AUTRE:
      ECRIRE("Inconnu");
  FINSELON
FIN`
  },
  {
    name: 'Test 2 - SELON sans AUTRE',
    code: `ALGORITHMESansAutre;
DEBUT
  SELON (a) FAIRE
    CAS "test":
      ECRIRE("Test ok");
  FINSELON
FIN`
  },
  {
    name: 'Test 3 - SELON avec imbrication SI',
    code: `ALGORITHMEImbrique;
DEBUT
  SELON (a) FAIRE
    CAS 1:
      SI (b > 0) ALORS
        ECRIRE("b positif");
      SINON
        ECRIRE("b negatif ou nul");
      FINSI
    AUTRE:
      ECRIRE("fin");
  FINSELON
FIN`
  },
  {
    name: 'Test 4 - SELON dans un SI',
    code: `ALGORITHMEImbrique2;
DEBUT
  SI (vrai) ALORS
    SELON (a) FAIRE
      CAS 1:
        ECRIRE("Un");
      AUTRE:
        ECRIRE("Autre");
    FINSELON
  FINSI
FIN`
  },
  {
    name: 'Test 5 - Échec : AUTRE en premier',
    code: `ALGORITHMEEchec1;
DEBUT
  SELON (a) FAIRE
    AUTRE:
      ECRIRE("Test");
    CAS 1:
      ECRIRE("Un");
  FINSELON
FIN`
  },
  {
    name: 'Test 6 - Échec : FINSELON manquant',
    code: `ALGORITHMEEchec2;
DEBUT
  SELON (a) FAIRE
    CAS 1:
      ECRIRE("Un");
FIN`
  },
  {
    name: 'Test 7 - Échec : FAIRE manquant',
    code: `ALGORITHMEEchec3;
DEBUT
  SELON (a)
    CAS 1:
      ECRIRE("Un");
  FINSELON
FIN`
  },
  {
    name: 'Test 8 - Échec : Valeurs de CAS complexes (interdit)',
    code: `ALGORITHMEEchec4;
DEBUT
  SELON (a) FAIRE
    CAS a+2:
      ECRIRE("Un");
  FINSELON
FIN`
  }
];

let failed = 0;

console.log("=== TESTS STRUCTURAUX SELON ===");

for (const t of tests) {
  console.log(`\n▶ Exécution : ${t.name}`);
  const lexer = new Lexer(t.code);
  const { tokens, errors: lexErrors } = lexer.tokenize();
  if (lexErrors.length > 0) {
    console.log("  ⚠️ Erreurs Lexer:", lexErrors.map(e => e.message));
  }
  
  const parser = new Parser(tokens, t.code);
  const { ast, errors } = parser.parse();
  
  if (errors.length > 0) {
    console.log("  ❌ Erreurs Parser detectées :");
    errors.forEach(e => {
        console.log(`     Ligne ${e.line}: ${e.message}`);
    });
    // Pour les tests censés échouer (contenant "Échec") c'est un succès.
    if (!t.name.includes("Échec")) failed++;
  } else {
    console.log("  ✅ Succès : aucune erreur de parsing.");
    if (t.name.includes("Échec")) {
        console.log("  ❌ TEST FAILED: On attendait une erreur.");
        failed++;
    }
  }
}

console.log("\n==================================");
if (failed === 0) {
    console.log("🎉 TOUS LES TESTS SONT PASSÉS !");
} else {
    console.log(`⚠️ ${failed} tests ont échoué.`);
}
