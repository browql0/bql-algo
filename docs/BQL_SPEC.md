# Specification du langage BQL

Ce document est la source de verite utilisateur pour les exemples BQL. Le parser reste l'autorite technique: si un exemple complet apparait dans les cours, la documentation ou les snippets, il doit respecter ces regles.

## 1. Programme complet

Un programme complet commence par un en-tete colle ou separe par underscore, puis se termine par `FIN`.

```bql
ALGORITHME_Nom;
DEBUT
  ECRIRE("Bonjour");
FIN
```

Regles:

* `ALGORITHMENom;` et `ALGORITHME_Nom;` sont valides.
* `ALGORITHME Nom;` est interdit.
* Le point-virgule est obligatoire apres l'en-tete.
* L'ordre officiel est: `CONSTANTE(S)`, `TYPE`, `VARIABLE(S)`, `DEBUT`, instructions, `FIN`.

## 2. Types primitifs

```bql
ENTIER
REEL
CHAINE DE CARACTERE
CARACTERE
BOOLEEN
```

Le langage est insensible a la casse, mais les cours utilisent les mots-cles en majuscules.

## 3. Constantes

```bql
ALGORITHME_Constantes;
CONSTANTE
  TVA = 0.20 : REEL;
DEBUT
  ECRIRE(TVA);
FIN
```

Regles:

* `CONSTANTE` pour une seule constante.
* `CONSTANTES` pour deux constantes ou plus.
* Pas de `:` apres `CONSTANTE` ou `CONSTANTES`.
* Une constante ne peut pas etre modifiee apres declaration.

## 4. Variables

```bql
ALGORITHME_Variables;
VARIABLES
  age : ENTIER;
  nom : CHAINE DE CARACTERE;
DEBUT
  age <- 18;
  nom <- "Ali";
  ECRIRE(nom, ":", age);
FIN
```

Regles:

* `VARIABLE` pour une seule variable.
* `VARIABLES` pour deux variables ou plus.
* Pas de `:` apres `VARIABLE` ou `VARIABLES`.
* `;` obligatoire apres chaque declaration.

## 5. Tableaux et matrices

```bql
ALGORITHME_Tableaux;
VARIABLES
  Tableau T[3] : ENTIER;
  Tableau M[2,3] : ENTIER;
DEBUT
  T[0] <- 5;
  M[1,2] <- T[0];
  ECRIRE(M[1,2]);
FIN
```

Regles:

* Tableau 1D: `T[i]`.
* Matrice 2D: `M[i,j]`.
* Le format a deux paires de crochets est interdit pour les exemples BQL.
* `;` obligatoire apres declarations et affectations.

## 6. Affectation

```bql
x <- 5;
```

Regles:

* L'operateur officiel est `<-`.
* `=` sert aux comparaisons, pas aux affectations.
* `;` obligatoire apres chaque affectation.

## 7. Entree et sortie

```bql
ECRIRE("texte");
LIRE(x);
```

Regles:

* Parentheses obligatoires.
* `;` obligatoire apres `ECRIRE(...)` et `LIRE(...)`.
* La variable lue avec `LIRE` doit deja etre declaree.

## 8. Conditions

```bql
ALGORITHME_Condition;
VARIABLE
  note : ENTIER;
DEBUT
  note <- 14;
  SI note >= 16 ALORS
    ECRIRE("Tres bien");
  SINONSI note >= 10 ALORS
    ECRIRE("Admis");
  SINON
    ECRIRE("Recale");
  FINSI
FIN
```

Regles:

* `ALORS` est obligatoire.
* `FINSI` ferme le bloc.
* `SINONSI` est la forme standard dans tous les contenus.
* Les parentheses autour de la condition sont optionnelles.

## 9. Boucle POUR

```bql
ALGORITHME_BouclePour;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
```

Avec un pas:

```bql
ALGORITHME_BouclePas;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 10 A 0 PAS -2 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
```

Regles:

* `ALLANT DE` est obligatoire.
* `PAS` est optionnel quand le pas vaut 1.
* `FINPOUR` ferme le bloc.

## 10. Boucle TANTQUE

```bql
ALGORITHME_Tantque;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  TANTQUE x < 3 FAIRE
    x <- x + 1;
  FINTANTQUE
  ECRIRE(x);
FIN
```

## 11. Boucle REPETER

```bql
ALGORITHME_Repeter;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  REPETER
    x <- x + 1;
  JUSQUA x = 3
  ECRIRE(x);
FIN
```

Regles:

* `JUSQUA` ferme le bloc.
* Il n'existe pas de mot-cle de fermeture supplementaire pour `REPETER`.
* Pas de `;` apres la ligne `JUSQUA`.

## 12. SELON

```bql
ALGORITHME_Selon;
VARIABLE
  choix : ENTIER;
DEBUT
  choix <- 2;
  SELON choix FAIRE
    CAS 1:
      ECRIRE("Un");
    CAS 2:
      ECRIRE("Deux");
    AUTRE:
      ECRIRE("Autre");
  FINSELON
FIN
```

Regles:

* `SELON condition FAIRE` ouvre le bloc.
* `CAS valeur:` ouvre une branche.
* `AUTRE:` est optionnel.
* `FINSELON` ferme le bloc.

## 13. Enregistrements

```bql
ALGORITHME_Record;
TYPE Personne = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
Fin Personne
VARIABLE
  p : Personne;
DEBUT
  p.nom <- "Ali";
  p.age <- 20;
  ECRIRE(p.nom, ":", p.age);
FIN
```

Regles:

* Pas de `;` apres `ENREGISTREMENT`.
* `;` obligatoire apres chaque champ.
* Acces aux champs avec `.`.
* Les acces imbriques sont autorises: `p.naissance.jour`.

## 14. Motifs interdits

Ces formes ne doivent pas apparaitre comme exemples copiables:

* `ALGORITHME Nom;`
* `POUR i DE 0 A 10 FAIRE`
* `SINON SI condition ALORS`
* `M[i][j]`
* `x = 5;`
* `ECRIRE "texte";`
* `LIRE x;`
* `objet->champ`
* `FINREPETER`

## 15. Format standard des exemples complets

```bql
ALGORITHME_NomCourt;
CONSTANTE
  MAX = 10 : ENTIER;
VARIABLE
  x : ENTIER;
DEBUT
  x <- MAX;
  ECRIRE(x);
FIN
```

Tous les exemples complets doivent etre executables par `npm run test:examples`.
