import fs from "fs";
import Lexer from "../lexer/Lexer.js";
import Parser from "../parser/Parser.js";

const tests = [
  "ALGORITHME_BQL; VARIABLES: i:ENTIER; DEBUT REPETER ECRIRE(i); JUSQUA (i > 5) FIN",
  "ALGORITHME_BQL; DEBUT REPETER ECRIRE(i); FIN", // Missing JUSQUA
  "ALGORITHME_BQL; DEBUT JUSQUA (i > 5) FIN", // Missing REPETER
  "ALGORITHME_BQL; DEBUT REPETER ECRIRE(i); JUSQUA i > 5 FIN", // Missing parentheses
  "ALGORITHME_BQL; DEBUT REPETER ECRIRE(i); JUSQUA () FIN", // Missing condition
  "ALGORITHME_BQL; DEBUT REPETER ECRIRE(i); JUSQUA (i > 5 FIN", // Missing closing parenthesis
  "ALGORITHME_BQL; DEBUT REPETER ECRIRE(i); JUSQUA (1) FIN" // valid
];

tests.forEach((code, idx) => {
  console.log(`\n--- Test ${idx + 1} ---`);
  const lexer = new Lexer(code);
  const { tokens } = lexer.tokenize();
  const parser = new Parser(tokens, code);
  const { errors } = parser.parse();
  if (errors.length > 0) {
    console.log("Erreurs:");
    errors.forEach(e => console.log(e.message));
  } else {
    console.log("Valide");
  }
});
