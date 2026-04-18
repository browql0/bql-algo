# BQL Beginner Curriculum

This curriculum is the product-level learning path for BQL Algo. `docs/BQL_SPEC.md` defines valid syntax; this document defines what beginners should learn and how lessons should use visual learning.

## Lesson Audit

Strengths:

* The project already covers foundations, conditions, loops, arrays, matrices, records, and challenge-style practice.
* The lesson renderer already includes visualizers for variables, expressions, branches, loops, accumulators, array traversal, search, max/min, sums, copies, reversals, shifts, matrices, and records.
* Most examples follow the official BQL syntax: `ALLANT DE`, `SINONSI`, `M[i,j]`, assignment with `<-`, semicolons, and full `ALGORITHME_...; DEBUT ... FIN` structure.

Gaps fixed in this pass:

* The product was still organized as 6 levels. It now has the official 7-level progression.
* Arrays and matrices were previously coupled in the roadmap. They are now separate levels.
* Level 4 had bubble sort but lacked selection sort and insertion sort. Both are now added with visualizers.
* Advanced logic had no dedicated course. Level 7 now covers decomposition, combined logic, debugging, mini-projects, and structure choice.
* Teacher rubrics now exist for challenge evaluation.
* Level 7 project metadata now describes required modules, minimum features, weights, hidden scenarios, and maintainability signals.
* Dedicated visualizers now teach SELON vs repeated SI, sorting cost, and before/after debugging traces.

Gaps to improve next:

* Add teacher-facing rubrics for every challenge.
* Add more validation metadata for the new Level 7 mini-project lessons.
* Add a dedicated `SELON` visualizer that compares menu flow against repeated `SI`.
* Add visualizers for sorting complexity and before/after debugging traces.

## New Roadmap

### Level 1 - Foundations

Goal: write small complete BQL programs and understand execution step by step.

Teach:

1. What is an algorithm?
2. How a program runs step by step.
3. `ALGORITHME_Nom;`, `DEBUT`, `FIN`.
4. `ECRIRE`.
5. `LIRE`.
6. Variables.
7. Constants.
8. Types: `ENTIER`, `REEL`, `CHAINE DE CARACTERE`, `BOOLEEN`, `CARACTERE`.
9. Assignment with `<-`.
10. Arithmetic operations and precedence.
11. Boolean basics with `ET` and `OU`.
12. Choosing variable names.
13. Beginner debugging basics.

Visualizers:

* Execution flow diagram.
* Variable memory boxes.
* Expression calculation steps.
* Truth table and boolean logic visualizers for `ET` / `OU`.
* Debug trace examples.

### Level 2 - Conditions + SELON

Goal: make decisions clearly.

Teach:

1. Comparisons: `=`, `!=`, `<`, `>`, `<=`, `>=`.
2. Simple `SI`.
3. `SI` + `SINON`.
4. `SINONSI`.
5. Nested conditions.
6. Boolean logic with `ET`, `OU`, `NON`.
7. `SELON`, `CAS`, `AUTRE`, `FINSELON`.
8. Difference between `SI` and `SELON`.

Use `SI` when:

* The decision uses ranges.
* The condition combines several tests.
* Different variables are involved.

Use `SELON` when:

* One variable has many exact values.
* You are building a menu.
* Repeated `SI` blocks would be noisy.

Visualizers:

* Branching tree.
* Path highlighting.
* Menu choice flow.
* `SI` vs `SELON` comparison diagram.

### Level 3 - Loops

Goal: repeat work safely and predictably.

Teach:

1. `POUR`.
2. `ALLANT DE`.
3. `PAS`.
4. `TANTQUE`.
5. `REPETER` / `JUSQUA`.
6. Counters.
7. Accumulators.
8. Nested loops.

Visualizers:

* Iteration counter.
* Loop timeline.
* Accumulator growth.
* Nested loop grid.

### Level 4 - Arrays + Sorting

Goal: store and process one-dimensional lists.

Teach:

1. `Tableau T[n]`.
2. Indexing with `T[i]`.
3. Traversal.
4. Sum, average, max, min.
5. Search.
6. Reverse.
7. Duplicates.
8. Bubble sort.
9. Selection sort.
10. Insertion sort.

Visualizers:

* Array traversal.
* Active index highlight.
* Search target.
* Swap animation.
* Sorted zone vs unsorted zone.
* Minimum pointer for selection sort.
* Key/decalage view for insertion sort.

### Level 5 - Matrices

Goal: understand two-dimensional data.

Teach:

1. `Tableau M[lignes,colonnes]`.
2. Access with `M[i,j]`.
3. Nested loops.
4. Row sums.
5. Column sums.
6. Diagonal.
7. Transpose.
8. Search.

Visualizers:

* Matrix grid.
* Active cell highlight.
* Row/column scans.
* Nested loop movement.

### Level 6 - Records / Structures

Goal: model structured real-world data.

Teach:

1. `TYPE ... ENREGISTREMENT`.
2. Fields.
3. Reading and writing fields.
4. Nested records.
5. Arrays of records.
6. Student/product/employee models.

Visualizers:

* Expandable record cards.
* Object field trees.
* Array-of-records table view.

### Level 7 - Advanced Logic

Goal: combine concepts into complete beginner projects.

Teach:

1. Decomposition.
2. Multi-step problems.
3. Arrays + loops + conditions.
4. Records + logic.
5. Debugging strategies.
6. Choosing the best structure.
7. Mini projects.

Visualizers:

* Algorithm flowcharts.
* Data flow maps.
* Execution trace panels.
* Project state simulations.

## Implemented Lesson Improvements

* Course seed now declares seven courses matching the official roadmap.
* Level 4 includes new lessons for selection sort and insertion sort.
* Level 7 includes five new lessons:
  * Decomposer un probleme.
  * Combiner tableaux, boucles et conditions.
  * Tracer et deboguer un algorithme.
  * Mini-projet : gestion de notes.
  * Choisir la bonne structure.
* Frontend course cards now support the seventh level and its lesson count.
* Lesson rendering now maps the new lesson types to visual-first renderers.
* Challenge lessons can expose a collapsed teacher guide with objective, concepts, common mistakes, partial success, accepted alternatives, and grading hints.
* Advanced project lessons can expose project metadata for future validation and teacher assessment.

## Teacher Rubric Model

Each rubric supports:

* `challengeId`
* `objective`
* `difficulty`
* `estimatedMinutes`
* `concepts`
* `commonMistakes`
* `partialSuccess`
* `acceptableAlternatives`
* `misconceptions`
* `gradingHints`

Rubrics are stored in `src/data/teacherRubrics.js`.

## Level 7 Metadata Model

Advanced projects support:

* `requiredModules`
* `minimumFeatures`
* `optionalBonusFeatures`
* `complexityExpectations`
* `structureSuggestions`
* `multipleSuccessPaths`
* `scoringWeights`
* `hiddenScenarios`
* `edgeCases`
* `maintainabilitySignals`

Metadata is stored in `src/data/advancedProjectMetadata.js` and mirrored into Level 7 seed `test_cases` for future backend validation.

## New Lesson Ideas

High-impact next lessons:

1. Level 1: "Lire, calculer, afficher" with input/output visual trace.
2. Level 2: "Menu avec SELON" with a menu-flow visualizer.
3. Level 3: "Menu repete avec REPETER/JUSQUA".
4. Level 4: "Detecter les doublons".
5. Level 5: "Sommes par ligne et par colonne".
6. Level 6: "Tableau de produits et total de facture".
7. Level 7: "Mini-projet bulletin de classe" with strict validation metadata.

## Implementation Plan

Done now:

1. Align the course seed to the official 7-level structure.
2. Split matrix learning into its own level.
3. Add missing sorting lessons and visualizers.
4. Add the advanced logic course and first lessons.
5. Update the course grid assumptions for seven levels.

Next:

1. Add validation metadata to every new advanced challenge.
2. Add a dedicated `SELON` visualizer.
3. Add a reusable execution-trace visualizer for debugging lessons.
4. Add teacher rubrics and expected misconceptions per challenge.
