/**
 * getContext.js
 * -----------------------------------------------------------------------------
 * Logique métier pour détecter les variables déclarées et extraire
 * le mot courant à autocompléter à partir du texte.
 * -----------------------------------------------------------------------------
 */

export function getCurrentWord(code, cursorPos) {
  const textBefore = code.slice(0, cursorPos);
  const match = textBefore.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
  
  if (!match) return { word: '', start: cursorPos, end: cursorPos };

  const word = match[0];
  return {
    word,
    start: cursorPos - word.length,
    end: cursorPos
  };
}

export function parseVariables(code) {
  const vars = [];
  const added = new Set(); 
  
  // Section VARIABLES jusqu'à DEBUT
  const varMatch = code.match(/VARIABLES\s*:([\s\S]*?)(?:DEBUT|$)/i);
  if (!varMatch) return [];

  const lines = varMatch[1].split('\n');
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('//')) continue;

    const colonIndex = cleanLine.indexOf(':');
    if (colonIndex > 0) {
      const namesPart = cleanLine.slice(0, colonIndex).trim();
      const typePart = cleanLine.slice(colonIndex + 1).replace(';', '').trim();
      
      const names = namesPart.split(',').map(n => n.trim());
      for (const name of names) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && !added.has(name)) {
          added.add(name);
          vars.push({
            label: name,
            type: 'variable',
            insertText: name,
            detail: `Variable (${typePart || 'Type inconnu'})`
          });
        }
      }
    }
  }

  return vars;
}

