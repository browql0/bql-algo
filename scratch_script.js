import { executeCode } from './src/lib/executeCode.js';

const source = `
ALGORITHME calcul_ttc
CONSTANTE
    tva = 0.20 : REEL;
VARIABLES
    prix_ht, prix_ttc : REEL;
DEBUT
    LIRE(prix_ht);
    prix_ttc <- prix_ht + (prix_ht * tva);
    ECRIRE(prix_ttc);
FIN
`;

async function test() {
    try {
        console.log("Running:");
        const result = await executeCode(source, { inputs: ['100'] });
        console.log("Success:", result.success);
        console.log("Output:", result.output);
        console.log("Errors:", result.errors);
    } catch (err) {
        console.error("Interpreter Violently Crashed:", err);
    }
}
test();
