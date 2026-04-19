import { createNumericFormulaPattern, diagnoseNumericLogicPatterns } from "../logicFeedback.js";

export const FACTURE_SIMPLIFIEE_ID = "facture_simplifiee";

const baseStrictTests = [
  { id: "base-100x2", input: "100\n2", output: "240" },
  { id: "base-50x1", input: "50\n1", output: "60" },
  { id: "quantity-80x3", input: "80\n3", output: "288" },
  { id: "quantity-75x4", input: "75\n4", output: "360" },
  { id: "zero-0x5", input: "0\n5", output: "0" },
];

function includesKeyword(keywords, keyword) {
  return (keywords || []).some(
    (item) => String(item).toUpperCase() === keyword.toUpperCase(),
  );
}

const factureLogicPatterns = [
  createNumericFormulaPattern({
    code: "MISSING_QUANTITY",
    message:
      "Vous calculez le prix TTC d'un seul article, mais vous n'utilisez pas la quantite.",
    hint: "Multipliez aussi par la quantite lue en deuxieme entree.",
    example: "total <- prixHT * quantite * 1.2;",
    testNext: "Essaie prixHT = 100 et quantite = 2: le total doit etre 240.",
    confidence: "high",
    appliesTo: (testCase) => testCase.inputs.length >= 2 && testCase.inputs[1] !== 1,
    expectedActual: (testCase) => testCase.inputs[0] * 1.2,
  }),
  createNumericFormulaPattern({
    code: "MISSING_TVA",
    message:
      "Votre calcul correspond au total hors taxes. Les 20% de TVA ne sont pas appliques.",
    hint: "Multipliez le total HT par 1.20 ou par (1 + TVA).",
    example: "total <- prixHT * quantite * 1.2;",
    testNext: "Essaie prixHT = 100 et quantite = 2: sans TVA tu obtiens 200, mais il faut 240.",
    confidence: "high",
    appliesTo: (testCase) => testCase.inputs.length >= 2,
    expectedActual: (testCase) => testCase.inputs[0] * testCase.inputs[1],
  }),
  createNumericFormulaPattern({
    code: "ADDITION_INSTEAD_OF_MULTIPLICATION",
    message:
      "Votre resultat ressemble a une addition du prix et de la quantite au lieu d'une multiplication.",
    hint: "Pour une facture, la quantite multiplie le prix unitaire.",
    example: "totalHT <- prixHT * quantite;",
    testNext: "Avec prixHT = 100 et quantite = 2, le total HT doit etre 200, pas 102.",
    confidence: "medium",
    appliesTo: (testCase) => testCase.inputs.length >= 2,
    expectedActual: (testCase) => (testCase.inputs[0] + testCase.inputs[1]) * 1.2,
  }),
  createNumericFormulaPattern({
    code: "FIXED_TVA_ADDED",
    message:
      "Votre resultat suggere que la TVA est ajoutee comme une valeur fixe au lieu d'un pourcentage.",
    hint: "La TVA de 20% se calcule avec une multiplication par 1.2.",
    example: "totalTTC <- totalHT * 1.2;",
    testNext: "Avec prixHT = 100 et quantite = 2, ajoute 20% de 200: le resultat doit etre 240.",
    confidence: "medium",
    appliesTo: (testCase) => testCase.inputs.length >= 2,
    expectedActual: (testCase) => testCase.inputs[0] * testCase.inputs[1] + 0.2,
  }),
  createNumericFormulaPattern({
    code: "DISPLAYED_INPUT_INSTEAD_OF_TOTAL",
    message:
      "Vous affichez probablement une entree ou une variable intermediaire, pas le total final.",
    hint: "Verifiez que ECRIRE(...) affiche la variable qui contient le total TTC.",
    example: "ECRIRE(totalTTC);",
    testNext: "Avec prixHT = 100 et quantite = 2, la derniere valeur affichee doit etre 240.",
    confidence: "medium",
    appliesTo: (testCase) => testCase.inputs.length >= 2,
    expectedActual: (testCase) => testCase.inputs[0],
  }),
];

export function buildFactureSimplifieeExercise({ lesson, rules = {} } = {}) {
  const requiredKeywords = rules.required_keywords || rules.requiredConcepts || [];
  const requiresConstant =
    includesKeyword(requiredKeywords, "CONSTANTE") ||
    includesKeyword(requiredKeywords, "CONSTANTES") ||
    rules.requireConstant === true;

  const requiredConcepts = [
    {
      id: "read_input",
      label: "lecture des deux entrees",
      minCount: 2,
      message: "Ce defi demande de lire le prix HT et la quantite.",
      hint: "Utilisez deux appels LIRE(...), dans l'ordre prix HT puis quantite.",
    },
    {
      id: "write_output",
      label: "affichage du resultat",
      minCount: 1,
      message: "Le programme doit afficher le total TTC.",
      hint: "Affichez uniquement le total final avec ECRIRE(total).",
    },
  ];

  if (requiresConstant) {
    requiredConcepts.push({
      id: "constant",
      label: "constante TVA",
      minCount: 1,
      message:
        "Le resultat peut etre correct, mais ce defi demande explicitement d'utiliser une constante pour la TVA.",
      hint: "Declarez par exemple TVA = 0.20 dans une section CONSTANTE.",
    });
  }

  return {
    id: FACTURE_SIMPLIFIEE_ID,
    title: lesson?.title || "Defi Final : Facture Simplifiee",
    goal:
      "Lire un prix hors taxes et une quantite, calculer le total TTC avec 20% de TVA, puis afficher uniquement le montant total.",
    validationMode: requiresConstant ?"result_plus_constraints" : "result_only",
    inputs: [
      {
        name: "prixHT",
        type: "number",
        order: 1,
        role: "unit_price_without_tax",
      },
      {
        name: "quantite",
        type: "number",
        order: 2,
        role: "quantity",
      },
    ],
    expectedOutput: {
      kind: "single_number",
      description: "Un seul nombre: prixHT * quantite * 1.20",
      strict: true,
      numericTolerance: 1e-9,
    },
    strictTests: baseStrictTests,
    requiredConcepts,
    optionalConcepts: [
      {
        id: "intermediate_total",
        label: "variable intermediaire pour le total",
      },
    ],
    forbiddenPatterns: [],
    diagnosticRules: {
      knownMistakes: [
        {
          id: "missing_quantity",
          type: "formula_hypothesis",
          message: "Vous avez probablement oublie d'utiliser la quantite dans le calcul.",
        },
        {
          id: "missing_tva",
          type: "formula_hypothesis",
          message: "Vous avez probablement calcule le total HT sans appliquer les 20% de TVA.",
        },
      ],
    },
    hints: [
      "Lisez deux valeurs: le prix HT puis la quantite.",
      "Le total TTC vaut prixHT * quantite * 1.20.",
      "Si une constante est requise, stockez le taux de TVA dans CONSTANTE.",
    ],
  };
}

export function diagnoseFactureSimplifiee({ strictResult, astAnalysis }) {
  const diagnostics = [];

  if (astAnalysis.inputCount < 2) {
    diagnostics.push({
      type: "misunderstanding",
      code: "MISSING_INPUT",
      message:
        "Vous lisez moins de deux entrees. Le defi demande le prix HT puis la quantite.",
      hint: "Ajoutez deux LIRE: un pour le prix HT, un pour la quantite.",
      example: "LIRE(prixHT);\nLIRE(quantite);",
      testNext: "Teste avec deux entrees: 100 puis 2.",
    });
  }

  diagnostics.push(
    ...diagnoseNumericLogicPatterns({
      strictResult,
      patterns: factureLogicPatterns,
      tolerance: 1e-9,
    }),
  );

  return diagnostics;
}
