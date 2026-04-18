import { Code, Box, Layers, Zap, AlignLeft, RefreshCcw } from 'lucide-react';

export const courseCategories = [
  {
    id: 'bases',
    title: "Bases de l'algorithmique",
    description: "Découvrez les variables, types de données et opérations fondamentales.",
    icon: AlignLeft,
    progress: 100,
    chapters: [
      {
        id: 'c1',
        title: "Introduction et Affichage",
        content: `L'algorithmique est la première étape pour apprendre à programmer. 
En BQL, vous pouvez afficher du texte en utilisant l'instruction \`ECRIRE\`.

### Pourquoi apprendre l'algorithmique ?
Avant d'écrire en Python, JavaScript ou C++, il est crucial de comprendre la logique du code. 
L'algorithmique nous permet de formuler des solutions indépendamment de la syntaxe compliquée d'un langage spécifique.

### Affichage simple
Pour afficher un message à l'écran, on utilise :
\`\`\`bql
ECRIRE("Bonjour le monde !")
\`\`\`

Cliquez sur le bouton ci-dessous pour lancer ce code directement dans l'éditeur interactif.`,
        codeExample: `// Mon premier programme !
ECRIRE("Bonjour le monde !")
`
      },
      {
        id: 'c2',
        title: "Variables et Affectation",
        content: `Une variable est un espace mémoire qui permet de stocker une information.
        
En BQL, on stocke une donnée dans une variable avec l'opérateur d'affectation \`<-\`.
Les types (Entier, Chaine de caractères, Booleen) sont gérés automatiquement par l'environnement.

### Exemple
\`\`\`bql
vies <- 3
vies <- vies - 1
\`\`\``,
        codeExample: `age <- 25
nom <- "Alice"
ECRIRE("Je m'appelle ", nom, " et j'ai ", age, " ans.")

// Modification d'une variable
age <- age + 1
ECRIRE("L'année d'après, j'aurai ", age, " ans.")
`
      }
    ]
  },
  {
    id: 'control',
    title: "Structures de contrôle",
    description: "Maîtrisez les conditions SI et les boucles POUR, TANTQUE.",
    icon: RefreshCcw,
    progress: 40,
    chapters: [
      {
        id: 'c3',
        title: "Les conditions (SI ... ALORS)",
        content: `Les instructions conditionnelles permettent d'exécuter un bloc de code uniquement si une certaine condition est remplie.
C'est le cur de l'intelligence d'un programme !

### Structure
\`\`\`bql
SI condition ALORS
  // code
SINON
  // code alternatif
FINSI
\`\`\``,
        codeExample: `note <- 14

ECRIRE("Analyse de la note : ", note)

SI note >= 10 ALORS
  ECRIRE("Résultat : Admis")
SINON
  ECRIRE("Résultat : Recalé")
FINSI
`
      },
      {
        id: 'c4',
        title: "La boucle POUR",
        content: `La boucle \`POUR\` est idéale quand on connaît à l'avance le nombre exact de répétitions à effectuer.

### Syntaxe
\`\`\`bql
POUR i ALLANT DE départ A arrivée FAIRE
  // instructions répétées
FINPOUR
\`\`\``,
        codeExample: `ECRIRE("Début du compte à rebours...")

POUR i ALLANT DE 5 A 1 PAS -1 FAIRE
  ECRIRE(i)
FINPOUR

ECRIRE("Décollage !")
`
      },
      {
        id: 'c5',
        title: "La boucle TANTQUE",
        content: `La boucle \`TANTQUE\` répète un bloc d'instructions **tant que** la condition spécifiée est VRAIE.
Elle est indispensable lorsque le nombre d'itérations n'est pas connu d'avance.`,
        codeExample: `energie <- 30

TANTQUE energie > 0 FAIRE
  ECRIRE("Energie actuelle : ", energie, " -> on court !")
  energie <- energie - 10
FINTANTQUE

ECRIRE("Plus d'énergie, on se repose.")
`
      }
    ]
  },
  {
    id: 'arrays',
    title: "Tableaux & Matrices",
    description: "Apprenez à stocker et manipuler des listes contenant plusieurs éléments.",
    icon: Layers,
    progress: 0,
    chapters: [
      {
        id: 'c6',
        title: "Les Tableaux",
        content: `Un tableau (ou liste) permet de stocker plusieurs valeurs sous un même nom de variable. Les indices commencent souvent à 0.

Pour déclarer un tableau, utilisez les crochets \`[]\`.`,
        codeExample: `scores <- [12, 15, 18, 9]

// Accès au premier élément
ECRIRE("Le premier score est : ", scores[0])

// On peut les parcourir
POUR i ALLANT DE 0 A 3 FAIRE
  ECRIRE("Score ", i, " = ", scores[i])
FINPOUR
`
      }
    ]
  },
  {
    id: 'advanced',
    title: "Structures Avancées",
    description: "Fonctions, procédures et enregistrements. (Concepts avancés)",
    icon: Zap,
    progress: 0,
    chapters: [
      {
        id: 'c7',
        title: "Bientôt disponible",
        content: `Les cours sur les sous-programmes et les structures avancées sont en cours de rédaction ! 
Revenez bientôt POUR plus ALLANT DE contenu.`,
        codeExample: `ECRIRE("A suivre...")`
      }
    ]
  }
];

