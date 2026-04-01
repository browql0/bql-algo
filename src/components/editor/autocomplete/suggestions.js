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
  'POUR', 'ALLANT', 'DE', 'A', 'PAS', 'FINPOUR',
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
    insertText: 'SI () ALORS\n  \nFINSI',
    cursorOffset: -16,
  },
  {
    label: 'SI ... SINON',
    detail: 'Structure conditionnelle complète',
    type: 'snippet',
    insertText: 'SI () ALORS\n  \nSINON\n  \nFINSI',
    cursorOffset: -25,
  },
  {
    label: 'POUR (boucle)',
    detail: 'Boucle avec compteur',
    type: 'snippet',
    insertText: 'POUR i ALLANT DE 1 A 10 FAIRE\n  \nFINPOUR',
    cursorOffset: -8,
  },
  {
    label: 'POUR avec PAS (boucle)',
    detail: 'Boucle avec pas spécifique',
    type: 'snippet',
    insertText: 'POUR i ALLANT DE 10 A 1 PAS -1 FAIRE\n  \nFINPOUR',
    cursorOffset: -8,
  },
   {
    label: 'SELON (choix) faire',
    detail: 'Choix multiple',
    type: 'snippet',
    insertText: 'SELON () FAIRE\n  cas  :\n  autre: ; \nFINSELON',
    cursorOffset: -37,
  },
  {
    label: 'TANTQUE (boucle)',
    detail: 'Boucle conditionnelle',
    type: 'snippet',
    insertText: 'TANTQUE () FAIRE\n  \nFINTANTQUE',
    cursorOffset: -21,
  },
  {
    label: 'REPETER (boucle)',
    detail: 'Boucle avec condition de sortie',
    type: 'snippet',
    insertText: 'REPETER\n  \nJUSQUA ()',
    cursorOffset: -1,
  },
  {
    label: 'ALGORITHME (Structure)',
    detail: 'Structure de base d\'un algorithme',
    type: 'snippet',
    insertText: 'ALGORITHME_BQL;\nVARIABLES:\n  \nDEBUT\n  \nFIN',
    cursorOffset: -13,
  },
  {
    label: 'ECRIRE("...")',
    detail: 'Afficher dans le terminal',
    type: 'snippet',
    insertText: 'ECRIRE("");',
    cursorOffset: -3,
  },
  {
    label: 'LIRE(...)',
    detail: 'Demander une saisie utilisateur',
    type: 'snippet',
    insertText: 'LIRE();',
    cursorOffset: -2,
  },
  {
    label: 'Tableau (Déclaration)',
    detail: 'Déclaration d\'un tableau 1D',
    type: 'snippet',
    insertText: 'Tableau T[10] : ENTIER;',
    cursorOffset: -12,
  }
];

// Mots-clés simples : ECRIRE et LIRE sont exclus ici car
// ils ont leurs propres entrées keyword + snippet ci-dessous
const KEYWORDS_NO_IO = KEYWORDS.filter(kw => kw !== 'ECRIRE' && kw !== 'LIRE');

export const globalSuggestions = [
  ...SNIPPETS,
  // Mots-clés sans ECRIRE/LIRE (pour éviter le doublon avec les snippets)
  ...KEYWORDS_NO_IO.map(kw => ({
    label: kw,
    detail: 'Mot-clé',
    type: 'keyword',
    insertText: kw + (['ALGORITHME', 'VARIABLES', 'DEBUT', 'FIN'].includes(kw) ? '' : ' ')
  })),
  // ECRIRE : suggestion mot-clé simple
  {
    label: 'ECRIRE',
    detail: 'Mot-clé (écriture)',
    type: 'keyword',
    insertText: 'ECRIRE ',
  },
  // LIRE : suggestion mot-clé simple
  {
    label: 'LIRE',
    detail: 'Mot-clé (lecture)',
    type: 'keyword',
    insertText: 'LIRE ',
  },
  ...TYPES.map(t => ({
    label: t,
    detail: 'Type natif',
    type: 'type',
    insertText: t + ';'
  }))
];
