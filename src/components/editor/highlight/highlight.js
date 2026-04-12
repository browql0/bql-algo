/**
 * highlight.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mini-lexer purement UI basé sur des expressions régulières pour la 
 * coloration syntaxique. Contrairement au Lexer principal qui supprime les
 * espaces et retours à la ligne, ce tokeniser PRESERVE tout le texte, ce
 * qui est indispensable pour un calque de surbrillance (overlay).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const KEYWORDS = [
  'ALGORITHME', 'VARIABLES', 'VARIABLE','TYPE', 'CONSTANTES', 'CONSTANTE', 'DEBUT', 'FIN',
  'SI', 'ALORS', 'SINON', 'FINSI',
  'SELON', 'CAS', 'AUTRE', 'FINSELON',
  'TANTQUE', 'FAIRE', 'FINTANTQUE',
  'POUR', 'ALLANT', 'FINPOUR',
  'REPETER', 'JUSQUA'
];

const TYPES = ['ENTIER', 'REEL', 'CHAINE', 'CARACTERE', 'BOOLEEN'];
// 'CHAINE DE CARACTERE' est divisé en plusieurs tokens par la regex par défaut.
// C'est gérable en UI.

const FUNCTIONS = ['ECRIRE', 'LIRE'];
const BOOLEANS = ['VRAI', 'FAUX'];
const OPERATORS = ['<-', '←', '=', '<>', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '^', 'ET', 'OU', 'NON'];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& = whole matched string
}

const keywordsRegex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'i');
const typesRegex = new RegExp(`\\b(${TYPES.join('|')})\\b`, 'i');
const functionsRegex = new RegExp(`\\b(${FUNCTIONS.join('|')})\\b`, 'i');
const booleansRegex = new RegExp(`\\b(${BOOLEANS.join('|')})\\b`, 'i');

// Trier les opérateurs du plus long au plus court pour éviter un masquage partiel
const operatorsSorted = [...OPERATORS].sort((a,b) => b.length - a.length);
const operatorsRegex = new RegExp(`(${operatorsSorted.map(escapeRegExp).join('|')})`, 'i');

// Le lexer principal : retourne un tableau de tokens { type, value }
export function tokenizeForHighlight(text) {
  const tokens = [];
  let currentString = '';
  
  // Utilisation de .matchAll() n'est pas possible si on veut découper séquentiellement,
  // donc boucle de scan sur le texte.
  let i = 0;
  
  while (i < text.length) {
    // 1. Espaces (crucial pour l'UI)
    const wsMatch = text.slice(i).match(/^(\s+)/);
    if (wsMatch) {
      tokens.push({ type: 'whitespace', value: wsMatch[1] });
      i += wsMatch[1].length;
      continue;
    }
    
    // 2. Commentaires de ligne
    const commentMatch = text.slice(i).match(/^(\/\/.*)/);
    if (commentMatch) {
      tokens.push({ type: 'comment', value: commentMatch[1] });
      i += commentMatch[1].length;
      continue;
    }
    
    // 3. Chaînes ("...")
    const strMatch = text.slice(i).match(/^("[^"]*")/);
    if (strMatch) {
      tokens.push({ type: 'string', value: strMatch[1] });
      i += strMatch[1].length;
      continue;
    }

    // 4. Caractères ('.')
    const charMatch = text.slice(i).match(/^('[^']*')/);
    if (charMatch) {
      tokens.push({ type: 'string', value: charMatch[1] }); // Même style que les chaînes
      i += charMatch[1].length;
      continue;
    }
    
    // 5. Nombres
    const numMatch = text.slice(i).match(/^(\d+(?:\.\d+)?)/);
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[1] });
      i += numMatch[1].length;
      continue;
    }
    
    // 6. Mots (Mots-clés, Types, Fonctions, Booléens, ou Identifiants Variables)
    const wordMatch = text.slice(i).match(/^([a-zA-Z_]\w*)/);
    if (wordMatch) {
      const word = wordMatch[1];
      let type = 'identifier';
      
      if (keywordsRegex.test(word)) type = 'keyword';
      else if (typesRegex.test(word)) type = 'type';
      else if (functionsRegex.test(word)) type = 'function';
      else if (booleansRegex.test(word)) type = 'boolean';
      
      tokens.push({ type, value: word });
      i += word.length;
      continue;
    }
    
    // 7. Opérateurs Multi-caractères (ou ET/OU/NON déjà gérés par wordMatch)
    // On re-teste les symboles <-, +, etc.
    const symbolMatch = text.slice(i).match(new RegExp(`^(<-|←|<=|>=|!=|=|\\+|-|\\*|\\/|%|\\^|<|>|\\(|\\)|\\[|\\]|:|;|,)`));
    if (symbolMatch) {
      const symbol = symbolMatch[1];
      const type = /[(|)|\[|\]|:|;|,|.]/.test(symbol) ? 'punctuation' : 'operator';
      tokens.push({ type, value: symbol });
      i += symbol.length;
      continue;
    }
    
    // 8. Inconnu / Autre (fallback de 1 char)
    tokens.push({ type: 'unknown', value: text[i] });
    i++;
  }
  
  return tokens;
}

// ── Analyseur Structurel ───────────────────────────────────────────────────────

export function tokenizeAndMapStructure(text) {
  const codeLines = text.split('\n');
  const result = [];
  
  const OPENERS = ['SI', 'SELON', 'POUR', 'TANTQUE', 'REPETER', 'DEBUT'];
  const CLOSERS = ['FINSI', 'FINSELON', 'FINPOUR', 'FINTANTQUE', 'JUSQUA', 'FIN'];
  // SINON, CAS, AUTRE sont des mots-clés de relais liés à un parent. On ne les empile pas.
  
  // La pile contient { kw: string, col: number, hasError: boolean }
  let stack = [];
  
  for (let lineIdx = 0; lineIdx < codeLines.length; lineIdx++) {
    const lineText = codeLines[lineIdx];
    const tokens = tokenizeForHighlight(lineText);
    
    // On conserve la pile d'ouvertures AVANT de parcourir la ligne
    const stackBefore = [...stack];
    
    let currentTokenCol = 0;
    let lastRelevantKw = null;

    for (const t of tokens) {
      if (t.type === 'keyword' || t.type === 'identifier') {
        const kw = t.value.toUpperCase();
        
        // Anti "SINON SI" : 
        const isSinonSi = (kw === 'SI' && lastRelevantKw === 'SINON');
        if (!isSinonSi && t.type === 'keyword') {
          if (OPENERS.includes(kw)) {
             stack.push({ kw, col: currentTokenCol, hasError: false });
          } else if (CLOSERS.includes(kw)) {
             if (stack.length > 0) stack.pop();
          }
        }
        lastRelevantKw = kw;
      }
      currentTokenCol += t.value.length;
    }
    
    // La ligne guide n'est visible que sur les lignes strictement internes.
    // Exclusion parfaite de la ligne d'ouverture et de fermeture grâce à l'intersection.
    const activeGuides = stackBefore.filter(b => stack.includes(b));
    
    result.push({
       lineId: lineIdx,
       tokens: tokens,
       guides: activeGuides.map(g => ({ col: g.col, isError: g.hasError }))
    });
  }

  return result;
}
