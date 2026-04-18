export const PAIR_OU_IMPAIR_ID = "pair_ou_impair";

export function buildPairOuImpairExercise({ lesson } = {}) {
  return {
    id: PAIR_OU_IMPAIR_ID,
    title: lesson?.title || "Pair ou impair",
    goal: "Lire un entier et afficher Pair si le nombre est pair, sinon Impair.",
    validationMode: "result_plus_constraints",
    inputs: [{ name: "nombre", type: "integer", order: 1 }],
    expectedOutput: {
      kind: "final_output",
      strict: true,
    },
    strictTests: [
      { id: "even-small", input: "2", output: "Pair" },
      { id: "odd-small", input: "7", output: "Impair" },
      { id: "zero", input: "0", output: "Pair" },
      { id: "even-large", input: "42", output: "Pair" },
      { id: "odd-large", input: "99", output: "Impair" },
    ],
    requiredConcepts: [
      {
        id: "read_input",
        label: "lecture du nombre",
        minCount: 1,
        message: "Cet exercice demande de lire un entier.",
      },
      {
        id: "write_output",
        label: "affichage du verdict",
        minCount: 1,
        message: "Le programme doit afficher Pair ou Impair.",
      },
      {
        id: "keyword",
        label: "condition SI",
        keyword: "SI",
        message: "Cet exercice entraine les conditions: utilisez SI/SINON.",
        hint: "Testez le reste de la division par 2 avec MOD.",
      },
    ],
    optionalConcepts: [{ id: "modulo", label: "utilisation de MOD" }],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Un nombre est pair si nombre MOD 2 = 0.",
      "Utilisez SI/SINON pour choisir entre Pair et Impair.",
    ],
    diagnose: () => [],
  };
}
