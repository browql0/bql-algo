export const RECHERCHE_TABLEAU_ID = "recherche_tableau";

export function buildRechercheTableauExercise({ lesson } = {}) {
  return {
    id: RECHERCHE_TABLEAU_ID,
    title: lesson?.title || "Recherche dans un tableau",
    goal:
      "Lire cinq valeurs dans un tableau, lire une valeur cible, puis afficher Trouve si la cible existe, sinon Absent.",
    validationMode: "result_plus_constraints",
    inputs: [
      { name: "valeurs", type: "integer[]", count: 5, order: 1 },
      { name: "cible", type: "integer", order: 6 },
    ],
    expectedOutput: {
      kind: "final_output",
      strict: true,
    },
    strictTests: [
      { id: "found-middle", input: "4\n8\n15\n16\n23\n15", output: "Trouve" },
      { id: "absent", input: "1\n2\n3\n4\n5\n9", output: "Absent" },
      { id: "found-first", input: "7\n1\n2\n3\n4\n7", output: "Trouve" },
      { id: "found-last", input: "1\n2\n3\n4\n11\n11", output: "Trouve" },
    ],
    requiredConcepts: [
      {
        id: "read_input",
        label: "lecture du tableau et de la cible",
        minCount: 2,
        message: "Cet exercice demande de lire les valeurs du tableau puis une cible.",
      },
      {
        id: "write_output",
        label: "affichage du resultat",
        minCount: 1,
        message: "Le programme doit afficher Trouve ou Absent.",
      },
      {
        id: "keyword",
        label: "tableau",
        keyword: "TABLEAU",
        message: "Cet exercice demande d'utiliser un tableau.",
      },
      {
        id: "any_keyword",
        label: "boucle de parcours",
        keywords: ["POUR", "TANTQUE", "REPETER"],
        minCount: 1,
        message: "Cet exercice demande de parcourir les valeurs avec une boucle.",
      },
      {
        id: "keyword",
        label: "condition",
        keyword: "SI",
        message: "Cet exercice demande une condition pour comparer la cible.",
      },
    ],
    optionalConcepts: [{ id: "boolean_flag", label: "drapeau booleen trouve" }],
    forbiddenPatterns: [],
    diagnosticRules: {},
    hints: [
      "Stockez les cinq valeurs dans un tableau.",
      "Comparez chaque case avec la cible.",
      "Utilisez une variable booleenne pour memoriser si la cible a ete trouvee.",
    ],
    diagnose: () => [],
  };
}
