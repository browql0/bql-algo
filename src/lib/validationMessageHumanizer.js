const SERVER_ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'INVALID_TOKEN',
  'SERVER_NOT_CONFIGURED',
  'BACKEND_TIMEOUT',
  'BACKEND_UNREACHABLE',
  'MALFORMED_VALIDATION_RESPONSE',
  'SERVER_EXCEPTION',
  'SUPABASE_AUTH_FAILED',
  'TESTS_MISSING',
]);

const CATEGORY_TITLES = {
  syntax: 'Erreur de syntaxe',
  semantic: 'Erreur de declaration',
  runtime: "Erreur pendant l'execution",
  logic: 'Erreur de logique',
  output: 'Erreur de sortie',
  constraint: 'Contrainte manquante',
  server: 'Erreur de validation',
  success: 'Solution valide',
  validation: 'Validation échouée',
};

function asText(value) {
  return String(value || '').trim();
}

function normalizeText(value) {
  return asText(value)
    .replace(/\s+/g, ' ')
    .replace(/\s*(?:-|\u2014)\s*Attendu\s*:\s*"?[^"]+"?/gi, '')
    .trim();
}

function buildMessage({
  title,
  problem,
  fix,
  example = null,
  testNext = null,
  alreadyCorrect = [],
  tone = 'validation',
  debug = null,
}) {
  return {
    title,
    problem,
    fix,
    example,
    testNext,
    alreadyCorrect,
    tone,
    debug,
  };
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function debugFrom(input, context = {}) {
  const raw = {
    code: input?.code || context?.errorCode || null,
    type: input?.type || null,
    message: input?.message || context?.message || null,
    hint: input?.hint || null,
    details: context?.details || null,
    httpStatus: context?.httpStatus || null,
  };

  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== null && value !== ''),
  );
}

export function humanizeParserError(error = {}) {
  const raw = asText(error.message || error);
  const text = normalizeText(raw);
  const lower = text.toLowerCase();
  const debug = debugFrom(error);

  if (hasAny(lower, [/utiliser constante.*une seule constante/, /constantes.*une seule constante/])) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: "Tu as utilise CONSTANTES alors qu'une seule constante est declaree.",
      fix: 'Remplace CONSTANTES par CONSTANTE.',
      example: 'CONSTANTE\nTVA = 0.2 : REEL;',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('point-virgule manquant')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: "Il manque un point-virgule a la fin d'une instruction.",
      fix: "Ajoute ; apres la declaration, l'affectation, LIRE(...) ou ECRIRE(...).",
      example: 'total <- prix * quantite;\nECRIRE(total);',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('algorithme') && lower.includes('attendu')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: 'Le programme ne commence pas par un en-tete BQL valide.',
      fix: 'Commence par ALGORITHME_Nom; puis ajoute DEBUT et FIN.',
      example: 'ALGORITHME_Exercice;\nDEBUT\n  ECRIRE(1);\nFIN',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('debut') && lower.includes('attendu')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: "Le bloc principal du programme ne commence pas encore.",
      fix: 'Ajoute DEBUT avant les instructions.',
      example: 'DEBUT\n  ECRIRE(resultat);\nFIN',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('fin') && lower.includes('attendu')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: "Le programme ou un bloc n'est pas ferme.",
      fix: 'Ajoute le mot de fermeture attendu, par exemple FIN, FINSI ou FINPOUR.',
      example: 'SI condition ALORS\n  ECRIRE(1);\nFINSI',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('alors') && lower.includes('attendu')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: 'La condition SI est incomplete.',
      fix: 'Ajoute ALORS apres la condition.',
      example: 'SI nombre > 0 ALORS\n  ECRIRE(nombre);\nFINSI',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('sinon si')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: 'BQL utilise un seul mot pour une condition intermediaire.',
      fix: 'Remplace SINON SI par SINONSI.',
      example: 'SINONSI note >= 10 ALORS',
      tone: 'syntax',
      debug,
    });
  }

  if (lower.includes('attendu')) {
    return buildMessage({
      title: CATEGORY_TITLES.syntax,
      problem: 'Une partie de la structure BQL est incomplete.',
      fix: "Corrige le mot-cle ou ajoute l'element manquant a cet endroit.",
      example: null,
      tone: 'syntax',
      debug,
    });
  }

  return buildMessage({
    title: CATEGORY_TITLES.syntax,
    problem: text || 'Le validateur ne comprend pas encore cette ligne.',
    fix: error.hint || 'Verifie les mots-cles, les parentheses et les points-virgules.',
    example: null,
    tone: 'syntax',
    debug,
  });
}

export function humanizeSemanticError(error = {}) {
  const raw = asText(error.message || error);
  const text = normalizeText(raw);
  const lower = text.toLowerCase();
  const debug = debugFrom(error);

  if (hasAny(lower, [/non declare/, /non d.clar/])) {
    return buildMessage({
      title: CATEGORY_TITLES.semantic,
      problem: "Tu utilises une variable qui n'est pas declaree.",
      fix: 'Declare cette variable dans VARIABLE ou VARIABLES avant DEBUT.',
      example: 'VARIABLE\nresultat : REEL;',
      tone: 'semantic',
      debug,
    });
  }

  if (hasAny(lower, [/deja declare/, /d.j. d.clar/])) {
    return buildMessage({
      title: CATEGORY_TITLES.semantic,
      problem: 'Le meme nom est declare plusieurs fois.',
      fix: 'Garde une seule declaration pour ce nom.',
      example: null,
      tone: 'semantic',
      debug,
    });
  }

  if (lower.includes('constante') && hasAny(lower, [/modifier/, /affecter/])) {
    return buildMessage({
      title: CATEGORY_TITLES.semantic,
      problem: 'Tu essaies de changer une constante.',
      fix: 'Utilise une variable pour les valeurs qui doivent changer.',
      example: 'VARIABLE\ntotal : REEL;',
      tone: 'semantic',
      debug,
    });
  }

  if (hasAny(lower, [/type/, /entier/, /reel/, /r.el/, /chaine/, /cha.ne/])) {
    return buildMessage({
      title: CATEGORY_TITLES.semantic,
      problem: 'Une valeur ne correspond pas au type attendu.',
      fix: 'Verifie les types declares et les valeurs affectees.',
      example: 'VARIABLE\nage : ENTIER;\nprix : REEL;',
      tone: 'semantic',
      debug,
    });
  }

  return buildMessage({
    title: CATEGORY_TITLES.semantic,
    problem: text || 'Une declaration ou une utilisation de variable pose probleme.',
    fix: error.hint || 'Verifie les declarations, les types et les noms de variables.',
    example: null,
    tone: 'semantic',
    debug,
  });
}

function humanizeServerError(input = {}, context = {}) {
  const code = input.code || context.errorCode;
  const debug = debugFrom(input, context);

  const byCode = {
    AUTH_REQUIRED: {
      problem: 'Tu dois etre connecte pour valider officiellement.',
      fix: 'Connecte-toi, puis relance la validation.',
    },
    INVALID_TOKEN: {
      problem: 'Ta session a expire.',
      fix: 'Reconnecte-toi, puis reessaie.',
    },
    SERVER_NOT_CONFIGURED: {
      problem: "Le serveur de validation n'est pas configure.",
      fix: 'Ajoute les variables Supabase serveur, puis redemarre le serveur.',
    },
    BACKEND_TIMEOUT: {
      problem: 'Le serveur a mis trop de temps a repondre.',
      fix: 'Reessaie dans quelques secondes.',
    },
    BACKEND_UNREACHABLE: {
      problem: 'Le navigateur ne peut pas joindre le serveur de validation.',
      fix: 'Verifie que /api/submit est disponible, puis relance la validation.',
    },
    MALFORMED_VALIDATION_RESPONSE: {
      problem: "La route de validation n'a pas renvoye une reponse JSON lisible.",
      fix: 'Redemarre le serveur local et verifie que /api/submit pointe vers le backend.',
    },
    TESTS_MISSING: {
      problem: "Aucun test serveur n'est configure pour cet exercice.",
      fix: 'Ajoute des tests cachés avant de publier ce challenge.',
    },
  };

  const copy = byCode[code] || {
    problem: 'Le serveur de validation a rencontre une erreur.',
    fix: "Reessaie, puis consulte les details techniques si l'erreur continue.",
  };

  return buildMessage({
    title: CATEGORY_TITLES.server,
    problem: copy.problem,
    fix: copy.fix,
    example: null,
    tone: 'server',
    debug,
  });
}

function humanizeKnownValidationCode(input = {}, context = {}) {
  const code = input.code || context.errorCode;
  const debug = debugFrom(input, context);

  const byCode = {
    OUTPUT_FORMAT: {
      title: CATEGORY_TITLES.output,
      problem: "Ton calcul semble bon, mais l'affichage contient trop de texte.",
      fix: 'Affiche uniquement la valeur demandee, sans phrase ni libelle.',
      example: 'ECRIRE(total);',
      tone: 'output',
    },
    NO_OUTPUT: {
      title: CATEGORY_TITLES.output,
      problem: "Ton programme n'affiche aucun resultat.",
      fix: 'Ajoute ECRIRE(...) avec la valeur finale.',
      example: 'ECRIRE(resultat);',
      tone: 'output',
    },
    OUTPUT_MISMATCH: {
      title: CATEGORY_TITLES.logic,
      problem: "Le programme s'execute, mais le resultat calcule n'est pas encore le bon.",
      fix: 'Verifie la formule utilisee pour calculer la valeur finale.',
      example: null,
      testNext: input.testNext || 'Teste avec de petites valeurs faciles a verifier a la main.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    PARTIAL_FORMULA: {
      title: CATEGORY_TITLES.logic,
      problem: 'Ta formule marche dans certains cas, mais pas dans tous.',
      fix: "Compare un test qui passe et un test qui echoue pour trouver l'entree oubliee.",
      example: null,
      testNext: input.testNext || 'Change une seule entree a la fois et regarde si le resultat change aussi.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    CONSTRAINT_FAILED: {
      title: CATEGORY_TITLES.constraint,
      problem: 'Le resultat peut etre proche, mais une consigne obligatoire manque.',
      fix: input.hint || "Relis la contrainte de l'exercice et ajoute le concept demande.",
      example: null,
      tone: 'constraint',
    },
    MISSING_INPUT: {
      title: CATEGORY_TITLES.logic,
      problem: 'Tu ne lis pas toutes les données demandees.',
      fix: "Ajoute un LIRE(...) pour chaque entree de l'enonce, dans le bon ordre.",
      example: 'LIRE(prixHT);\nLIRE(quantite);',
      tone: 'logic',
    },
    MISSING_QUANTITY: {
      title: CATEGORY_TITLES.logic,
      problem: "Tu calcules un seul article au lieu d'utiliser la quantite.",
      fix: 'Multiplie aussi par la quantite lue en entree.',
      example: 'total <- prixHT * quantite * 1.2;',
      testNext: input.testNext || 'Essaie prixHT = 100 et quantite = 2: le total doit etre 240.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    MISSING_TVA: {
      title: CATEGORY_TITLES.logic,
      problem: 'Tu calcules le total hors taxes, sans la TVA.',
      fix: 'Ajoute les 20% de TVA dans le calcul final.',
      example: 'total <- prixHT * quantite * 1.2;',
      testNext: input.testNext || 'Essaie prixHT = 100 et quantite = 2: sans TVA tu obtiens 200, mais il faut 240.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    ADDITION_INSTEAD_OF_MULTIPLICATION: {
      title: CATEGORY_TITLES.logic,
      problem: 'Tu additionnes probablement deux valeurs qui doivent etre multipliees.',
      fix: 'Multiplie le prix unitaire par la quantite avant de calculer la suite.',
      example: 'totalHT <- prixHT * quantite;',
      testNext: input.testNext || 'Avec prixHT = 100 et quantite = 2, le total HT doit etre 200.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    FIXED_TVA_ADDED: {
      title: CATEGORY_TITLES.logic,
      problem: 'La TVA semble ajoutee comme une valeur fixe.',
      fix: 'Calcule la TVA comme un pourcentage du total HT.',
      example: 'totalTTC <- totalHT * 1.2;',
      testNext: input.testNext || 'Avec totalHT = 200, 20% de TVA donne 240 au total.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    DISPLAYED_INPUT_INSTEAD_OF_TOTAL: {
      title: CATEGORY_TITLES.logic,
      problem: 'Tu affiches probablement une entree ou une variable intermediaire.',
      fix: 'Affiche la variable qui contient le total final.',
      example: 'ECRIRE(totalTTC);',
      testNext: input.testNext || 'Avec prixHT = 100 et quantite = 2, la derniere valeur affichee doit etre 240.',
      alreadyCorrect: input.alreadyCorrect || [],
      tone: 'logic',
    },
    MISSING_DIVISION: {
      title: CATEGORY_TITLES.logic,
      problem: 'Tu as calcule la somme, pas la moyenne.',
      fix: "Divise la somme par le nombre de notes avant d'afficher.",
      example: 'moyenne <- somme / 3;',
      tone: 'logic',
    },
    VALID_SOLUTION: {
      title: CATEGORY_TITLES.success,
      problem: 'Ta solution est acceptee, meme si elle differe de la solution de reference.',
      fix: 'Continue: le validateur juge le comportement, pas les noms de variables.',
      example: null,
      tone: 'success',
    },
  };

  if (!byCode[code]) return null;
  return buildMessage({
    ...byCode[code],
    example: input.example || byCode[code].example,
    testNext: input.testNext || byCode[code].testNext,
    alreadyCorrect: input.alreadyCorrect || byCode[code].alreadyCorrect || [],
    debug,
  });
}

function humanizeByText(input = {}, context = {}) {
  const raw = asText(input.message || context.message);
  const text = normalizeText(raw);
  const lower = text.toLowerCase();
  const debug = debugFrom(input, context);

  if (hasAny(lower, [/utiliser constante.*une seule constante/, /constantes.*une seule constante/])) {
    return humanizeParserError(input);
  }

  if (hasAny(lower, [/constante/, /concept requis/, /contrainte/])) {
    return buildMessage({
      title: CATEGORY_TITLES.constraint,
      problem: text || "Une contrainte obligatoire n'est pas respectee.",
      fix: input.hint || "Ajoute le concept explicitement demande par l'exercice.",
      example: lower.includes('tva') ?'CONSTANTE\nTVA = 0.2 : REEL;' : null,
      tone: 'constraint',
      debug,
    });
  }

  if (hasAny(lower, [/format/, /uniquement/, /sortie/])) {
    return buildMessage({
      title: CATEGORY_TITLES.output,
      problem: 'La sortie ne respecte pas exactement le format demande.',
      fix: input.hint || 'Affiche seulement le resultat final demande.',
      example: 'ECRIRE(resultat);',
      tone: 'output',
      debug,
    });
  }

  return null;
}

export function humanizeValidationMessage(input = {}, context = {}) {
  const diagnostic = typeof input === 'string' ?{ message: input } : input || {};
  const code = diagnostic.code || context.errorCode;
  const type = diagnostic.type || context.type;

  if (diagnostic.problem || diagnostic.fix) {
    return buildMessage({
      title:
        type === 'logic_error'
          ?CATEGORY_TITLES.logic
          : type === 'output_format'
            ?CATEGORY_TITLES.output
            : CATEGORY_TITLES.validation,
      problem: diagnostic.problem || diagnostic.message || context.message,
      fix: diagnostic.fix || diagnostic.hint || context.hint || "Relis l'enonce, puis corrige ce point.",
      example: diagnostic.example || null,
      testNext: diagnostic.testNext || null,
      alreadyCorrect: diagnostic.alreadyCorrect || [],
      tone: type === 'logic_error' ?'logic' : 'validation',
      debug: debugFrom(diagnostic, context),
    });
  }

  if (SERVER_ERROR_CODES.has(code)) {
    return humanizeServerError(diagnostic, context);
  }

  if (type === 'syntax_error' || type === 'lexical_error') {
    return humanizeParserError(diagnostic);
  }

  if (type === 'semantic_error') {
    return humanizeSemanticError(diagnostic);
  }

  if (type === 'runtime_error') {
    return buildMessage({
      title: CATEGORY_TITLES.runtime,
      problem: "Le programme demarre, mais il bloque pendant l'execution.",
      fix: diagnostic.hint || 'Verifie les valeurs lues, les divisions et les indices de tableau.',
      example: null,
      tone: 'runtime',
      debug: debugFrom(diagnostic, context),
    });
  }

  const known = humanizeKnownValidationCode(diagnostic, context);
  if (known) return known;

  const textBased = humanizeByText(diagnostic, context);
  if (textBased) return textBased;

  const problem = normalizeText(diagnostic.message || context.message);
  return buildMessage({
    title: CATEGORY_TITLES.logic,
    problem: problem || 'Le code ne passe pas encore la validation.',
    fix: diagnostic.hint || context.hint || "Relis l'enonce, puis teste ton code avec un exemple simple.",
    testNext: diagnostic.testNext || context.testNext || null,
    alreadyCorrect: diagnostic.alreadyCorrect || [],
    example: null,
    tone: 'logic',
    debug: debugFrom(diagnostic, context),
  });
}

function failedConstraintItems(results = {}) {
  const constraints = results.constraints || {};
  return [
    ...(constraints.required || []),
    ...(constraints.forbidden || []),
  ]
    .filter((item) => item && item.passed === false)
    .map((item) => ({
      type: 'missing_required_concept',
      code: 'CONSTRAINT_FAILED',
      message: item.message || item.label,
      hint: item.hint || null,
    }));
}

function uniqueHumanized(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}:${item.problem}:${item.fix}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildHumanizedValidationFeedback(results = {}) {
  const diagnostics = Array.isArray(results.diagnostics) ?results.diagnostics : [];
  const constraints = failedConstraintItems(results);
  const sourceItems =
    diagnostics.length > 0
      ?diagnostics
      : constraints.length > 0
        ?constraints
        : [
            {
              code: results.errorCode,
              message: results.message,
              hint: results.feedbackReport?.hint,
            },
          ];

  const context = {
    errorCode: results.errorCode,
    message: results.message,
    details: results.details,
    httpStatus: results.httpStatus,
    hint: results.feedbackReport?.hint,
    testNext: results.feedbackReport?.testNext,
  };

  const messages = uniqueHumanized(
    sourceItems.map((item) => humanizeValidationMessage(item, context)),
  );

  return {
    primary: messages[0] || humanizeValidationMessage({}, context),
    secondary: messages.slice(1, 3),
    debug: {
      errorCode: results.errorCode || null,
      message: results.message || null,
      details: results.details || null,
      diagnostics,
      constraints: results.constraints || null,
      feedbackReport: results.feedbackReport || null,
      httpStatus: results.httpStatus || null,
    },
  };
}
