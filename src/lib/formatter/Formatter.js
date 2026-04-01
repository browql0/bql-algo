/**
 * Formatter.js
 * Formateur (Prettier local) pour pseudo-algorithme BQL.
 */

export function formatCode(code, tabSize = 2) {
  // 1. Découper et gérer les espaces multiples en ligne
  const lines = code.split('\n');
  const formattedLines = [];
  
  let stack = [];
  let emptyLineCount = 0;
  
  const getIndentString = (level) => {
    const safeLevel = Math.max(0, level); // au cas où
    return (tabSize === 'tab' ? '\t' : ' '.repeat(parseInt(tabSize))).repeat(safeLevel);
  };

  for (let i = 0; i < lines.length; i++) {
    // Nettoyer la ligne brute (espaces début/fin)
    // On conserve un espace interne unique entre les mots hors chaîne (trop complexe via regex basique, on se limite au trim ici)
    let line = lines[i].trim();
    
    // Gérer les lignes vides successives (ratiboiser)
    if (line === '') {
      emptyLineCount++;
      // On ne garde qu'une seule ligne vide (si ce n'est pas le tout début du fichier)
      if (emptyLineCount === 1 && formattedLines.length > 0) {
        formattedLines.push('');
      }
      continue;
    }
    emptyLineCount = 0; // réinitialiser le compteur de lignes vides
    
    // Identifier le mot-clé principal de la ligne
    const firstWordMatch = line.match(/^([a-zA-Z_]\w*)/);
    let firstWord = firstWordMatch ? firstWordMatch[1].toUpperCase() : null;
    
    // Détecter formes combinées
    if (line.toUpperCase().startsWith('SINON SI')) {
      firstWord = 'SINON_SI';
    } else if (line.toUpperCase().startsWith('FIN SI')) {
      firstWord = 'FINSI';
    } else if (line.toUpperCase().startsWith('FIN SELON')) {
      firstWord = 'FINSELON';
    } else if (line.toUpperCase().startsWith('FIN POUR')) {
      firstWord = 'FINPOUR';
    } else if (line.toUpperCase().startsWith('FIN TANTQUE')) {
      firstWord = 'FINTANTQUE';
    }

    // --- DECROISSANCE D'INDENTATION (Cette ligne ci) ---
    // Si la ligne COMMENCE par un ferme-bloc, on doit la reculer avant de la dessiner.
    if (firstWord === 'DEBUT') {
      if (stack[stack.length - 1] === 'VARIABLES') stack.pop();
    } else if (firstWord === 'FIN') {
      if (stack[stack.length - 1] === 'DEBUT') stack.pop();
    } else if (['FINSI', 'FINSELON', 'FINPOUR', 'FINTANTQUE', 'JUSQUA'].includes(firstWord)) {
      if (firstWord === 'FINSELON') {
         // Sortir d'un `CAS` ou `AUTRE` éventuel
         if (['CAS', 'AUTRE'].includes(stack[stack.length - 1])) stack.pop();
         if (stack[stack.length - 1] === 'SELON') stack.pop();
      } else {
         if (stack.length > 0) stack.pop();
      }
    } else if (['SINON', 'SINON_SI'].includes(firstWord)) {
      if (['SI', 'SINON_SI'].includes(stack[stack.length - 1])) stack.pop();
    } else if (['CAS', 'AUTRE'].includes(firstWord)) {
      if (['CAS', 'AUTRE'].includes(stack[stack.length - 1])) stack.pop();
    }

    // Le niveau courant d'indentation sera la taille de la pile modifiée
    let currentIndentLevel = stack.length;
    
    // --- INSERTION STRICTE DE POINT-VIRGULE (Si demandé structuré) ---
    // Si la ligne n'est pas un bloc et ne se termine pas par ';' ou ':'
    const NO_SEMICOLON_STARTS = [
      'DEBUT', 'FIN', 'SI', 'SINON', 'SINON_SI', 'FINSI', 
      'SELON', 'CAS', 'AUTRE', 'FINSELON', 
      'POUR', 'FINPOUR', 'TANTQUE', 'FINTANTQUE', 
      'REPETER', 'JUSQUA', 'VARIABLES' // variables se finit par :
    ];
    
    if (!line.endsWith(';') && !line.endsWith(':') && line !== 'FIN' && line !== 'DEBUT') {
      if (!line.toUpperCase().endsWith('ALORS') && !line.toUpperCase().endsWith('FAIRE')) {
        if (!NO_SEMICOLON_STARTS.includes(firstWord)) {
          // Ignorer si la ligne commence par un pur commentaire
          if (!line.startsWith('//')) {
            // Identifier la présence d'un commentaire en fin de ligne (pour insérer le ; au bon endroit)
            // Note: ne gère pas les '//' dans les chaînes de caractères parfaitement (trop complexe pour une regexp naïve), 
            // mais l'essentiel fera l'affaire.
            const commentIndex = line.indexOf('//');
            const quoteIndex = line.indexOf('"');
            const isInQuotes = quoteIndex !== -1 && quoteIndex < commentIndex && line.lastIndexOf('"') > commentIndex;
            
            if (commentIndex !== -1 && !isInQuotes) {
               const beforeComment = line.substring(0, commentIndex).trim();
               if (beforeComment.length > 0 && !beforeComment.endsWith(';')) {
                   line = beforeComment + ';' + ' ' + line.substring(commentIndex);
               }
            } else {
               line += ';';
            }
          }
        }
      }
    }

    // Injection finale dans le code formaté
    formattedLines.push(getIndentString(currentIndentLevel) + line);

    // --- ACCROISSEMENT D'INDENTATION (Pour les lignes suivantes) ---
    if (firstWord === 'VARIABLES') {
      stack.push('VARIABLES');
    } else if (firstWord === 'DEBUT') {
      stack.push('DEBUT');
    } else if (firstWord === 'SI') {
      stack.push('SI');
    } else if (firstWord === 'SINON') {
      stack.push('SINON');
    } else if (firstWord === 'SINON_SI') {
      stack.push('SINON_SI');
    } else if (firstWord === 'SELON') {
      stack.push('SELON');
    } else if (['CAS', 'AUTRE'].includes(firstWord)) {
      stack.push(firstWord);
    } else if (firstWord === 'POUR') {
      stack.push('POUR');
    } else if (firstWord === 'TANTQUE') {
      stack.push('TANTQUE');
    } else if (firstWord === 'REPETER') {
      stack.push('REPETER');
    }
  }

  // Dernière ligne vide (Prettier standard)
  if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
    formattedLines.push('');
  }

  return formattedLines.join('\n');
}
