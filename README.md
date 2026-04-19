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

## Validation API (CORS / origins)

The validation endpoint (`/api/submit`) enforces an origin allowlist. Configure it with:

* `SUBMISSION_ALLOWED_ORIGINS` - comma-separated list of allowed origins.
  * Supports exact origins: `https://algo.example.com`
  * Supports safe wildcard hostnames (single-label `*`):
    * `https://your-project-*.vercel.app`
    * `https://*.vercel.app` (broader; only use if you accept any Vercel app)
* `VERCEL_URL` (provided by Vercel) is auto-allowed and can be used as a fallback.

Local development:

* The dev server accepts `http://localhost:<any>` and `http://127.0.0.1:<any>`.
* You can still be explicit with `SUBMISSION_ALLOWED_ORIGINS` if you want to lock it down.

Example `.env` for local dev:

```
SUBMISSION_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Example Vercel production + preview:

```
SUBMISSION_ALLOWED_ORIGINS=https://your-domain.com,https://your-project.vercel.app,https://your-project-*.vercel.app
```

Validation secrets live in `private.lesson_secrets` and are accessed via the `public.get_lesson_secrets` RPC so the `private` schema stays hidden. Run [database/validation_secrets_rpc.sql](database/validation_secrets_rpc.sql) in Supabase to install the function.

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
