import Lexer from '../lexer/Lexer.js';
import TokenType from '../lexer/tokenTypes.js';
import {
  assert,
  assertDeepEqual,
  assertEqual,
  assertHasErrors,
  isDirectRun,
  assertNoErrors,
  defineSuite,
  runSuites,
} from './testUtils.js';

function tokenize(source) {
  const lexer = new Lexer(source);
  const result = lexer.tokenize();
  const visibleTokens = result.tokens.filter(
    token => token.type !== TokenType.NEWLINE && token.type !== TokenType.EOF
  );

  return {
    tokens: visibleTokens,
    errors: result.errors,
    types: visibleTokens.map(token => token.type),
    values: visibleTokens.map(token => token.value),
  };
}

defineSuite('Lexer - official BQL specification', test => {
  test('recognizes keywords case-insensitively', () => {
    const { types, errors } = tokenize(`
      algorithme_Case;
      variables x : entier; y : reel;
      debut
        si x > 0 alors
          ecrire("ok");
        finsi
      fin
    `);

    assertNoErrors(errors);
    assert(types.includes(TokenType.ALGORITHME), 'ALGORITHME keyword missing');
    assert(types.includes(TokenType.VARIABLES), 'VARIABLES keyword missing');
    assert(types.includes(TokenType.TYPE_ENTIER), 'ENTIER type missing');
    assert(types.includes(TokenType.TYPE_REEL), 'REEL type missing');
    assert(types.includes(TokenType.DEBUT), 'DEBUT keyword missing');
    assert(types.includes(TokenType.SI), 'SI keyword missing');
    assert(types.includes(TokenType.ALORS), 'ALORS keyword missing');
    assert(types.includes(TokenType.ECRIRE), 'ECRIRE keyword missing');
    assert(types.includes(TokenType.FINSI), 'FINSI keyword missing');
    assert(types.includes(TokenType.FIN), 'FIN keyword missing');
  });

  test('tokenizes ALGORITHMENom and ALGORITHME_Nom for parser header validation', () => {
    const glued = tokenize('ALGORITHMENom;');
    const underscored = tokenize('ALGORITHME_Nom;');
    const spaced = tokenize('ALGORITHME Nom;');

    assertNoErrors(glued.errors);
    assertNoErrors(underscored.errors);
    assertNoErrors(spaced.errors);

    assertDeepEqual(glued.types, [
      TokenType.ALGORITHME,
      TokenType.IDENTIFIER,
      TokenType.SEMICOLON,
    ]);
    assertEqual(glued.values[1], 'Nom');

    assertDeepEqual(underscored.types, [
      TokenType.ALGORITHME,
      TokenType.IDENTIFIER,
      TokenType.SEMICOLON,
    ]);
    assertEqual(underscored.values[1], 'Nom');

    assertDeepEqual(spaced.types, [
      TokenType.ALGORITHME,
      TokenType.IDENTIFIER,
      TokenType.SEMICOLON,
    ]);
    assertEqual(spaced.values[1], 'Nom');
  });

  test('keeps VARIABLE and VARIABLES separate', () => {
    const { types, errors } = tokenize('VARIABLE x : ENTIER; VARIABLES x : ENTIER; y : ENTIER;');

    assertNoErrors(errors);
    assertEqual(types[0], TokenType.VARIABLE);
    assertEqual(types[5], TokenType.VARIABLES);
  });

  test('recognizes official SINONSI token', () => {
    const { types, errors } = tokenize('SINONSI x = 0 ALORS');

    assertNoErrors(errors);
    assertDeepEqual(types, [
      TokenType.SINON_SI,
      TokenType.IDENTIFIER,
      TokenType.EQ,
      TokenType.NUMBER,
      TokenType.ALORS,
    ]);
  });

  test('recognizes official primitive types', () => {
    const { types, errors } = tokenize(`
      ENTIER
      REEL
      CHAINE DE CARACTERE
      CARACTERE
      BOOLEEN
    `);

    assertNoErrors(errors);
    assertDeepEqual(types, [
      TokenType.TYPE_ENTIER,
      TokenType.TYPE_REEL,
      TokenType.TYPE_CHAINE,
      TokenType.TYPE_CARACTERE,
      TokenType.TYPE_BOOLEEN,
    ]);
  });

  test('tokenizes arrays, matrices, records, assignment, and punctuation', () => {
    const { types, errors } = tokenize('Tableau M[2,3] : ENTIER; M[i,j] <- e.naissance.jour; ECRIRE(M[i,j]);');

    assertNoErrors(errors);
    for (const expected of [
      TokenType.TABLEAU,
      TokenType.LBRACKET,
      TokenType.COMMA,
      TokenType.RBRACKET,
      TokenType.COLON,
      TokenType.SEMICOLON,
      TokenType.ASSIGN,
      TokenType.DOT,
      TokenType.LPAREN,
      TokenType.RPAREN,
    ]) {
      assert(types.includes(expected), `${expected} token missing`);
    }
  });

  test('does not normalize M[i][j] into matrix syntax', () => {
    const { types, errors } = tokenize('M[i][j]');

    assertNoErrors(errors);
    assertDeepEqual(types, [
      TokenType.IDENTIFIER,
      TokenType.LBRACKET,
      TokenType.IDENTIFIER,
      TokenType.RBRACKET,
      TokenType.LBRACKET,
      TokenType.IDENTIFIER,
      TokenType.RBRACKET,
    ]);
  });

  test('rejects unsupported record arrow operator', () => {
    const { types, errors } = tokenize('e->nom;');

    assertHasErrors(errors);
    assert(types.includes(TokenType.UNKNOWN), 'Expected UNKNOWN token for ->');
  });
});

if (isDirectRun(import.meta.url)) {
  await runSuites();
}
