/**
 * getContext.js
 * -----------------------------------------------------------------------------
 * Logique métier pour détecter les variables déclarées et extraire
 * le mot courant à autocompléter à partir du texte.
 * -----------------------------------------------------------------------------
 */

function stripComments(line) {
  return String(line || '').split('//')[0];
}

function cleanLine(line) {
  return stripComments(line).trim();
}

function getCurrentWordRange(code, cursorPos) {
  const textBefore = code.slice(0, cursorPos);
  const match = textBefore.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);

  if (!match) return { word: '', start: cursorPos, end: cursorPos };

  const word = match[0];
  return {
    word,
    start: cursorPos - word.length,
    end: cursorPos,
  };
}

function getMemberContext(code, cursorPos) {
  const textBefore = code.slice(0, cursorPos);
  const match = textBefore.match(/[a-zA-Z_][a-zA-Z0-9_\.]*$/);
  if (!match) return null;

  const token = match[0];
  if (!token.includes('.')) return null;

  const parts = token.split('.');
  const baseName = parts[0];
  const memberPrefix = parts[parts.length - 1] || '';
  const path = parts.slice(1, -1).filter(Boolean);

  return {
    baseName,
    path,
    memberPrefix,
    replaceStart: cursorPos - memberPrefix.length,
    replaceEnd: cursorPos,
  };
}

function lastKeywordIndex(text, regex) {
  let last = -1;
  const matches = text.matchAll(regex);
  for (const match of matches) {
    if (typeof match.index === 'number') last = match.index;
  }
  return last;
}

function detectSection(code, cursorPos) {
  const textBefore = code.slice(0, cursorPos);
  const lines = textBefore.split(/\r?\n/);

  let section = 'header';
  let recordDepth = 0;

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const upper = line.toUpperCase();

    if (recordDepth > 0) {
      if (/^FIN\b/.test(upper)) {
        recordDepth -= 1;
        section = 'header';
      }
      continue;
    }

    if (/^TYPE\b/.test(upper) && upper.includes('ENREGISTREMENT')) {
      recordDepth = 1;
      section = 'record';
      continue;
    }

    if (/^CONSTANTES?\b/.test(upper)) {
      section = 'constants';
      continue;
    }

    if (/^VARIABLES?\b/.test(upper)) {
      section = 'variables';
      continue;
    }

    if (/^DEBUT\b/.test(upper)) {
      section = 'body';
      continue;
    }
  }

  return section;
}

function getPreviousWord(textBefore) {
  const match = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
  return match ? match[1].toUpperCase() : '';
}

export function getAutocompleteContext(code, cursorPos) {
  const member = getMemberContext(code, cursorPos);
  const range = member
    ? { word: member.memberPrefix, start: member.replaceStart, end: member.replaceEnd }
    : getCurrentWordRange(code, cursorPos);

  const textBefore = code.slice(0, cursorPos);
  const lineStart = textBefore.lastIndexOf('\n') + 1;
  const lineEnd = code.indexOf('\n', cursorPos) === -1 ? code.length : code.indexOf('\n', cursorPos);
  const lineText = code.slice(lineStart, lineEnd);
  const prefixOnLine = lineText.slice(0, cursorPos - lineStart);
  const section = detectSection(code, cursorPos);
  const previousWord = getPreviousWord(textBefore);

  return {
    word: range.word,
    replaceStart: range.start,
    replaceEnd: range.end,
    isMemberAccess: Boolean(member),
    member: member || null,
    section,
    afterKeyword: previousWord,
    afterColon: prefixOnLine.includes(':'),
  };
}

