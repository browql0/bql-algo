/**
 * tokenTypes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Enumération de tous les types de tokens reconnus par le lexer.
 * Utilisez ces constantes dans le lexer, le parser et l'AST.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TokenType = Object.freeze({

  // ── Littéraux ──────────────────────────────────────────────────────────────
  NUMBER:       'NUMBER',       // entier ou réel  ex: 42, 3.14
  STRING:       'STRING',       // chaîne entre "…"
  CHAR:         'CHAR',         // caractère entre '…'
  IDENTIFIER:   'IDENTIFIER',  // nom de variable / fonction défini par l'utilisateur
  BOOLEAN:      'BOOLEAN',      // VRAI | FAUX

  // ── Mots-clés de structure ─────────────────────────────────────────────────
  ALGORITHME:   'ALGORITHME',
  VARIABLES:    'VARIABLES',   // déclaration : plusieurs variables
  VARIABLE:     'VARIABLE',   // déclaration : une seule variable
  CONSTANTES:   'CONSTANTES',  // section constantes : plusieurs
  CONSTANTE:    'CONSTANTE',   // section constantes : une seule
  TABLEAU:      'TABLEAU',    // déclaration de tableau
  TYPE:         'TYPE',        // déclaration d'enregistrement
  ENREGISTREMENT: 'ENREGISTREMENT', // structure d'enregistrement
  DEBUT:        'DEBUT',
  FIN:          'FIN',

  // ── Mots-clés de condition ─────────────────────────────────────────────────
  SI:           'SI',
  ALORS:        'ALORS',
  SINON_SI:     'SINON_SI',     // SINON SI (deux mots traités comme un seul token)
  SINON:        'SINON',
  FINSI:        'FINSI',
  SELON:        'SELON',
  CAS:          'CAS',          // valeur:
  AUTRE:        'AUTRE',        // optionnel, fallback
  FINSELON:     'FINSELON',     // fin du bloc SELON
  FAIRE:        'FAIRE',        // utilisé aussi dans SELON … FAIRE

  // ── Mots-clés de boucle ────────────────────────────────────────────────────
  TANTQUE:      'TANTQUE',
  FINTANTQUE:   'FINTANTQUE',
  POUR:         'POUR',
  ALLANT:       'ALLANT',       // ALLANT (partie de "ALLANT DE")
  ALLANT_DE:    'ALLANT_DE',   // ALLANT DE (token composé)
  DE:           'DE',
  A:            'A',
  PAS:          'PAS',
  FINPOUR:      'FINPOUR',
  REPETER:      'REPETER',
  JUSQUA:       'JUSQUA',

  // ── Entrée / Sortie ────────────────────────────────────────────────────────
  ECRIRE:       'ECRIRE',
  LIRE:         'LIRE',

  // ── Opérateurs logiques ────────────────────────────────────────────────────
  ET:           'ET',
  OU:           'OU',
  NON:          'NON',

  // ── Types de données ───────────────────────────────────────────────────────
  TYPE_ENTIER:          'TYPE_ENTIER',
  TYPE_REEL:            'TYPE_REEL',
  TYPE_CHAINE:          'TYPE_CHAINE',    // CHAINE DE CARACTERE
  TYPE_CARACTERE:       'TYPE_CARACTERE', // CARACTERE
  TYPE_BOOLEEN:         'TYPE_BOOLEEN',

  // ── Affectation ────────────────────────────────────────────────────────────
  ASSIGN:       'ASSIGN',       // <- ou ←

  // ── Opérateurs arithmétiques ───────────────────────────────────────────────
  PLUS:         'PLUS',         // +
  MINUS:        'MINUS',        // -
  MULTIPLY:     'MULTIPLY',     // *
  DIVIDE:       'DIVIDE',       // /
  MOD:          'MOD',          // %
  POWER:        'POWER',        // ^

  // ── Opérateurs de comparaison ──────────────────────────────────────────────
  EQ:           'EQ',           // =
  NE:           'NE',           // !=
  LT:           'LT',           // <
  LTE:          'LTE',          // <=
  GT:           'GT',           // >
  GTE:          'GTE',          // >=

  // ── Symboles de ponctuation ────────────────────────────────────────────────
  LPAREN:       'LPAREN',       // (
  RPAREN:       'RPAREN',       // )
  LBRACKET:     'LBRACKET',     // [
  RBRACKET:     'RBRACKET',     // ]
  COMMA:        'COMMA',        // ,
  COLON:        'COLON',        // :
  SEMICOLON:    'SEMICOLON',    // ;
  DOT:          'DOT',          // .

  // ── Structure du flux ──────────────────────────────────────────────────────
  NEWLINE:      'NEWLINE',      // \n
  EOF:          'EOF',          // fin de fichier

  // ── Erreur lexicale ────────────────────────────────────────────────────────
  UNKNOWN:      'UNKNOWN',      // caractère inconnu (erreur récupérable)
});

export default TokenType;
