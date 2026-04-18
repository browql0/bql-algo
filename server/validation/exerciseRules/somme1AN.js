export const SOMME_1_A_N_ID = "somme_1_a_n";

export function buildSomme1ANExercise({ lesson } = {}) {
  return {
    id: SOMME_1_A_N_ID,
    title: lesson?.title || "Somme de 1 a n",
    goal: "Lire n, calculer la somme 1 + 2 + ... + n, puis afficher uniquement la somme.",
    validationMode: "result_plus_constraints",
    inputs: [{ name: "n", type: "integer", order: 1 }],
    expectedOutput: {
      kind: "single_number",
      strict: true,
      numericTolerance: 1e-9,
    },
    strictTests: [
      { id: "one", input: "1", output: "1" },
      { id: "five", input: "5", output: "15" },
      { id: "ten", input: "10", output: "55" },
      { id: "twenty", input: "20", output: "210" },
    ],
    requiredConcepts: [
      {
        id: "read_input",
        label: "lecture de n",
        minCount: 1,
        message: "Cet exercice demande de lire n.",
      },
      {
        id: "write_output",
        label: "affichage de la somme",
        minCount: 1,
        message: "Le programme doit afficher la somme finale.",
      },
      {
        id: "any_keyword",
        label: "boucle",
        keywords: ["POUR", "TANTQUE", "REPETER"],
        minCount: 1,
        message: "Cet exercice entraine les boucles: utilisez une boucle.",
        hint: "Une boucle POUR est le choix le plus direct ici.",
      },
    ],
    optionalConcepts: [{ id: "accumulator", label: "accumulateur somme" }],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Initialisez une variable somme a 0.",
      "Ajoutez chaque valeur de 1 a n dans la somme.",
      "Affichez la somme apres la boucle.",
    ],
    diagnose: () => [],
  };
}
