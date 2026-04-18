export const MOYENNE_GROUPE_ETUDIANTS_ID = "moyenne_groupe_etudiants";

export function buildMoyenneGroupeEtudiantsExercise({ lesson } = {}) {
  return {
    id: MOYENNE_GROUPE_ETUDIANTS_ID,
    title: lesson?.title || "Moyenne d'un groupe d'etudiants",
    goal:
      "Creer un type Etudiant, lire trois noms et trois notes, puis afficher uniquement la moyenne des notes.",
    validationMode: "result_plus_constraints",
    inputs: [
      { name: "etudiants", type: "record[]", count: 3 },
      { name: "note", type: "number", count: 3 },
    ],
    expectedOutput: {
      kind: "single_number",
      strict: true,
      numericTolerance: 1e-9,
    },
    strictTests: [
      { id: "balanced", input: "Amina\n12\nYoussef\n14\nSara\n16", output: "14" },
      { id: "with-low", input: "Ali\n8\nNora\n10\nMehdi\n12", output: "10" },
      { id: "decimal-average", input: "A\n10\nB\n11\nC\n12", output: "11" },
    ],
    requiredConcepts: [
      {
        id: "keyword",
        label: "type enregistrement",
        keywords: ["TYPE", "ENREGISTREMENT"],
        message: "Cet exercice demande de modeliser un etudiant avec TYPE ENREGISTREMENT.",
      },
      {
        id: "keyword",
        label: "tableau d'etudiants",
        keyword: "TABLEAU",
        message: "Cet exercice demande un tableau d'etudiants.",
      },
      {
        id: "read_input",
        label: "lecture des noms et notes",
        minCount: 2,
        message: "Cet exercice demande de lire les noms et les notes.",
      },
      {
        id: "write_output",
        label: "affichage de la moyenne",
        minCount: 1,
        message: "Le programme doit afficher la moyenne finale.",
      },
    ],
    optionalConcepts: [
      { id: "accumulator", label: "somme des notes" },
      { id: "record_field_access", label: "acces aux champs des etudiants" },
    ],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Definissez un TYPE Etudiant avec un nom et une note.",
      "Utilisez un tableau de trois Etudiant.",
      "Additionnez les notes puis divisez par 3.",
    ],
    diagnose: () => [],
  };
}
