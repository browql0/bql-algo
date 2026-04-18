export const TABLE_MULTIPLICATION_ID = "table_multiplication";

function expectedTable(n) {
  return Array.from({ length: 10 }, (_, index) => String(n * (index + 1))).join("\n");
}

export function buildTableMultiplicationExercise({ lesson } = {}) {
  return {
    id: TABLE_MULTIPLICATION_ID,
    title: lesson?.title || "Table de multiplication",
    goal: "Lire un entier n et afficher les dix premiers multiples de n, un par ligne.",
    validationMode: "result_plus_constraints",
    inputs: [{ name: "n", type: "integer", order: 1 }],
    expectedOutput: {
      kind: "final_output",
      strict: true,
    },
    strictTests: [
      { id: "table-3", input: "3", output: expectedTable(3) },
      { id: "table-5", input: "5", output: expectedTable(5) },
      { id: "table-9", input: "9", output: expectedTable(9) },
    ],
    requiredConcepts: [
      {
        id: "read_input",
        label: "lecture de n",
        minCount: 1,
        message: "Cet exercice demande de lire le nombre de depart.",
      },
      {
        id: "write_output",
        label: "affichage des dix multiples",
        minCount: 1,
        message: "La table doit afficher les multiples dans la boucle.",
        hint: "Placez ECRIRE dans la boucle pour afficher chaque multiple.",
      },
      {
        id: "any_keyword",
        label: "boucle",
        keywords: ["POUR", "TANTQUE", "REPETER"],
        minCount: 1,
        message: "Cet exercice demande une boucle.",
      },
    ],
    optionalConcepts: [],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Parcourez les valeurs de 1 a 10.",
      "A chaque tour, affichez n * compteur.",
      "N'ajoutez pas de texte autour des nombres.",
    ],
    diagnose: () => [],
  };
}
