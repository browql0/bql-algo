function visitNode(node, visitor, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  visitor(node);

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) visitNode(item, visitor, seen);
    } else if (value && typeof value === "object") {
      visitNode(value, visitor, seen);
    }
  }
}

function upperSource(source) {
  return String(source || "").toUpperCase();
}

function hasKeyword(source, keyword) {
  return upperSource(source).includes(String(keyword || "").toUpperCase());
}

function regexMatches(source, pattern) {
  if (!pattern) return false;
  if (pattern instanceof RegExp) return pattern.test(source);

  try {
    return new RegExp(pattern, "i").test(source);
  } catch {
    return false;
  }
}

export function analyzeAst(ast) {
  const analysis = {
    inputCount: 0,
    outputCount: 0,
    assignmentCount: 0,
    constantCount: Array.isArray(ast?.constants) ? ast.constants.length : 0,
    inputTargets: [],
    outputArgs: [],
    constants: Array.isArray(ast?.constants) ? ast.constants.map((item) => item.name) : [],
    identifiers: new Set(),
    numericLiterals: [],
  };

  visitNode(ast, (node) => {
    if (node.type === "INPUT") {
      analysis.inputCount += 1;
      const name = node.variable || node.target?.name || null;
      if (name) analysis.inputTargets.push(name);
    }

    if (node.type === "PRINT") {
      analysis.outputCount += 1;
      analysis.outputArgs.push(node.args || []);
    }

    if (node.type === "ASSIGN") {
      analysis.assignmentCount += 1;
    }

    if (node.type === "IDENTIFIER" && node.name) {
      analysis.identifiers.add(node.name);
    }

    if (node.type === "NUMBER") {
      analysis.numericLiterals.push(Number(node.value));
    }
  });

  analysis.identifiers = [...analysis.identifiers];
  return analysis;
}

function checkRequiredConcept(concept, context) {
  const { source, astAnalysis } = context;
  const id = concept.id || concept.concept;
  const minCount = Number(concept.minCount ?? 1);
  let passed = true;
  let actual = 0;

  if (id === "constant" || id === "constant_tva") {
    actual = astAnalysis.constantCount;
    passed = actual >= minCount;
  } else if (id === "read_input" || id === "input_count") {
    actual = astAnalysis.inputCount;
    passed = actual >= minCount;
  } else if (id === "write_output" || id === "output_count") {
    actual = astAnalysis.outputCount;
    passed = actual >= minCount;
  } else if (id === "keyword") {
    const keywords = concept.keywords || [concept.keyword].filter(Boolean);
    actual = keywords.filter((keyword) => hasKeyword(source, keyword)).length;
    passed = keywords.length > 0 && actual === keywords.length;
  } else if (id === "any_keyword" || id === "keyword_any") {
    const keywords = concept.keywords || [];
    actual = keywords.filter((keyword) => hasKeyword(source, keyword)).length;
    passed = actual >= minCount;
  }

  return {
    id,
    label: concept.label || id,
    passed,
    actual,
    expected: minCount,
    severity: concept.severity || "error",
    message:
      concept.message ||
      `Le concept requis '${concept.label || id}' n'est pas respecte.`,
    hint: concept.hint || null,
  };
}

function checkForbiddenPattern(pattern, source) {
  const matched =
    pattern.type === "keyword"
      ? hasKeyword(source, pattern.value)
      : regexMatches(source, pattern.value || pattern.pattern);

  return {
    id: pattern.id || pattern.value || pattern.pattern,
    label: pattern.label || pattern.id || "motif interdit",
    passed: !matched,
    message: pattern.message || "Une structure interdite a ete detectee.",
    hint: pattern.hint || null,
  };
}

export function checkConcepts({ source, ast, requiredConcepts = [], forbiddenPatterns = [] }) {
  const astAnalysis = analyzeAst(ast);
  const context = { source, astAnalysis };
  const required = requiredConcepts.map((concept) =>
    checkRequiredConcept(concept, context),
  );
  const forbidden = forbiddenPatterns.map((pattern) =>
    checkForbiddenPattern(pattern, source),
  );
  const failed = [...required, ...forbidden].filter((check) => !check.passed);

  return {
    passed: failed.length === 0,
    required,
    forbidden,
    failed,
    astAnalysis,
  };
}
