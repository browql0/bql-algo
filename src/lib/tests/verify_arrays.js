import fs from "fs";
import Lexer from "../lexer/Lexer.js";
import Parser from "../parser/Parser.js";
import SemanticAnalyzer from "../semantic/SemanticAnalyzer.js";
import Interpreter from "../interpreter/Interpreter.js";

const code = `
ALGORITHMETestTableau;
VARIABLES:
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  // Initialisation
  POUR i ALLANT DE 0 A 4 FAIRE
    T[i] <- i * 2;
  FINPOUR

  // Lecture et affichage
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE("T[", i, "] = ", T[i], "\\n");
  FINPOUR
FIN
`;

async function runTest() {
  console.log("--- Test d'exécution des tableaux ---");
  try {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens, code);
    const ast = parser.parse();
    
    if (parser.errors.length > 0) {
      console.log("Erreurs Parser:");
      parser.errors.forEach(e => {
        console.log(`- [Ligne ${e.line}:${e.column}] ${e.message} (Indice: ${e.hint})`);
      });
      return;
    }

    const semantic = new SemanticAnalyzer(code);
    const { errors } = semantic.analyze(ast);
    if (errors.length > 0) {
      console.log("Erreurs Sémantiques:", errors.map(e => e.message));
      return;
    }

    const interpreter = new Interpreter({
      output: (line) => console.log("OUTPUT:", line)
    });
    
    await interpreter.run(ast);
    console.log("Test réussi !");
  } catch (err) {
    console.error("ERREUR RUNTIME:", err.message);
  }
}

runTest();
