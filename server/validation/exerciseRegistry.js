import {
  buildFactureSimplifieeExercise,
  FACTURE_SIMPLIFIEE_ID,
} from "./exerciseRules/factureSimplifiee.js";
import {
  buildMoyenneTroisNotesExercise,
  MOYENNE_TROIS_NOTES_ID,
} from "./exerciseRules/moyenneTroisNotes.js";
import {
  buildPairOuImpairExercise,
  PAIR_OU_IMPAIR_ID,
} from "./exerciseRules/pairOuImpair.js";
import {
  buildSomme1ANExercise,
  SOMME_1_A_N_ID,
} from "./exerciseRules/somme1AN.js";
import {
  buildTableMultiplicationExercise,
  TABLE_MULTIPLICATION_ID,
} from "./exerciseRules/tableMultiplication.js";
import {
  buildRechercheTableauExercise,
  RECHERCHE_TABLEAU_ID,
} from "./exerciseRules/rechercheTableau.js";
import {
  buildMoyenneGroupeEtudiantsExercise,
  MOYENNE_GROUPE_ETUDIANTS_ID,
} from "./exerciseRules/moyenneGroupeEtudiants.js";
import { getTeacherRubric } from "../../src/data/teacherRubrics.js";
import { getAdvancedProjectMetadata } from "../../src/data/advancedProjectMetadata.js";

function parseRules(rawRules) {
  if (!rawRules) return {};
  if (typeof rawRules === "object") return rawRules;

  try {
    return JSON.parse(rawRules);
  } catch {
    return {};
  }
}

function removeDiacritics(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeTitle(value) {
  return removeDiacritics(value).toUpperCase();
}

function titleLooksLikeFacture(title) {
  const normalized = normalizeTitle(title);
  return normalized.includes("FACTURE") && normalized.includes("SIMPLIFI");
}

const customExerciseBuilders = {
  [FACTURE_SIMPLIFIEE_ID]: buildFactureSimplifieeExercise,
  [MOYENNE_TROIS_NOTES_ID]: buildMoyenneTroisNotesExercise,
  [PAIR_OU_IMPAIR_ID]: buildPairOuImpairExercise,
  [SOMME_1_A_N_ID]: buildSomme1ANExercise,
  [TABLE_MULTIPLICATION_ID]: buildTableMultiplicationExercise,
  [RECHERCHE_TABLEAU_ID]: buildRechercheTableauExercise,
  [MOYENNE_GROUPE_ETUDIANTS_ID]: buildMoyenneGroupeEtudiantsExercise,
};

function inferExerciseIdFromTitle(title) {
  const normalized = normalizeTitle(title);
  if (titleLooksLikeFacture(title)) return FACTURE_SIMPLIFIEE_ID;
  if (normalized.includes("MOYENNE") && normalized.includes("TROIS")) {
    return MOYENNE_TROIS_NOTES_ID;
  }
  if (normalized.includes("PAIR") && normalized.includes("IMPAIR")) {
    return PAIR_OU_IMPAIR_ID;
  }
  if (normalized.includes("SOMME") && normalized.includes("1 A N")) {
    return SOMME_1_A_N_ID;
  }
  if (normalized.includes("TABLE") && normalized.includes("MULTIPLICATION")) {
    return TABLE_MULTIPLICATION_ID;
  }
  if (normalized.includes("RECHERCHE") && normalized.includes("TABLEAU")) {
    return RECHERCHE_TABLEAU_ID;
  }
  if (normalized.includes("MOYENNE") && normalized.includes("GROUPE")) {
    return MOYENNE_GROUPE_ETUDIANTS_ID;
  }
  return null;
}

function casesFromRules(rules, expectedOutput) {
  if (Array.isArray(rules)) return rules;
  if (Array.isArray(rules?.cases)) return rules.cases;
  if (typeof expectedOutput === "string" && expectedOutput.trim() !== "") {
    return [{ id: "expected-output", input: "", output: expectedOutput }];
  }
  return [];
}

function conceptsFromLegacyKeywords(rules) {
  const concepts = [];
  const keywords = rules.required_keywords || [];

  for (const keyword of keywords) {
    const upper = String(keyword).toUpperCase();
    if (upper === "LIRE") {
      concepts.push({
        id: "read_input",
        label: "lecture d'entree",
        minCount: 1,
        message: "Cet exercice demande de lire une entree utilisateur.",
      });
    } else if (upper === "ECRIRE") {
      concepts.push({
        id: "write_output",
        label: "affichage",
        minCount: 1,
        message: "Cet exercice demande d'afficher un resultat.",
      });
    } else if (upper === "CONSTANTE" || upper === "CONSTANTES") {
      concepts.push({
        id: "constant",
        label: "constante",
        minCount: 1,
        message: "Cet exercice demande explicitement une constante.",
      });
    } else {
      concepts.push({
        id: "keyword",
        label: keyword,
        keyword,
        message: `Cet exercice demande explicitement ${keyword}.`,
      });
    }
  }

  return concepts;
}

function forbiddenFromRules(rules) {
  return (rules.forbidden_keywords || []).map((keyword) => ({
    type: "keyword",
    value: keyword,
    label: keyword,
    message: `Le mot-cle ${keyword} est interdit dans cet exercice.`,
  }));
}

function buildGenericExercise({ lesson, rules, expectedOutput }) {
  const strictTests = casesFromRules(rules, expectedOutput).map((testCase, index) => ({
    id: testCase.id || `case-${index + 1}`,
    input: testCase.input ?? "",
    output: testCase.output ?? testCase.expected ?? expectedOutput ?? "",
  }));
  const requiredConcepts = conceptsFromLegacyKeywords(rules);

  return {
    id: rules.exerciseId || lesson?.id || "generic_exercise",
    title: lesson?.title || "Exercice BQL",
    goal: rules.goal || lesson?.content || lesson?.exercise || "",
    validationMode:
      requiredConcepts.length > 0 || (rules.forbidden_keywords || []).length > 0
        ? "result_plus_constraints"
        : "result_only",
    inputs: rules.inputs || [],
    expectedOutput: rules.expectedOutput || {
      kind:
        rules.mode === "exact_output"
          ? "exact_output"
          : rules.mode === "semantic_check"
            ? "final_output"
            : "final_output",
      strict: rules.strict_output !== false,
    },
    strictTests,
    requiredConcepts,
    optionalConcepts: rules.optionalConcepts || [],
    forbiddenPatterns: forbiddenFromRules(rules),
    diagnosticRules: rules.diagnosticRules || {},
    hints: rules.hints || [],
  };
}

export function resolveExerciseMetadata({ lesson, secrets }) {
  const rules = parseRules(secrets?.test_cases);
  const exerciseId =
    rules.exerciseId || rules.exercise_id || inferExerciseIdFromTitle(lesson?.title);

  const attachEducationalMetadata = (exercise) => ({
    ...exercise,
    teacherRubric: getTeacherRubric(exercise.id),
    advancedProject: getAdvancedProjectMetadata(rules.projectId || exercise.id),
  });

  if (customExerciseBuilders[exerciseId]) {
    return attachEducationalMetadata(customExerciseBuilders[exerciseId]({ lesson, rules }));
  }

  return attachEducationalMetadata(buildGenericExercise({
    lesson,
    rules,
    expectedOutput: secrets?.expected_output,
  }));
}

export { parseRules };
