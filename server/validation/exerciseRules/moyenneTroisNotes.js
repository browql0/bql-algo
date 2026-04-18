export const MOYENNE_TROIS_NOTES_ID = "moyenne_trois_notes";

export function buildMoyenneTroisNotesExercise({ lesson } = {}) {
  return {
    id: MOYENNE_TROIS_NOTES_ID,
    title: lesson?.title || "Moyenne de trois notes",
    goal: "Lire trois notes, calculer leur moyenne, puis afficher uniquement le resultat.",
    validationMode: "result_only",
    inputs: [
      { name: "note1", type: "number", order: 1 },
      { name: "note2", type: "number", order: 2 },
      { name: "note3", type: "number", order: 3 },
    ],
    expectedOutput: {
      kind: "single_number",
      strict: true,
      numericTolerance: 1e-9,
    },
    strictTests: [
      { id: "balanced", input: "10\n12\n14", output: "12" },
      { id: "with-zero", input: "0\n15\n15", output: "10" },
      { id: "decimal-result", input: "13\n14\n15", output: "14" },
      { id: "low-values", input: "6\n9\n12", output: "9" },
    ],
    requiredConcepts: [
      {
        id: "read_input",
        label: "lecture des trois notes",
        minCount: 3,
        message: "Cet exercice demande de lire trois notes.",
        hint: "Utilisez trois appels LIRE(...), un par note.",
      },
      {
        id: "write_output",
        label: "affichage de la moyenne",
        minCount: 1,
        message: "Le programme doit afficher la moyenne finale.",
      },
    ],
    optionalConcepts: [
      { id: "intermediate_sum", label: "variable intermediaire pour la somme" },
    ],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Additionnez les trois notes.",
      "Divisez la somme par 3.",
      "Affichez uniquement la moyenne.",
    ],
    diagnose: ({ strictResult }) => {
      const diagnostics = [];
      const failed = strictResult.cases.filter((testCase) => !testCase.passed);
      for (const testCase of failed) {
        const values = String(testCase.input || "").split("\n").map(Number);
        const actual = Number(String(testCase.actual || "").replace(",", "."));
        if (values.length !== 3 || !Number.isFinite(actual)) continue;
        const sum = values.reduce((total, value) => total + value, 0);
        if (Math.abs(actual - sum) <= 1e-9) {
          diagnostics.push({
            type: "logic_error",
            code: "MISSING_DIVISION",
            message: "Vous avez calcule la somme des notes, mais pas leur moyenne.",
            hint: "Divisez la somme par 3 avant d'afficher le resultat.",
          });
          break;
        }
      }
      return diagnostics;
    },
  };
}
