/**
 * feedbackAnalyzer.js
 * ──────────────────────────────────────────────────────────────────────────
 * Moteur d'analyse pédagogique pour les exercices BQL.
 * Reçoit le code source, les cas de tests exécutés, et le contexte de l'exercice.
 * Retourne un FeedbackReport structuré utilisable par ValidationOverlay.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ─── Types d'erreurs ────────────────────────────────────────────────────────
export const ERROR_TYPES = {
  SYNTAX_ERROR:     'SYNTAX_ERROR',     // Erreur de syntaxe stricte (BQL struct)
  SEMANTIC_ERROR:   'SEMANTIC_ERROR',   // Erreur sémantique stricte (variables, indices, etc)
  CALC_ERROR:       'CALC_ERROR',       // Formule de calcul incorrecte
  OUTPUT_FORMAT:    'OUTPUT_FORMAT',    // Texte affiché mal formaté
  MISSING_ELEMENT:  'MISSING_ELEMENT',  // Mot-clé ou variable manquant
  LOGIC_ERROR:      'LOGIC_ERROR',      // Erreur de logique générale
  RUNTIME_ERROR:    'RUNTIME_ERROR',    // Le code plante à l'exécution
  VALIDATOR_INTERNAL_ERROR:   'VALIDATOR_INTERNAL_ERROR',   // Le validateur a crashé (bug système)
  INTERPRETER_INTERNAL_ERROR: 'INTERPRETER_INTERNAL_ERROR', // L'interpréteur a crashé violemment
};

import { normalizeString } from './outputUtils.js';

// ─── Mots-clés BQL structuraux importants ──────────────────────────────────
const STRUCTURAL_KEYWORDS = ['DEBUT', 'FIN', 'ALGORITHME', 'VARIABLE', 'VARIABLES'];
const IO_KEYWORDS         = ['LIRE', 'ECRIRE', 'AFFICHER'];
const LOGIC_KEYWORDS      = ['SI', 'SINON', 'POUR', 'TANTQUE', 'TANT QUE', 'REPETER'];

// ─── Patterns d'erreurs fréquentes ─────────────────────────────────────────
const COMMON_MISTAKES = [
  {
    id: 'minus_instead_of_plus',
    test: (src, vars) => {
      // Cherche des soustractions là où on attendrait additions (TTC, total...)
      const calcVars = vars.filter(v => /ttc|total|somme|prix|montant/i.test(v));
      return calcVars.some(v => {
        const regex = new RegExp(`${v}\\s*<-[^;\\n]+\\s-\\s`, 'i');
        return regex.test(src);
      });
    },
    message: "Un opérateur `-` est utilisé là où `+` ou `*` est probablement attendu.",
  },
  {
    id: 'wrong_operator_order',
    test: (src) => {
      // Division avant multiplication dans calcul TTC (ht / tva * qte au lieu de ht * qte * tva)
      return /\w+\s*<-[^;\\n]*\/[^;\\n]*\*/i.test(src);
    },
    message: "L'ordre des opérations semble incorrect. Vérifie la priorité entre `/` et `*`.",
  },
  {
    id: 'forgot_quantity',
    test: (src, vars) => {
      const hasQtyVar = vars.some(v => /qte|quantite|quantité|nb|nombre/i.test(v));
      const calcLine  = src.match(/\w+\s*<-[^;\n]+/gi) || [];
      // Si une variable de quantité existe mais n'apparaît pas dans la formule de calcul
      if (!hasQtyVar) return false;
      const qteVar = vars.find(v => /qte|quantite|quantité|nb|nombre/i.test(v));
      return calcLine.some(line => !/lire|ecrire|afficher/i.test(line) && !new RegExp(qteVar, 'i').test(line));
    },
    message: "La variable de quantité semble ne pas être utilisée dans la formule principale.",
  },
  {
    id: 'forgot_tva',
    test: (src, vars) => {
      const hasTvaVar = vars.some(v => /tva|taxe|tax/i.test(v));
      if (!hasTvaVar) return false;
      const tvaVar = vars.find(v => /tva|taxe|tax/i.test(v));
      const calcLines = src.match(/\w+\s*<-.+/gi) || [];
      return calcLines.some(line => !/lire|ecrire|afficher/i.test(line) && !new RegExp(tvaVar, 'i').test(line));
    },
    message: "La TVA semble ne pas être intégrée dans le calcul.",
  },
  {
    id: 'extra_text_in_output',
    test: (src, vars, cases) => {
      if (!cases || cases.length === 0) return false;
      // Si les cas échoués ont une sortie qui contient la valeur attendue mais avec du texte en plus
      return cases.filter(c => !c.passed).some(c => {
        if (typeof c.got !== 'string' || typeof c.expected !== 'string') return false;
        return c.got.includes(c.expected) && c.got !== c.expected;
      });
    },
    message: "Le texte affiché contient la bonne valeur mais avec du contenu supplémentaire.",
  },
  {
    id: 'matrix_brackets',
    test: (src) => {
      // Détecte M[i][j]
      return /\[.+\]\s*\[.+\]/.test(src);
    },
    message: "💡 En BQL, on utilise T[i, j] pour accéder aux matrices (au lieu de T[i][j]).",
  },
];

// ─── Utilitaires ────────────────────────────────────────────────────────────

/**
 * Extrait les noms de variables déclarées dans le code BQL
 * en parsant les sections VARIABLE / VARIABLES
 */
function extractDeclaredVars(source) {
  const vars = [];
  // BQL: VARIABLE(S) x, y, z : TYPE
  const varBlockRegex = /VARIABLES?\s*\n?([\s\S]*?)(?:DEBUT|BEGIN)/i;
  const block = source.match(varBlockRegex);
  if (block && block[1]) {
    const lines = block[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w,\s]+)\s*:/);
      if (match) {
        match[1].split(',').forEach(v => {
          const name = v.trim();
          if (name) vars.push(name.toLowerCase());
        });
      }
    }
  }
  // Fallback : chercher les affectations <- dans tout le code
  const assignments = source.match(/([a-zA-Z_]\w*)\s*<-/g) || [];
  assignments.forEach(a => {
    const name = a.replace(/<-/, '').trim().toLowerCase();
    if (!vars.includes(name)) vars.push(name);
  });
  return [...new Set(vars)];
}

/**
 * Vérifie si un mot-clé est présent de manière significative dans le source.
 */
function hasKeyword(source, keyword) {
  return new RegExp(`\\b${keyword}\\b`, 'i').test(source);
}

/**
 * Calcule un score de proximité numérique entre les résultats obtenus et attendus.
 * Pour les valeurs numériques : |got - expected| / expected <= 10% → "proche"
 * Retourne un pourcentage 0–100.
 */
function computeCloseness(cases) {
  if (!cases || cases.length === 0) return 0;
  let close = 0;
  let numericPairs = 0;

  for (const tc of cases) {
    const gotNum = parseFloat(String(tc.got).replace(',', '.'));
    const expNum = parseFloat(String(tc.expected).replace(',', '.'));
    if (!isNaN(gotNum) && !isNaN(expNum) && expNum !== 0) {
      numericPairs++;
      const ratio = Math.abs(gotNum - expNum) / Math.abs(expNum);
      if (ratio <= 0.5) close++; // 50% de marge → "proche"
    } else if (tc.passed) {
      close++;
    }
  }

  const total = numericPairs > 0 ? numericPairs : cases.length;
  const passedCount = cases.filter(c => c.passed).length;
  const closenessScore = Math.round(
    ((passedCount + close * 0.4) / total) * 100
  );
  return Math.min(closenessScore, 99); // jamais 100% si échec
}

/**
 * Détecte si l'erreur est probablement une erreur de calcul.
 * Heuristique : la structure est correcte (LIRE + ECRIRE présents, variables OK)
 * mais les sorties numériques divergent.
 */
function detectCalcError(source, cases, declaredVars) {
  const hasLire   = IO_KEYWORDS.some(kw => hasKeyword(source, kw));
  const hasEcrire = /ECRIRE|AFFICHER/i.test(source);
  if (!hasLire || !hasEcrire) return false;

  const failedCases = cases.filter(c => !c.passed && !c.reason);
  if (failedCases.length === 0) return false;

  // Regarde si toutes les sorties sont numériques
  const allNumeric = failedCases.every(c => {
    const gotNum = parseFloat(String(c.got).replace(',', '.'));
    const expNum = parseFloat(String(c.expected).replace(',', '.'));
    return !isNaN(gotNum) && !isNaN(expNum);
  });

  return allNumeric;
}

/**
 * Détecte si l'erreur est un problème de format de sortie.
 * Heuristique : la valeur numérique est correcte ou proche, mais le texte diffère.
 */
function detectOutputFormatError(cases) {
  const failedCases = cases.filter(c => !c.passed && !c.reason);
  if (failedCases.length === 0) return false;

  return failedCases.some(c => {
    const got = String(c.got || '');
    const exp = String(c.expected || '');
    
    const normGot = normalizeString(got);
    const normExp = normalizeString(exp);

    // Le texte attendu est contenu dans le texte obtenu (ou vice-versa) après normalisation
    if (normGot.includes(normExp) || normExp.includes(normGot)) return true;
    // La valeur numérique dans chaque chaîne est la même
    const gotNum = parseFloat(got.replace(/[^\d.,]/g, '').replace(',', '.'));
    const expNum = parseFloat(exp.replace(/[^\d.,]/g, '').replace(',', '.'));
    return !isNaN(gotNum) && !isNaN(expNum) && Math.abs(gotNum - expNum) < 0.01;
  });
}

/**
 * Génère les points corrects à partir de l'analyse du code.
 */
function buildCorrectPoints(source, declaredVars, lessonContext) {
  const points = [];
  const upperSrc = source.toUpperCase();

  // Structure de base
  if (hasKeyword(source, 'ALGORITHME') || hasKeyword(source, 'DEBUT')) {
    points.push("La structure de l'algorithme est en place.");
  }
  if (hasKeyword(source, 'VARIABLE') || hasKeyword(source, 'VARIABLES')) {
    points.push("La section de déclaration des variables est présente.");
  }

  // I/O
  const lirePresent   = hasKeyword(source, 'LIRE');
  const ecrirePresent = /ECRIRE|AFFICHER/i.test(source);
  if (lirePresent)   points.push("Les entrées utilisateur sont bien lues avec LIRE.");
  if (ecrirePresent) points.push("La sortie est affichée avec ECRIRE / AFFICHER.");

  // Variables déclarées attendues
  const requiredKeywords = lessonContext?.required_keywords || [];
  const expectedVarsFromKeywords = requiredKeywords
    .filter(kw => !IO_KEYWORDS.includes(kw.toUpperCase()) && !STRUCTURAL_KEYWORDS.includes(kw.toUpperCase()) && !LOGIC_KEYWORDS.includes(kw.toUpperCase()))
    .filter(kw => declaredVars.includes(kw.toLowerCase()));

  if (expectedVarsFromKeywords.length > 0) {
    points.push(`Les variables attendues sont déclarées : ${expectedVarsFromKeywords.join(', ')}.`);
  } else if (declaredVars.length > 0) {
    points.push(`${declaredVars.length} variable(s) déclarée(s) correctement.`);
  }

  return points;
}

/**
 * Génère les points d'erreur et l'indice selon le type d'erreur détecté.
 */
function buildErrorPointsAndHint(errorType, source, cases, declaredVars, lessonContext, astErrors) {
  const errorPoints = [];
  let hint = '';

  const description = lessonContext?.description || lessonContext?.title || '';
  const failedCases = cases.filter(c => !c.passed);

  // Cherche les variables de calcul dans les cas échoués et le code
  const calcVarNames = declaredVars.filter(v =>
    !/lire|ecrire|afficher/i.test(v) &&
    !['debut','fin','si','sinon','pour','tantque'].includes(v) &&
    failedCases.some(c => {
      const regex = new RegExp(v, 'i');
      return regex.test(source.match(/DEBUT[\s\S]*/i)?.[0] || '');
    })
  );

  switch (errorType) {
    case ERROR_TYPES.SYNTAX_ERROR: {
      const firstError = astErrors?.syntaxErrors?.[0] || astErrors?.lexicalErrors?.[0];
      if (firstError) {
         errorPoints.push(`Le validateur a rejeté votre algorithme (Ligne ${firstError.line}).`);
         errorPoints.push(firstError.message);
      } else {
         errorPoints.push("Structure incorrecte détectée dans votre algorithme.");
      }
      hint = "Vérifiez que toutes les parenthèses, crochets et blocs algorithmiques (DEBUT/FIN) sont fermés.";
      break;
    }

    case ERROR_TYPES.SEMANTIC_ERROR: {
      const firstError = astErrors?.semanticErrors?.[0];
      if (firstError) {
         errorPoints.push(`Utilisation incorrecte détectée (Ligne ${firstError.line}):`);
         errorPoints.push(firstError.message);
      } else {
         errorPoints.push("Une variable, matrice ou élément algorithmique a été utilisé(e) sans respecter ses contraintes.");
      }
      hint = "Lisez attentivement l'erreur affichée ci-dessus. Cela indique par exemple un oubli d'indices pour un tableau.";
      break;
    }
    case ERROR_TYPES.CALC_ERROR: {
      // Trouver la variable de résultat (la plus probable)
      const resultVar = calcVarNames.find(v => {
        const regex = new RegExp(`${v}\\s*<-[^;\\n]*[+\\-*/]`, 'i');
        return regex.test(source);
      }) || calcVarNames[0];

      errorPoints.push("Le calcul principal ne correspond pas au résultat attendu.");
      if (resultVar) {
        errorPoints.push(`La formule dans l'affectation de '${resultVar}' semble incorrecte.`);
        hint = `Vérifie l'opération utilisée dans l'affectation de \`${resultVar}\`. Assure-toi d'utiliser les bons opérateurs (+, -, *, /) et dans le bon ordre.`;
      } else {
        hint = "Vérifie la formule de calcul : assure-toi que les bons opérateurs (+, -, *, /) sont utilisés et dans le bon ordre.";
      }

      // Ajout d'une explication chiffrée pour le premier cas échoué
      const firstFail = failedCases[0];
      if (firstFail) {
        const exp = parseFloat(String(firstFail.expected).replace(',', '.'));
        const got = parseFloat(String(firstFail.got).replace(',', '.'));
        if (!isNaN(exp) && !isNaN(got)) {
          if (got < exp) {
            errorPoints.push(`Le résultat obtenu (${got}) est trop faible (attendu : ${exp}).`);
          } else {
            errorPoints.push(`Le résultat obtenu (${got}) est trop élevé (attendu : ${exp}).`);
          }
        }
      }
      break;
    }

    case ERROR_TYPES.OUTPUT_FORMAT: {
      errorPoints.push("La valeur calculée semble correcte, mais le format d'affichage est différent de ce qui est attendu.");
      const firstFail = failedCases[0];
      if (firstFail) {
        const got = String(firstFail.got || '');
        const exp = String(firstFail.expected || '');
        
        // Détecter si les chaînes sont visuellement identiques mais physiquement différentes
        // On enlève TOUS les blancs pour comparer la "chair" du texte
        const visuallySame = got.replace(/\s/g, '') === exp.replace(/\s/g, '');
        
        if (visuallySame && got !== exp) {
          errorPoints.push(`Obtenu : "${got}" (${got.length} ch.) — Attendu : "${exp}" (${exp.length} ch.)`);
          errorPoints.push("💡 Une différence invisible (espace insécable, tabulation ou retour à la ligne) a été détectée.");
        } else {
          errorPoints.push(`Obtenu : "${got}" — Attendu : "${exp}"`);
        }
      }
      hint = "Vérifie le texte affiché avec ECRIRE : la phrase, les espaces, et la ponctuation doivent correspondre exactement au format demandé.";
      break;
    }

    case ERROR_TYPES.MISSING_ELEMENT: {
      const missingKws = (lessonContext?.required_keywords || []).filter(kw =>
        !new RegExp(`\\b${kw}\\b`, 'i').test(source)
      );
      if (missingKws.length > 0) {
        missingKws.forEach(kw => errorPoints.push(`Le mot-clé ou élément requis '${kw}' est absent.`));
        hint = `Ajoute le(s) élément(s) manquant(s) : ${missingKws.join(', ')}.`;
      } else {
        errorPoints.push("Un élément structurel attendu semble manquer dans l'algorithme.");
        hint = "Vérifie que toutes les parties de l'algorithme sont bien présentes (déclaration, lecture, calcul, affichage).";
      }
      break;
    }

    case ERROR_TYPES.RUNTIME_ERROR: {
      const firstFail = failedCases.find(c => c.reason);
      errorPoints.push("Le code produit une erreur lors de l'exécution.");
      if (firstFail?.reason) errorPoints.push(firstFail.reason);
      hint = "Corrige d'abord les erreurs d'exécution (tu peux utiliser le bouton 'Tester'). Ensuite valide à nouveau.";
      break;
    }

    default: { // LOGIC_ERROR
      errorPoints.push("La logique de l'algorithme ne produit pas le résultat attendu.");
      if (description) {
        errorPoints.push(`Rappel de l'objectif : ${description.substring(0, 120)}${description.length > 120 ? '…' : ''}`);
      }
      hint = "Relis l'énoncé attentivement et retrace l'algorithme étape par étape avec un exemple simple.";
      break;
    }
  }

  return { errorPoints, hint };
}

/**
 * Détecte les erreurs fréquentes parmi les patterns connus.
 */
function detectCommonMistakes(source, declaredVars, cases) {
  const detected = [];
  for (const mistake of COMMON_MISTAKES) {
    try {
      if (mistake.test(source, declaredVars, cases)) {
        detected.push(mistake.message);
      }
    } catch (_) { /* ignore */ }
  }
  return detected;
}

// ─── Fonction principale ─────────────────────────────────────────────────────

/**
 * Analyse les résultats d'une validation échouée et retourne un rapport pédagogique.
 *
 * @param {string} source - Le code BQL de l'utilisateur
 * @param {Array}  evaluatedCases - Tableau de { input, expected, got, passed, reason }
 * @param {Object} lessonContext - { required_keywords?, description?, title?, exercise_text? }
 * @param {Object} astErrors - { lexicalErrors, syntaxErrors, semanticErrors, runtimeErrors } récupérés via un dryRun
 * @returns {Object} FeedbackReport
 */
export function analyzeFeedback(source, evaluatedCases, lessonContext = {}, astErrors = {}) {
  try {
    const cases = evaluatedCases || [];
    const src   = source || '';

    // ── 1. Extraction du code ────────────────────────────────────────────────
    let declaredVars = [];
    try {
      declaredVars = extractDeclaredVars(src);
    } catch (e) {
      console.error("[Validator] Error in extractDeclaredVars:", e);
    }

    // ── 2. Détection du type d'erreur ────────────────────────────────────────
    
    // Check if there's a strict interpreter crash
    const hasInterpreterCrash = cases.some(c => c._interpreter_crash === true);
    
    const hasRuntimeError = cases.some(c => c.reason && !c._interpreter_crash && (
      c.reason.toLowerCase().includes('erreur') ||
      c.reason.toLowerCase().includes('exécution')
    ));

    // Vérifier si des mots-clés requis sont manquants
    const requiredKeywords = lessonContext?.required_keywords || [];
    const missingKeywords  = requiredKeywords.filter(kw =>
      !new RegExp(`\\b${kw}\\b`, 'i').test(src)
    );
    const hasMissingElements = missingKeywords.length > 0;

    let errorType = ERROR_TYPES.LOGIC_ERROR;
    
    if (hasInterpreterCrash) {
      errorType = ERROR_TYPES.INTERPRETER_INTERNAL_ERROR;
    } else if (astErrors?.lexicalErrors?.length > 0 || astErrors?.syntaxErrors?.length > 0) {
      errorType = ERROR_TYPES.SYNTAX_ERROR;
    } else if (astErrors?.semanticErrors?.length > 0) {
      errorType = ERROR_TYPES.SEMANTIC_ERROR;
    } else if (astErrors?.runtimeErrors?.length > 0 || hasRuntimeError) {
      errorType = ERROR_TYPES.RUNTIME_ERROR;
    } else if (hasMissingElements) {
      errorType = ERROR_TYPES.MISSING_ELEMENT;
    } else if (detectCalcError(src, cases, declaredVars)) {
      errorType = ERROR_TYPES.CALC_ERROR;
    } else if (detectOutputFormatError(cases)) {
      errorType = ERROR_TYPES.OUTPUT_FORMAT;
    }

    if (errorType === ERROR_TYPES.INTERPRETER_INTERNAL_ERROR) {
      return {
        title: "Validation impossible",
        subtitle: "L'interpréteur a rencontré une erreur interne grave lors de l'exécution de votre code.",
        errorType,
        closeness: 0,
        correctPoints: ["Le code a été soumis au système."],
        errorPoints: ["Votre code n'est pas nécessairement faux, mais notre moteur n'a pas pu l'exécuter jusqu'au bout sans planter !"],
        hint: "Ce n'est pas de votre faute. Vous pouvez essayer de commenter des parties de votre code ou contacter le support.",
        commonMistakes: [],
        failedCases: cases.filter(c => !c.passed),
        allCases: cases,
      };
    }

    // ── 3. Construction du rapport ───────────────────────────────────────────
    const correctPoints = buildCorrectPoints(src, declaredVars, lessonContext);
    const { errorPoints, hint } = buildErrorPointsAndHint(errorType, src, cases, declaredVars, lessonContext, astErrors);
    const commonMistakes = detectCommonMistakes(src, declaredVars, cases);
    const closeness = computeCloseness(cases);

    // ── 4. Titre adapté ──────────────────────────────────────────────────────
    let title = "Presque !";
    if (errorType === ERROR_TYPES.SYNTAX_ERROR) title = "Erreur de syntaxe";
    else if (errorType === ERROR_TYPES.SEMANTIC_ERROR) title = "Erreur sémantique";
    else if (closeness >= 70) title = "Tu y es presque !";
    else if (closeness >= 40) title = "Continue, tu progresses !";
    else if (errorType === ERROR_TYPES.RUNTIME_ERROR) title = "Une erreur s'est produite";
    else if (errorType === ERROR_TYPES.MISSING_ELEMENT) title = "Il manque quelque chose";

    // ── 5. Sous-titre adapté ─────────────────────────────────────────────────
    const subtitleMap = {
      [ERROR_TYPES.SYNTAX_ERROR]:    "Le compilateur n'arrive pas à comprendre le code car sa syntaxe / structure est invalide.",
      [ERROR_TYPES.SEMANTIC_ERROR]:  "Le code contient une utilisation invalide de variables, de tableaux ou de fonctions BQL.",
      [ERROR_TYPES.CALC_ERROR]:      "La structure est bonne, mais le calcul n'est pas encore correct.",
      [ERROR_TYPES.OUTPUT_FORMAT]:   "Le calcul semble juste, mais l'affichage ne correspond pas exactement.",
      [ERROR_TYPES.MISSING_ELEMENT]: "Des éléments requis par l'exercice sont absents.",
      [ERROR_TYPES.LOGIC_ERROR]:     "La logique de l'algorithme ne produit pas encore le résultat attendu.",
      [ERROR_TYPES.RUNTIME_ERROR]:   "Le code produit des erreurs lors de l'exécution.",
    };
    const subtitle = subtitleMap[errorType] || "Erreur non reconnue.";

    const failedCases = cases.filter(c => !c.passed);

    return {
      title,
      subtitle,
      errorType,
      closeness,
      correctPoints:  correctPoints.length > 0 ? correctPoints : ["L'algorithme a bien été soumis."],
      errorPoints:    errorPoints.length > 0   ? errorPoints   : ["Le résultat obtenu ne correspond pas à ce qui est attendu."],
      hint,
      commonMistakes,
      failedCases,
      allCases: cases,
    };
  } catch (error) {
    console.error("=========================================");
    console.error("[INTERNAL ERROR] Validator crashed in analyzeFeedback");
    console.error("Code:", source);
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("=========================================");
    return {
      title: "Validation impossible",
      subtitle: "Le système de validation a rencontré une erreur interne.",
      errorType: ERROR_TYPES.VALIDATOR_INTERNAL_ERROR,
      closeness: 0,
      correctPoints: ["Évaluation de la soumission..."],
      errorPoints: [
        "Un plantage interne grave du validateur s'est produit au cours de l'analyse.",
        "Votre code n'est pas nécessairement faux !"
      ],
      hint: "Veuillez réessayer ou vérifier dans l'onglet Exécution si votre code fonctionne correctement.",
      commonMistakes: [],
      failedCases: [],
      allCases: evaluatedCases || [],
    };
  }
}
