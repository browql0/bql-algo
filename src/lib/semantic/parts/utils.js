import { NodeType } from '../../parser/AST/nodes.js';

// type_cible → types_source_acceptés (valeurs littérales de nœuds)
export const TYPE_COMPAT = {
  entier:    ['entier', 'reel'],
  reel:      ['entier', 'reel'],
  chaine:    ['chaine', 'caractere'],
  caractere: ['caractere', 'chaine'],
  booleen:   ['booleen'],
};

// ── Inférence de type à partir d'un nœud littéral ────────────────────────────
export function inferNodeType(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return Number.isInteger(node.value) ? 'entier' : 'reel';
    case NodeType.STRING:    return 'chaine';
    case NodeType.CHAR:      return 'caractere';
    case NodeType.BOOLEAN:   return 'booleen';
    default:                 return null; // inconnu (expression composite)
  }
}

/**
 * Vérifie qu'un nom de variable est valide (pas un résidu d'erreur de parsing).
 * Le parser peut produire '?' comme nom de variable en cas d'erreur de récupération.
 * Ces nœuds ne doivent pas générer d'erreurs sémantiques supplémentaires.
 *
 * @param {string|any} name
 * @returns {boolean} true si le nom est valide et doit être analysé
 */
export function isValidVariableName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name === '?') return false;  // résidu d'erreur de parsing
  if (name.trim() === '') return false;
  return true;
}
