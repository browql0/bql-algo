# BQL Algo

BQL Algo is an interactive platform for learning algorithmics with an executable pseudo-language inspired by classroom algorithm notation. Students can read lessons, write BQL code, run it in the browser, and validate exercises.

## Product Goal

Help beginners move from paper algorithms to executable logic:

* understand variables, types, conditions, loops, arrays, matrices, and records
* run examples immediately
* receive syntax and runtime feedback
* practice with progressive lessons and challenges

## Core Features

* Custom BQL lexer, parser, semantic analyzer, and interpreter
* Browser editor with highlighting and snippets
* Interactive terminal with `ECRIRE` and `LIRE`
* Course and progress system
* Challenge validation through hidden server-side tests
* Admin analytics and user tracking

## Official Example

Every full BQL example should follow the same structure:

```bql
ALGORITHME_Comparaison;
VARIABLES
  x : ENTIER;
  y : ENTIER;
DEBUT
  x <- 42;
  y <- 10;

  SI x > y ALORS
    ECRIRE("Le plus grand est ", x);
  SINON
    ECRIRE("Le plus grand est ", y);
  FINSI
FIN
```

## BQL Truth Rule

The parser is the technical source of truth, and `docs/BQL_SPEC.md` is the user-facing source of truth. All lessons, snippets, docs, and examples must pass:

```bash
npm run test:examples
```

## Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm test
npm run test:examples
npm run build
```

## Documentation

* `docs/BQL_SPEC.md` - official syntax rules
* `docs/BEGINNER_CURRICULUM.md` - beginner curriculum and sample lessons

## Author

Hajjaj Ali
