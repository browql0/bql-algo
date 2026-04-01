import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

/* If you are testing local ES module: */
import Lexer from "../lexer/Lexer.js";
import Parser from "../parser/Parser.js";

const code = "ALGORITHME_BQL; DEBUT POUR a allant de de a pas pas pas faire ECRIRE(a); FINPOUR FIN";
console.log("TESTING CODE:", code);

const lexer = new Lexer(code);
const result = lexer.tokenize();

const parser = new Parser(result.tokens, code);
const res = parser.parse();

console.log("ERRORS:", res.errors);
if (res.ast && res.ast.body && res.ast.body.statements.length > 0) {
    const forStmt = res.ast.body.statements[0];
    console.log("FOR NODE VAR:", forStmt.variable);
    console.log("FROM:", forStmt.from);
    console.log("TO:", forStmt.to);
    console.log("STEP:", forStmt.step);
}
