import {
  KEYWORD_GROUPS,
  SNIPPETS,
  TYPE_SUGGESTIONS,
  buildKeywordSuggestions,
} from './suggestions';
import { resolveRecordFields } from './symbols';

const KIND_LABELS = {
  variable: 'variable',
  loop: 'boucle',
  constant: 'constante',
  keyword: 'mot-cle',
  type: 'type',
  snippet: 'snippet',
  field: 'champ',
  array: 'tableau',
  matrix: 'matrice',
  record: 'type',
};

const KIND_PRIORITY = {
  field: 120,
  variable: 110,
  loop: 105,
  constant: 100,
  array: 96,
  matrix: 96,
  keyword: 60,
  type: 50,
  snippet: 40,
};

function withKindLabel(suggestion) {
  const normalizedKind = suggestion.kind || suggestion.type;
  return {
    ...suggestion,
    kind: normalizedKind,
    kindLabel: suggestion.kindLabel || KIND_LABELS[normalizedKind] || 'mot-cle',
  };
}

function makeSuggestion({ label, insertText, detail, kind, priority, cursorOffset }) {
  return withKindLabel({
    label,
    insertText,
    detail,
    kind,
    priority,
    cursorOffset,
  });
}

function buildDeclaredSuggestions(symbols) {
  const results = [];

  symbols.variables.forEach((variable) => {
    results.push(makeSuggestion({
      label: variable.name,
      insertText: variable.name,
      detail: `Variable (${variable.typeName || 'Type inconnu'})`,
      kind: variable.kind === 'matrix' ? 'matrix' : variable.kind === 'array' ? 'array' : 'variable',
      priority: KIND_PRIORITY[variable.kind] || KIND_PRIORITY.variable,
    }));
  });

  symbols.constants.forEach((constant) => {
    results.push(makeSuggestion({
      label: constant.name,
      insertText: constant.name,
      detail: `Constante (${constant.typeName || 'Type inconnu'})`,
      kind: 'constant',
      priority: KIND_PRIORITY.constant,
    }));
  });

  symbols.loopVariables.forEach((name) => {
    results.push(makeSuggestion({
      label: name,
      insertText: name,
      detail: 'Variable de boucle',
      kind: 'loop',
      priority: KIND_PRIORITY.loop,
    }));
  });

  symbols.arrays.forEach((arrayVar) => {
    results.push(makeSuggestion({
      label: `${arrayVar.name}[i]`,
      insertText: `${arrayVar.name}[i]`,
      detail: 'Acces tableau',
      kind: 'array',
      priority: KIND_PRIORITY.array - 5,
      cursorOffset: -2,
    }));
  });

  symbols.matrices.forEach((matrixVar) => {
    results.push(makeSuggestion({
      label: `${matrixVar.name}[i,j]`,
      insertText: `${matrixVar.name}[i,j]`,
      detail: 'Acces matrice',
      kind: 'matrix',
      priority: KIND_PRIORITY.matrix - 5,
      cursorOffset: -4,
    }));
  });

  return results;
}

function buildTypeSuggestions(symbols) {
  const customTypes = (symbols.types || []).map((entry) =>
    makeSuggestion({
      label: entry.name,
      insertText: entry.name,
      detail: 'Type defini',
      kind: 'type',
      priority: KIND_PRIORITY.type + 5,
    }),
  );

  return [...customTypes, ...TYPE_SUGGESTIONS.map((item) => withKindLabel(item))];
}

function buildSnippetSuggestions(section) {
  if (section === 'header') {
    return SNIPPETS.filter((snippet) =>
      ['ALGORITHME', 'CONSTANTE', 'CONSTANTES', 'Tableau', 'ENREGISTREMENT'].some((word) =>
        snippet.label.toUpperCase().includes(word.toUpperCase()),
      ),
    ).map((snippet) => withKindLabel(snippet));
  }

  if (section === 'constants' || section === 'variables' || section === 'record') {
    return SNIPPETS.filter((snippet) =>
      ['CONSTANTE', 'CONSTANTES', 'Tableau', 'ENREGISTREMENT'].some((word) =>
        snippet.label.toUpperCase().includes(word.toUpperCase()),
      ),
    ).map((snippet) => withKindLabel(snippet));
  }

  return SNIPPETS.map((snippet) => withKindLabel(snippet));
}

function buildKeywordPool(section) {
  if (section === 'header') return KEYWORD_GROUPS.header;
  if (section === 'constants' || section === 'variables' || section === 'record') {
    return KEYWORD_GROUPS.declaration;
  }
  return KEYWORD_GROUPS.body;
}

function scoreSuggestion(suggestion, prefix, context) {
  const label = suggestion.label || '';
  const upperLabel = label.toUpperCase();
  const upperPrefix = String(prefix || '').toUpperCase();

  let score = Number(suggestion.priority || 0);

  if (upperPrefix) {
    if (upperLabel === upperPrefix) score += 50;
    if (upperLabel.startsWith(upperPrefix)) score += 35;
    else if (upperLabel.includes(upperPrefix)) score += 15;
  }

  if (context.afterKeyword === 'SELON' && ['variable', 'constant', 'loop'].includes(suggestion.kind)) {
    score += 12;
  }

  if (context.afterKeyword === 'POUR' && suggestion.kind === 'snippet') {
    if (upperLabel.includes('POUR')) score += 18;
  }

  if (context.afterKeyword === 'SI' && suggestion.kind === 'snippet' && upperLabel.includes('SI')) {
    score += 10;
  }

  if ((context.section === 'variables' || context.section === 'constants' || context.section === 'record') && suggestion.kind === 'type') {
    score += 12;
  }

  return score;
}

function withMatchRanges(suggestion, prefix) {
  const upperLabel = String(suggestion.label || '').toUpperCase();
  const upperPrefix = String(prefix || '').toUpperCase();
  if (!upperPrefix) return suggestion;

  const index = upperLabel.indexOf(upperPrefix);
  if (index < 0) return suggestion;

  return {
    ...suggestion,
    matchStart: index,
    matchEnd: index + upperPrefix.length,
  };
}

function dedupeSuggestions(suggestions) {
  const byKey = new Map();

  suggestions.forEach((item) => {
    const key = `${item.kind}:${item.label}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing || Number(item.score || 0) > Number(existing.score || 0)) {
      byKey.set(key, item);
    }
  });

  return Array.from(byKey.values());
}

export function buildSuggestions({ symbols, context }) {
  if (context.isMemberAccess) {
    const fields = resolveRecordFields(symbols, context.member.baseName, context.member.path);
    return fields.map((field) =>
      makeSuggestion({
        label: field.name,
        insertText: field.name,
        detail: `Champ (${field.typeName || 'Type inconnu'})`,
        kind: 'field',
        priority: KIND_PRIORITY.field,
      }),
    );
  }

  const suggestions = [];

  if (context.section === 'body') {
    suggestions.push(...buildDeclaredSuggestions(symbols));
  }

  const keywordPool = buildKeywordPool(context.section);
  suggestions.push(...buildKeywordSuggestions(keywordPool));

  if (context.section === 'constants' || context.section === 'variables' || context.section === 'record' || context.afterColon) {
    suggestions.push(...buildTypeSuggestions(symbols));
  } else if (context.section === 'body') {
    suggestions.push(...TYPE_SUGGESTIONS.map((item) => withKindLabel(item)));
  }

  suggestions.push(...buildSnippetSuggestions(context.section));

  return suggestions.map((item) => withKindLabel(item));
}

export function filterAndRankSuggestions(allSuggestions, prefix, context) {
  const upperPrefix = String(prefix || '').toUpperCase();

  let filtered = allSuggestions;
  if (upperPrefix) {
    filtered = allSuggestions.filter((item) =>
      String(item.label || '').toUpperCase().includes(upperPrefix),
    );
  }

  const ranked = filtered.map((item) => ({
    ...withMatchRanges(item, prefix),
    score: scoreSuggestion(item, prefix, context),
  }));

  return dedupeSuggestions(ranked)
    .sort((a, b) => (b.score || 0) - (a.score || 0) || a.label.localeCompare(b.label))
    .slice(0, 30);
}
