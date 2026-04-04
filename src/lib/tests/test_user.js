import Lexer from '../lexer/Lexer.js';
import Parser from '../parser/Parser.js';
import SemanticAnalyzer from '../semantic/SemanticAnalyzer.js';
import Interpreter from '../interpreter/Interpreter.js';

const code = `
ALGORITHMETest;
TYPE Etudiant = ENREGISTREMENT
    nom : CHAINE DE CARACTERE;
    age : ENTIER;
    moyenne : REEL;
FIN Etudiant

VARIABLES
    Tableau groupe[2] : Etudiant;
    i : ENTIER;
DEBUT
    POUR i ALLANT DE 0 A 1 FAIRE
        groupe[i].nom <- "Ali";
        groupe[i].age <- 20 + i;
        groupe[i].moyenne <- 10.5 + i;
    FINPOUR

    POUR i ALLANT DE 0 A 1 FAIRE
        SI (groupe[i].moyenne >= 10) ALORS
            ECRIRE(groupe[i].nom, " est admis");
        SINON
            ECRIRE(groupe[i].nom, " est non admis");
        FINSI
    FINPOUR
FIN
`;

async function test() {
    const lexer = new Lexer(code);
    const { tokens, errors: lexErr } = lexer.tokenize();
    console.log("Lexical errors:", lexErr.length);

    const parser = new Parser(tokens, code);
    const { ast, errors: parseErr } = parser.parse();
    if (parseErr.length > 0) {
        console.log("Syntax errors:");
        parseErr.forEach(e => console.log(e.message));
    } else {
        console.log("Parsing OK!");
    }

    const analyzer = new SemanticAnalyzer(code);
    const { errors: semErr } = analyzer.analyze(ast);
    if (semErr.length > 0) {
         console.log("Semantic errors:");
         semErr.forEach(e => console.log(e.message));
    } else {
         console.log("Semantic OK!");
    }

    if (parseErr.length === 0 && semErr.length === 0) {
       const interpreter = new Interpreter({
           output: line => console.log("OUT:", line)
       });
       await interpreter.run(ast);
       console.log("Execution finished.");
    }
}

test().catch(console.error);
