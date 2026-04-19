function stripComments(line) {
  return String(line || '').split('//')[0];
}

function cleanLine(line) {
  return stripComments(line).trim();
}

function normalizeKey(name) {
  return String(name || '').trim().toLowerCase();
}

function addUnique(map, key, value) {
  if (!key || map.has(key)) return;
  map.set(key, value);
}

function parseNamesList(part) {
  return String(part || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

function parseTypeName(typePart) {
  return String(typePart || '')
    .replace(/;$/, '')
    .trim();
}

function parseArrayDeclaration(line) {
  const match = line.match(/^Tableau\s+([a-zA-Z_][\w]*)\s*\[([^\]]+)\]\s*:\s*([^;]+);?/i);
  if (!match) return null;

  const name = match[1];
  const dims = match[2].split(',').map((v) => v.trim()).filter(Boolean);
  const typeName = parseTypeName(match[3]);

  return {
    name,
    typeName,
    dimensions: dims.length || 1,
  };
}

function parseVariableDeclaration(line) {
  const match = line.match(/^([a-zA-Z_][\w\s,]*)\s*:\s*([^;]+);?/);
  if (!match) return null;

  return {
    names: parseNamesList(match[1]),
    typeName: parseTypeName(match[2]),
  };
}

function parseConstantDeclaration(line) {
  const match = line.match(/^([a-zA-Z_][\w]*)\s*=\s*[^:;]+:\s*([^;]+);?/);
  if (!match) return null;

  return {
    name: match[1],
    typeName: parseTypeName(match[2]),
  };
}

function parseRecordStart(line) {
  const match = line.match(/^TYPE\s+([a-zA-Z_][\w]*)\s*=\s*ENREGISTREMENT/i);
  if (!match) return null;
  return match[1];
}

function parseRecordField(line) {
  const match = line.match(/^([a-zA-Z_][\w]*)\s*:\s*([^;]+);?/);
  if (!match) return null;
  return {
    name: match[1],
    typeName: parseTypeName(match[2]),
  };
}

function isKeywordLine(line, keyword) {
  const regex = new RegExp(`^${keyword}\\b`, 'i');
  return regex.test(line);
}

export function extractSymbols(code) {
  const variables = new Map();
  const constants = new Map();
  const arrays = new Map();
  const matrices = new Map();
  const types = new Map();
  const recordTypes = new Map();
  const varTypes = new Map();
  const loopVariables = new Set();

  let section = 'header';
  let activeRecord = null;

  const lines = String(code || '').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const upper = line.toUpperCase();

    const recordName = parseRecordStart(line);
    if (recordName) {
      activeRecord = recordName;
      section = 'record';
      addUnique(types, normalizeKey(recordName), {
        name: recordName,
        kind: 'record',
      });
      if (!recordTypes.has(normalizeKey(recordName))) {
        recordTypes.set(normalizeKey(recordName), {
          name: recordName,
          fields: [],
        });
      }
      continue;
    }

    if (activeRecord) {
      if (isKeywordLine(line, 'FIN')) {
        activeRecord = null;
        section = 'header';
        continue;
      }

      const field = parseRecordField(line);
      if (field) {
        const record = recordTypes.get(normalizeKey(activeRecord));
        if (record) {
          record.fields.push({
            name: field.name,
            typeName: field.typeName,
            key: normalizeKey(field.name),
          });
        }
      }
      continue;
    }

    if (isKeywordLine(line, 'DEBUT')) {
      section = 'body';
      continue;
    }
    if (isKeywordLine(line, 'CONSTANTE') || isKeywordLine(line, 'CONSTANTES')) {
      section = 'constants';
      continue;
    }
    if (isKeywordLine(line, 'VARIABLE') || isKeywordLine(line, 'VARIABLES')) {
      section = 'variables';
      continue;
    }
    if (isKeywordLine(line, 'TYPE')) {
      const typeMatch = line.match(/^TYPE\s+([a-zA-Z_][\w]*)/i);
      if (typeMatch) {
        addUnique(types, normalizeKey(typeMatch[1]), {
          name: typeMatch[1],
          kind: 'type',
        });
      }
      continue;
    }

    const loopMatch = line.match(/\bPOUR\s+([a-zA-Z_][\w]*)\s+ALLANT\s+DE\b/i);
    if (loopMatch) {
      loopVariables.add(loopMatch[1]);
    }

    if (section === 'constants') {
      const constant = parseConstantDeclaration(line);
      if (constant) {
        addUnique(constants, normalizeKey(constant.name), {
          name: constant.name,
          typeName: constant.typeName,
        });
      }
    }

    if (section === 'variables') {
      const arrayDecl = parseArrayDeclaration(line);
      if (arrayDecl) {
        const key = normalizeKey(arrayDecl.name);
        const payload = {
          name: arrayDecl.name,
          typeName: arrayDecl.typeName,
          dimensions: arrayDecl.dimensions,
        };
        if (arrayDecl.dimensions >= 2) {
          addUnique(matrices, key, payload);
        } else {
          addUnique(arrays, key, payload);
        }
        addUnique(variables, key, {
          name: arrayDecl.name,
          typeName: arrayDecl.typeName,
          kind: arrayDecl.dimensions >= 2 ? 'matrix' : 'array',
        });
        varTypes.set(key, arrayDecl.typeName);
        continue;
      }

      const decl = parseVariableDeclaration(line);
      if (decl) {
        for (const name of decl.names) {
          const key = normalizeKey(name);
          addUnique(variables, key, {
            name,
            typeName: decl.typeName,
            kind: 'variable',
          });
          varTypes.set(key, decl.typeName);
        }
      }
    }
  }

  return {
    variables: Array.from(variables.values()),
    constants: Array.from(constants.values()),
    arrays: Array.from(arrays.values()),
    matrices: Array.from(matrices.values()),
    types: Array.from(types.values()),
    recordTypes,
    varTypes,
    loopVariables: Array.from(loopVariables),
  };
}

export function resolveRecordFields(symbols, baseName, path = []) {
  if (!symbols) return [];

  const startType = symbols.varTypes.get(normalizeKey(baseName));
  if (!startType) return [];

  let currentType = startType;
  for (const segment of path) {
    const record = symbols.recordTypes.get(normalizeKey(currentType));
    if (!record) return [];

    const field = record.fields.find((entry) => entry.key === normalizeKey(segment));
    if (!field) return [];
    currentType = field.typeName;
  }

  const record = symbols.recordTypes.get(normalizeKey(currentType));
  return record ? record.fields : [];
}
