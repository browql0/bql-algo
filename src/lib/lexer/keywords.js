/**
 * keywords.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Table de correspondance entre les mots-clés du pseudo-langage marocain
 * et leurs TokenType respectifs.
 *
 * Règles importantes :
 *  1. Les mots-clés composés ("SINON SI", "CHAINE DE CARACTERE") sont
 *     détectés en priorité par le lexer, AVANT les mots simples.
 *  2. La comparaison est INSENSIBLE À LA CASSE — le lexer normalise en
 *     toUpperCase() avant le lookup, donc "ecrire", "Ecrire" et "ECRIRE"
 *     produisent tous le même token ECRIRE.
 *  3. Les identifiants peuvent contenir des lettres, chiffres et underscores.
 *     Exemple : Mon_Algo, compteur_1  sont tous valides.
 *  4. VRAI / FAUX sont des valeurs booléennes, pas de simples mots-clés ;
 *     le lexer leur assigne TokenType.BOOLEAN avec la valeur booléenne JS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import TokenType from './tokenTypes.js';

// ── Mots-clés composés (ordre : du plus long au plus court) ─────────────────
// Le lexer tente une correspondance sur plusieurs mots consécutifs.
export const COMPOUND_KEYWORDS = [
  { words: ['SINON', 'SI'],                 type: TokenType.SINON_SI    },
  { words: ['CHAINE', 'DE', 'CARACTERE'],   type: TokenType.TYPE_CHAINE },
  { words: ['ALLANT', 'DE'],                type: TokenType.ALLANT_DE   }, // ALLANT DE → token composé pour POUR
  { words: ['FIN', 'TANTQUE'],              type: TokenType.FINTANTQUE  },
  { words: ['FIN', 'POUR'],                 type: TokenType.FINPOUR     },
  { words: ['FIN', 'SI'],                   type: TokenType.FINSI       },
  { words: ['FIN', 'SELON'],                type: TokenType.FINSELON    },
];

// ── Mots-clés simples ─────────────────────────────────────────────────────────
export const SIMPLE_KEYWORDS = new Map([
  // Structure
  ['ALGORITHME',  TokenType.ALGORITHME  ],
  ['VARIABLES',   TokenType.VARIABLES   ],  // plusieurs variables
  ['VARIABLE',    TokenType.VARIABLE    ],  // une seule variable
  ['CONSTANTES',  TokenType.CONSTANTES  ],  // plusieurs constantes
  ['CONSTANTE',   TokenType.CONSTANTE   ],  // une seule constante
  ['TABLEAU',     TokenType.TABLEAU     ],
  ['TYPE',        TokenType.TYPE        ],
  ['ENREGISTREMENT', TokenType.ENREGISTREMENT ],
  ['DEBUT',       TokenType.DEBUT       ],
  ['FIN',         TokenType.FIN         ],

  // Condition
  ['SI',          TokenType.SI          ],
  ['ALORS',       TokenType.ALORS       ],
  ['SINON',       TokenType.SINON       ],
  ['FINSI',       TokenType.FINSI       ],
  ['SELON',       TokenType.SELON       ],
  ['CAS',         TokenType.CAS         ],
  ['AUTRE',       TokenType.AUTRE       ],
  ['FINSELON',    TokenType.FINSELON    ],
  ['FAIRE',       TokenType.FAIRE       ],

  // Boucle
  ['TANTQUE',     TokenType.TANTQUE     ],
  ['FINTANTQUE',  TokenType.FINTANTQUE  ],
  ['POUR',        TokenType.POUR        ],
  ['ALLANT',      TokenType.ALLANT      ], // mot simple (cas où 'DE' ne suit pas)
  ['FINPOUR',     TokenType.FINPOUR     ],
  ['REPETER',     TokenType.REPETER     ],
  ['JUSQUA',      TokenType.JUSQUA      ],

  // Entrée / Sortie
  ['ECRIRE',      TokenType.ECRIRE      ],
  ['LIRE',        TokenType.LIRE        ],

  // Logique
  ['ET',          TokenType.ET          ],
  ['OU',          TokenType.OU          ],
  ['NON',         TokenType.NON         ],
  ['MOD',         TokenType.MOD         ],  // opérateur modulo (mot-clé)

  // Types de données
  ['ENTIER',      TokenType.TYPE_ENTIER    ],
  ['REEL',        TokenType.TYPE_REEL      ],
  ['CARACTERE',   TokenType.TYPE_CARACTERE ],
  ['BOOLEEN',     TokenType.TYPE_BOOLEEN   ],

  // Valeurs booléennes (gérées séparément → token BOOLEAN)
  ['VRAI',        TokenType.BOOLEAN     ],
  ['FAUX',        TokenType.BOOLEAN     ],
]);

/**
 * Retourne la valeur JS associée à un mot-clé booléen.
 * @param {string} word - Mot en MAJUSCULES
 * @returns {boolean|null}
 */
export function getBooleanValue(word) {
  if (word === 'VRAI') return true;
  if (word === 'FAUX') return false;
  return null;
}
