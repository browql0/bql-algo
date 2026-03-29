/**
 * suggestions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dictionnaires des mots-clés, types et snippets pour l'auto-complétion BQL.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const KEYWORDS = [
  'ALGORITHME', 'VARIABLES:', 'DEBUT', 'FIN', 
  'ECRIRE', 'LIRE', 
  'SI', 'ALORS', 'SINON', 'FINSI',
  'POUR', 'DE', 'A', 'PAS', 'FINPOUR',
  'TANTQUE', 'FAIRE', 'FINTANTQUE',
  'REPETER', 'JUSQUA',
  'VRAI', 'FAUX', 'NON', 'ET', 'OU'
];

export const TYPES = [
  'ENTIER', 'REEL', 'CHAINE', 'CARACTERE', 'BOOLEEN', 'CHAINE DE CARACTERE'
];

export const SNIPPETS = [
  {
    label: 'SI ... ALORS',
    detail: 'Structure conditionnelle simple',
    type: 'snippet',
    insertText: 'SI condition ALORS\n  \nFINSI',
    cursorOffset: -12 // Place le curseur sur "condition" idéalement
  },
  {
    label: 'SI ... SINON',
    detail: 'Structure conditionnelle complète',
    type: 'snippet',
    insertText: 'SI condition ALORS\n  \nSINON\n  \nFINSI',
  },
  {
    label: 'POUR (boucle)',
    detail: 'Boucle avec compteur',
    type: 'snippet',
    insertText: 'POUR i DE 1 A 10 PAS 1\n  \nFINPOUR',
  },
  {
    label: 'TANTQUE (boucle)',
    detail: 'Boucle conditionnelle',
    type: 'snippet',
    insertText: 'TANTQUE condition FAIRE\n  \nFINTANTQUE',
  },
  {
    label: 'REPETER (boucle)',
    detail: 'Boucle avec condition de sortie',
    type: 'snippet',
    insertText: 'REPETER\n  \nJUSQUA condition',
  },
  {
    label: 'ALGORITHME (Structure)',
    detail: 'Structure de base d\'un algorithme',
    type: 'snippet',
    insertText: 'ALGORITHMENomProgramme;\nVARIABLES:\n  \nDEBUT\n  \nFIN',
  },
  {
    label: 'ECRIRE(…)',
    detail: 'Afficher dans le terminal',
    type: 'snippet',
    insertText: 'ECRIRE("")',
  },
  {
    label: 'LIRE(…)',
    detail: 'Demander une saisie utilisateur',
    type: 'snippet',
    insertText: 'LIRE()',
  }
];

export const globalSuggestions = [
  ...KEYWORDS.map(kw => ({
    label: kw,
    detail: 'Mot-clé',
    type: 'keyword',
    insertText: kw + (['ALGORITHME', 'VARIABLES', 'DEBUT', 'FIN'].includes(kw) ? '' : ' ')
  })),
  ...TYPES.map(t => ({
    label: t,
    detail: 'Type natif',
    type: 'type',
    insertText: t + ';'
  })),
  ...SNIPPETS
];
