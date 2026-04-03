import fs from 'fs';
import path from 'path';
import Lexer from './src/lib/lexer/Lexer.js';
import Parser from './src/lib/parser/Parser.js';

const code = `ALGORITHMETestMONSTERGLOBAL;
CONSTANTES
    MAX = 5 : ENTIER;
    LIGNES = 3 : ENTIER;
    COLONNES = 3 : ENTIER;
    PI = 3.14 : REEL;
    ACTIF = VRAI : BOOLEEN;
VARIABLES
    i, j, k : ENTIER;
    somme, maxVal, x, choix : ENTIER;
    Tableau T[MAX] : ENTIER;
    Tableau M[LIGNES,COLONNES] : ENTIER;
DEBUT
    ECRIRE(PI);

    SI (ACTIF = VRAI) ALORS
        ECRIRE("Mode actif");
    SINON
        ECRIRE("Mode inactif");
    FINSI

    POUR i ALLANT DE 0 A MAX - 1 FAIRE
        Tableau T[i] <- i + 1;
    FINPOUR

    POUR i ALLANT DE 0 A LIGNES - 1 FAIRE
        POUR j ALLANT DE 0 A COLONNES - 1 FAIRE
            Tableau M[i,j] <- i + j;
        FINPOUR
    FINPOUR

    somme <- 0;
    maxVal <- M[0,0];
    choix <- 2;
    x <- 1;

    POUR i ALLANT DE 0 A MAX - 1 FAIRE
        somme <- somme + T[i];

        SI (T[i] > choix) ALORS
            ECRIRE("grand");
        SINON SI (T[i] = choix) ALORS
            ECRIRE("egal");
        SINON
            ECRIRE("petit");
        FINSI

        SELON (T[i]) FAIRE
            CAS 1:
                ECRIRE("un");
            CAS 2:
                ECRIRE("deux");
            AUTRE:
                ECRIRE("autre");
        FINSELON
    FINPOUR

    POUR i ALLANT DE 0 A LIGNES - 1 FAIRE
        POUR j ALLANT DE 0 A COLONNES - 1 FAIRE
            SI (M[i,j] > maxVal) ALORS
                maxVal <- M[i,j];
            FINSI
        FINPOUR
    FINPOUR

    ECRIRE("Somme = ", somme);
    ECRIRE("Max = ", maxVal);

    i <- 0;
    TANTQUE (i < MAX) FAIRE
        ECRIRE(T[i]);
        i <- i + 1;
    FINTANTQUE

    i <- 0;
    REPETER
        ECRIRE(T[i]);
        i <- i + 1;
    JUSQUA (i = MAX)

    POUR i ALLANT DE 0 A MAX - 1 FAIRE
        POUR k ALLANT DE 3 A 1 PAS -1 FAIRE
            SI (k = 2) ALORS
                ECRIRE("milieu");
            SINON SI (k = 1) ALORS
                ECRIRE("fin");
            SINON
                ECRIRE("debut");
            FINSI
        FINPOUR
    FINPOUR

    POUR i ALLANT DE 0 A MAX - 1 FAIRE
        ECRIRE(T[i]);
    FINPOUR

    POUR i ALLANT DE 0 A LIGNES - 1 FAIRE
        POUR j ALLANT DE 0 A COLONNES - 1 FAIRE
            ECRIRE(M[i,j]);
        FINPOUR
    FINPOUR
FIN`;

const lexer = new Lexer(code);
const { tokens } = lexer.tokenize();
console.log("Tokens count:", tokens.length);
if (lexer.errors.length > 0) {
    console.log("LEXER ERRORS:", lexer.errors);
} else {
    try {
        const parser = new Parser(tokens, code);
        const { ast, errors } = parser.parse();
        if (errors.length > 0) {
            const out = errors.map(e => `[L${e.line}:${e.column}] ${e.message} (Hint: ${e.hint || 'none'})`).join('\n');
            fs.writeFileSync('errors.txt', out);
            console.log("ERRORS DUMPED TO errors.txt");
        } else {
            console.log("PARSED SUCCESSFULLY!");
        }
    } catch(e) {
        console.error("EXCEPTION:", e);
    }
}
